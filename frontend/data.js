(function() {
    const STORAGE_KEY = 'floral-circular-demo-v1';
    const initialData = {
        demo: true,
        pickups: [
            { id: 'PU-2048', source: 'Jammu collection point A', bin: 'BIN-014', vendor: 'North Route Services (demo)', date: '2026-10-18', window: '08:00–09:00', status: 'Scheduled', quantity: null, evidence: '', verified: false },
            { id: 'PU-2047', source: 'Jammu collection point B', bin: 'BIN-021', vendor: 'North Route Services (demo)', date: '2026-10-18', window: '09:30–10:30', status: 'Collected', quantity: 12.4, evidence: 'Collection photo recorded (demo)', verified: true },
            { id: 'PU-2046', source: 'Jammu collection point C', bin: 'BIN-007', vendor: 'City Loop Logistics (demo)', date: '2026-10-17', window: '15:00–16:00', status: 'Exception', quantity: null, evidence: 'Access blocked at arrival', verified: false }
        ],
        intakes: [
            { id: 'IN-0312', pickupId: 'PU-2047', source: 'Jammu collection point B', netKg: 11.8, date: '2026-10-18', status: 'Received' }
        ],
        batches: [
            { id: 'BT-0086', intakeId: 'IN-0311', source: 'Jammu collection point A (demo)', material: 'Mixed marigold', inputKg: 25, usableKg: 18, rejectedKg: 4, status: 'Available', reservedKg: 5, location: 'Rack A-02', estimated: false },
            { id: 'BT-0087', intakeId: 'IN-0312', source: 'Jammu collection point B', material: 'Mixed floral material', inputKg: 11.8, usableKg: 0, rejectedKg: 0, status: 'Awaiting Processing', reservedKg: 0, location: 'Receiving bay', estimated: false }
        ],
        shipments: [
            { id: 'SH-0104', batchId: 'BT-0086', startup: 'Startup partner 01 (demo)', material: 'Mixed marigold', quantityKg: 5, availableKg: 0, date: '2026-10-19', status: 'In Transit', vendor: 'North Route Services (demo)', destination: 'Jammu, receiving point (demo)', expectedKg: 5, receivedKg: null }
        ],
        requests: [],
        alerts: [
            { id: 'AL-032', title: 'Collection access blocked', detail: 'PU-2046 · Jammu collection point C', severity: 'High', status: 'Open', owner: 'Operations' },
            { id: 'AL-031', title: 'Receipt confirmation due', detail: 'SH-0104 · Startup partner 01 (demo)', severity: 'Medium', status: 'Open', owner: 'Partner team' }
        ],
        feedback: [],
        enquiries: [],
        activity: [
            { text: 'Pickup PU-2047 evidence submitted', time: 'Today, 10:16' },
            { text: 'Intake IN-0312 registered · 11.8 kg', time: 'Today, 10:42' },
            { text: 'Shipment SH-0104 departed for delivery', time: 'Today, 11:05' }
        ]
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function read() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? {...clone(initialData), ...JSON.parse(saved) } : clone(initialData);
        } catch (error) {
            return clone(initialData);
        }
    }

    let state = read();

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('floral:datachange', { detail: state }));
    }

    function nextId(prefix, collection) {
        const highest = collection.reduce((max, item) => {
            const match = item.id.match(/(\d+)$/);
            return Math.max(max, match ? Number(match[1]) : 0);
        }, 0);
        return prefix + String(highest + 1).padStart(4, '0');
    }

    function localDate() {
        const date = new Date();
        return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    }

    function log(text) {
        state.activity.unshift({ text, time: new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' · Today' });
        state.activity = state.activity.slice(0, 12);
    }

    function alertFor(title, detail, severity) {
        const alert = { id: nextId('AL-', state.alerts), title, detail, severity: severity || 'Medium', status: 'Open', owner: 'Operations' };
        state.alerts.unshift(alert);
        return alert;
    }

    function getState() {
        return state;
    }

    function createPickup(values) {
        if (state.pickups.some(item => item.source.toLowerCase() === values.source.trim().toLowerCase() && item.bin.toLowerCase() === values.bin.trim().toLowerCase() && item.date === values.date && item.status === 'Scheduled')) throw new Error('A scheduled pickup already exists for this bin and date.');
        const pickup = { id: nextId('PU-', state.pickups), source: values.source, bin: values.bin, vendor: values.vendor, date: values.date, window: values.window, status: 'Scheduled', quantity: null, evidence: '', verified: false };
        state.pickups.unshift(pickup);
        log('Pickup ' + pickup.id + ' scheduled for ' + pickup.source);
        persist();
        return pickup;
    }

    function recordPickup(id, values) {
        const pickup = state.pickups.find(item => item.id === id);
        if (!pickup || pickup.status !== 'Scheduled') throw new Error('This pickup is no longer available to update.');
        pickup.status = values.outcome === 'Collected Successfully' ? 'Collected' : values.outcome === 'Partially Collected' ? 'Partial' : 'Exception';
        pickup.quantity = values.quantity === '' ? null : Number(values.quantity);
        pickup.evidence = values.evidence.trim();
        pickup.outcome = values.outcome;
        pickup.completedAt = new Date().toISOString();
        if (pickup.status !== 'Collected') alertFor('Pickup needs review', pickup.id + ' · ' + values.outcome, 'High');
        log('Pickup evidence submitted for ' + pickup.id + ' · ' + values.outcome);
        persist();
    }

    function verifyPickup(id) {
        const pickup = state.pickups.find(item => item.id === id);
        if (!pickup || !['Collected', 'Partial'].includes(pickup.status)) throw new Error('Only completed pickup records can be verified.');
        pickup.verified = true;
        log('Operations verified pickup ' + id);
        persist();
    }

    function createIntake(values) {
        const pickup = state.pickups.find(item => item.id === values.pickupId);
        if (!pickup || !pickup.verified) throw new Error('Select a pickup verified by operations.');
        if (state.intakes.some(item => item.pickupId === pickup.id)) throw new Error('This pickup already has a facility intake.');
        const netKg = Number(values.netKg);
        if (!Number.isFinite(netKg) || netKg <= 0) throw new Error('Enter a net weight greater than zero.');
        const intake = { id: nextId('IN-', state.intakes), pickupId: pickup.id, source: pickup.source, netKg, date: localDate(), status: 'Received', note: (values.note || '').trim() };
        state.intakes.unshift(intake);
        log('Facility intake ' + intake.id + ' registered · ' + netKg + ' kg');
        persist();
        return intake;
    }

    function createBatch(values) {
        const intakeIds = Array.isArray(values.intakeIds) ? values.intakeIds : [values.intakeId];
        const intakes = intakeIds.map(id => state.intakes.find(item => item.id === id));
        if (!intakes.length || intakes.some(item => !item || item.status !== 'Received')) throw new Error('Select one or more received intakes that have not been batched.');
        if (state.batches.some(batch => intakeIds.some(id => (batch.intakeIds || [batch.intakeId]).includes(id)))) throw new Error('One or more selected intakes already belong to a processing batch.');
        const batch = { id: nextId('BT-', state.batches), intakeId: intakes[0].id, intakeIds: intakes.map(item => item.id), source: [...new Set(intakes.map(item => item.source))].join(', '), material: values.material, inputKg: Number(intakes.reduce((sum, item) => sum + item.netKg, 0).toFixed(2)), usableKg: 0, rejectedKg: 0, status: 'Awaiting Processing', reservedKg: 0, location: values.location || 'Receiving bay', estimated: false };
        intakes.forEach(item => { item.status = 'Awaiting Processing'; });
        state.batches.unshift(batch);
        log('Processing batch ' + batch.id + ' created from ' + intakes.map(item => item.id).join(', '));
        persist();
        return batch;
    }

    function startBatch(id) {
        const batch = state.batches.find(item => item.id === id);
        if (!batch || batch.status !== 'Awaiting Processing') throw new Error('This batch cannot be started.');
        batch.status = 'Processing';
        batch.startedAt = new Date().toISOString();
        log('Processing started for ' + id);
        persist();
    }

    function completeBatch(id, values) {
        const batch = state.batches.find(item => item.id === id);
        if (!batch || batch.status !== 'Processing') throw new Error('Only an active processing batch can be completed.');
        const usable = Number(values.usableKg);
        const rejected = Number(values.rejectedKg);
        if (!Number.isFinite(usable) || !Number.isFinite(rejected) || usable < 0 || rejected < 0 || usable + rejected > batch.inputKg) throw new Error('Usable plus rejected weight must not exceed the input weight.');
        batch.usableKg = usable;
        batch.rejectedKg = rejected;
        batch.lossKg = Number((batch.inputKg - usable - rejected).toFixed(2));
        batch.estimated = values.estimated === 'on';
        batch.processNote = (values.processNote || '').trim();
        batch.status = 'Awaiting Quality Inspection';
        log('Processing recorded for ' + id + ' · awaiting quality inspection');
        persist();
    }

    function approveBatch(id) {
        const batch = state.batches.find(item => item.id === id);
        if (!batch || batch.status !== 'Awaiting Quality Inspection') throw new Error('This batch is not awaiting inspection.');
        if (batch.estimated) throw new Error('Estimated output requires measured values before stock can be released.');
        batch.status = 'Available';
        batch.location = batch.location === 'Receiving bay' ? 'Approved stock' : batch.location;
        log('Quality approved batch ' + id + ' · ' + batch.usableKg + ' kg released');
        persist();
    }

    function createShipment(values) {
        const batch = state.batches.find(item => item.id === values.batchId);
        const quantityKg = Number(values.quantityKg);
        const available = batch ? batch.usableKg - batch.reservedKg : 0;
        if (!batch || batch.status !== 'Available') throw new Error('Only quality-approved batches can be allocated.');
        if (!Number.isFinite(quantityKg) || quantityKg <= 0 || quantityKg > available) throw new Error('Shipment quantity must be greater than zero and within available stock (' + available + ' kg).');
        batch.reservedKg += quantityKg;
        const shipment = { id: nextId('SH-', state.shipments), batchId: batch.id, startup: values.startup, material: batch.material, quantityKg, availableKg: quantityKg, date: values.date, status: 'Assigned', vendor: values.vendor, destination: values.destination, expectedKg: quantityKg, receivedKg: null };
        state.shipments.unshift(shipment);
        log('Shipment ' + shipment.id + ' allocated · ' + quantityKg + ' kg from ' + batch.id);
        persist();
        return shipment;
    }

    function advanceShipment(id, nextStatus) {
        const shipment = state.shipments.find(item => item.id === id);
        const allowed = { Assigned: 'In Transit', 'In Transit': 'Delivered Awaiting Confirmation' };
        if (!shipment || allowed[shipment.status] !== nextStatus) throw new Error('This shipment cannot be advanced from its current state.');
        shipment.status = nextStatus;
        if (nextStatus === 'In Transit') shipment.dispatchedAt = new Date().toISOString();
        if (nextStatus === 'Delivered Awaiting Confirmation') shipment.deliveredAt = new Date().toISOString();
        log('Shipment ' + id + ' updated · ' + nextStatus);
        persist();
    }

    function confirmReceipt(id, values) {
        const shipment = state.shipments.find(item => item.id === id);
        if (!shipment || shipment.status !== 'Delivered Awaiting Confirmation') throw new Error('Only delivered shipments can be confirmed.');
        const receivedKg = Number(values.receivedKg);
        if (!Number.isFinite(receivedKg) || receivedKg < 0) throw new Error('Enter a valid received quantity.');
        shipment.receivedKg = receivedKg;
        shipment.receiptNote = values.receiptNote.trim();
        shipment.receiptOutcome = values.outcome;
        shipment.status = values.outcome === 'Accepted' && receivedKg === shipment.expectedKg ? 'Receipt Confirmed' : 'Disputed';
        const batch = state.batches.find(item => item.id === shipment.batchId);
        if (batch) {
            if (shipment.status === 'Receipt Confirmed') {
                batch.reservedKg = Math.max(0, batch.reservedKg - shipment.quantityKg);
                batch.usableKg = Math.max(0, Number((batch.usableKg - shipment.quantityKg).toFixed(2)));
                batch.status = batch.usableKg - batch.reservedKg <= 0 ? 'Dispatched' : 'Available';
            }
        }
        if (shipment.status === 'Disputed') alertFor('Delivery discrepancy reported', id + ' · expected ' + shipment.expectedKg + ' kg, received ' + receivedKg + ' kg', 'High');
        log('Receipt recorded for ' + id + ' · ' + receivedKg + ' kg · ' + shipment.status);
        persist();
    }

    function submitFeedback(id, values) {
        const shipment = state.shipments.find(item => item.id === id);
        if (!shipment || !['Receipt Confirmed', 'Disputed'].includes(shipment.status)) throw new Error('Receipt must be recorded before feedback is submitted.');
        state.feedback.unshift({ id: nextId('FB-', state.feedback), shipmentId: id, batchId: shipment.batchId, rating: Number(values.rating), comments: values.comments.trim(), createdAt: new Date().toISOString() });
        log('Quality feedback submitted for ' + id);
        persist();
    }

    function addEnquiry(values) {
        const allowedStakeholders = ['Flower shopkeeper', 'Temple', 'Individual', 'Organization', 'Other'];
        const allowedPurposes = ['Donate floral waste', 'Sell floral waste', 'Arrange regular collection', 'Partner with Floral Circular', 'General enquiry'];
        const enquiry = {
            fullName: String(values.fullName || '').trim(),
            mobile: String(values.mobile || '').trim(),
            email: String(values.email || '').trim(),
            organization: String(values.organization || '').trim(),
            stakeholderType: String(values.stakeholderType || ''),
            purpose: String(values.purpose || ''),
            floralDetails: String(values.floralDetails || '').trim(),
            message: String(values.message || '').trim()
        };
        const mobileDigits = enquiry.mobile.replace(/\D/g, '');
        if (enquiry.fullName.length < 2 || enquiry.fullName.length > 100) throw new Error('Enter a full name between 2 and 100 characters.');
        if (!/^\+?[0-9\s().-]{7,20}$/.test(enquiry.mobile) || mobileDigits.length < 7 || mobileDigits.length > 15) throw new Error('Enter a valid mobile number with 7 to 15 digits.');
        if (enquiry.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) throw new Error('Enter a valid email address.');
        if (enquiry.organization.length > 120 || !allowedStakeholders.includes(enquiry.stakeholderType) || !allowedPurposes.includes(enquiry.purpose)) throw new Error('Choose a valid stakeholder type and enquiry purpose.');
        if (enquiry.floralDetails.length > 1000 || enquiry.message.length > 2000) throw new Error('Floral waste details must be 1,000 characters or fewer and the message must be 2,000 characters or fewer.');

        const previous = clone(state);
        enquiry.id = nextId('EN-', state.enquiries);
        enquiry.status = 'New';
        enquiry.createdAt = new Date().toISOString();
        state.enquiries.unshift(enquiry);
        log('Contribution enquiry received · ' + enquiry.id);
        alertFor('New contribution enquiry', enquiry.id + ' · ' + enquiry.stakeholderType + ' · ' + enquiry.purpose, 'Medium').relatedEnquiryId = enquiry.id;
        try {
            persist();
        } catch (error) {
            state = previous;
            throw new Error('Unable to save the enquiry in this browser. No changes were saved. ' + error.message);
        }
        return enquiry;
    }

    function updateEnquiryStatus(id, status) {
        const allowedStatuses = ['New', 'In Review', 'Contacted', 'Closed'];
        const enquiry = state.enquiries.find(item => item.id === id);
        if (!enquiry) throw new Error('Enquiry not found.');
        if (!allowedStatuses.includes(status)) throw new Error('Choose a valid enquiry status.');

        const previous = clone(state);
        enquiry.status = status;
        enquiry.updatedAt = new Date().toISOString();
        state.alerts.filter(item => item.relatedEnquiryId === id).forEach(item => { item.status = status === 'New' ? 'Open' : 'Resolved'; });
        log('Enquiry ' + id + ' updated · ' + status);
        try {
            persist();
        } catch (error) {
            state = previous;
            throw new Error('Unable to update this enquiry in the browser. No changes were saved. ' + error.message);
        }
    }

    function createRequest(values) {
        const request = { id: nextId('RQ-', state.requests), material: values.material, quantityKg: Number(values.quantityKg), date: values.date, requirements: (values.requirements || '').trim(), status: 'Submitted' };
        if (!request.material || !Number.isFinite(request.quantityKg) || request.quantityKg <= 0) throw new Error('Enter a material and a quantity greater than zero.');
        state.requests.unshift(request);
        log('Startup material request submitted · ' + request.id);
        persist();
    }

    function reportIssue(values) {
        const title = values.category;
        const detail = [values.reference, values.description].filter(Boolean).join(' · ');
        alertFor(title, detail, values.severity);
        log('Vendor issue reported · ' + title);
        persist();
    }

    function resolveAlert(id) {
        const alert = state.alerts.find(item => item.id === id);
        if (!alert) throw new Error('Alert not found.');
        alert.status = 'Resolved';
        log('Alert resolved · ' + id);
        persist();
    }

    function resetDemo() {
        state = clone(initialData);
        persist();
    }

    window.FloralData = { getState, createPickup, recordPickup, verifyPickup, createIntake, createBatch, startBatch, completeBatch, approveBatch, createShipment, advanceShipment, confirmReceipt, submitFeedback, addEnquiry, updateEnquiryStatus, createRequest, reportIssue, resolveAlert, resetDemo };
})();