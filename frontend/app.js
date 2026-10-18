(function() {
        const data = window.FloralData;
        const app = document.getElementById('app');
        const dialogRoot = document.getElementById('dialog-root');
        let role = null;
        let view = 'overview';
        let toastTimer;
        let googleMapsLoadPromise;
        let mapTilesTimer;
        let googleMapsAuthFailed = false;

        const roles = {
            operations: {
                title: 'Operations team',
                initials: 'OP',
                tagline: 'Control tower',
                views: [
                    ['overview', 'Overview'],
                    ['enquiries', 'Enquiries'],
                    ['collections', 'Collections'],
                    ['facility', 'Facility intake'],
                    ['processing', 'Processing & QC'],
                    ['inventory', 'Inventory'],
                    ['shipments', 'Orders & shipments'],
                    ['alerts', 'Alerts & issues'],
                    ['reports', 'Reports']
                ]
            },
            vendor: {
                title: 'Transport vendor',
                initials: 'TV',
                tagline: 'Field portal',
                views: [
                    ['today', "Today's schedule"],
                    ['pickups', 'Pickup tasks'],
                    ['deliveries', 'Delivery tasks'],
                    ['issues', 'Raise an issue'],
                    ['history', 'History']
                ]
            },
            startup: {
                title: 'Startup partner',
                initials: 'SP',
                tagline: 'Partner portal',
                views: [
                    ['overview', 'Overview'],
                    ['incoming', 'Incoming deliveries'],
                    ['requests', 'Material requests'],
                    ['feedback', 'Quality feedback'],
                    ['disputes', 'Disputes'],
                    ['history', 'Shipment history']
                ]
            }
        };

        const icon = '<span class="brand-flower" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b></span>';
        const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
        const state = () => data.getState();
        const kg = value => value == null ? '—' : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' kg';
        const today = () => new Date().toISOString().slice(0, 10);
        const statusClass = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const badge = value => `<span class="badge badge-${statusClass(value)}">${esc(value)}</span>`;
        const button = (label, action, style = 'secondary', extra = '') => `<button class="button button-${style}" data-action="${action}" ${extra}>${label}</button>`;

        function toast(message, isError) {
            let node = document.querySelector('.toast');
            if (!node) {
                node = document.createElement('div');
                node.className = 'toast';
                document.body.appendChild(node);
            }
            node.textContent = message;
            node.classList.toggle('toast-error', Boolean(isError));
            node.classList.add('toast-visible');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => node.classList.remove('toast-visible'), 3400);
        }

        function publicSite() {
            const s = state();
            const collected = s.pickups.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            const approved = s.batches.reduce((sum, item) => sum + (item.status === 'Available' || item.status === 'Dispatched' ? item.usableKg : 0), 0);
            app.innerHTML = `
      <header class="public-header">
        <a class="brand-lockup" href="#home" aria-label="Floral Circular home">${icon}<span><strong>FLORAL CIRCULAR</strong><small>JAMMU · CIRCULAR SUPPLY CHAIN</small></span></a>
        <button class="mobile-menu-button" aria-label="Open navigation" data-action="mobile-menu">☰</button>
        <nav class="public-nav" aria-label="Main navigation">
          <a href="#about">About</a><a href="#process">Our process</a><a href="#network">Network</a><a href="#impact">Impact</a><a href="#resources">Resources</a><a href="#contact">Contact</a>
          <button class="button button-dark" data-action="login">Portal login <span aria-hidden="true">↗</span></button>
        </nav>
      </header>
      <main>
        <section class="hero" id="home">
          <div class="hero-image" role="img" aria-label="Fresh marigold and rose flowers"></div>
          <div class="hero-scrim"></div>
          <div class="hero-content">
            <p class="eyebrow eyebrow-light"><span></span> A more thoughtful material journey</p>
            <h1>From sacred offerings<br>to sustainable opportunities.</h1>
            <p>Connecting floral-waste sources, collection partners, processing facilities and startups through one traceable supply chain.</p>
            <div class="hero-actions"><a class="button button-cream" href="#process">Explore our process <span>↓</span></a><button class="button button-glass" data-action="contact">Partner with us <span>↗</span></button></div>
            <span class="hero-note">A coordination platform · Jammu, India</span>
          </div>
          <div class="hero-caption"><span>01 / 05</span><span>Offerings, handled with care</span></div>
        </section>
        <div class="demo-ribbon"><span class="demo-dot"></span> Demonstration experience · All portal records shown here are fictional sample data</div>
        <section class="intro-section section-wrap" id="about">
          <div class="section-kicker">THE OPPORTUNITY <span>01 — 05</span></div>
          <div class="intro-grid"><h2>A better next chapter<br>for floral offerings.</h2><div><p class="lead">A clear chain of custody can help suitable floral material move from collection to responsible recovery.</p><p>Floral Circular is designed to coordinate schedules, handovers, measured quantities, quality checks, inventory and delivery acceptance. It supports the people and organisations in the chain; it does not manufacture products.</p><a class="text-link" href="#process">See how the chain works <span>→</span></a></div></div>
        </section>
        <section class="process-section" id="process"><div class="section-wrap">
          <div class="section-kicker">FROM SOURCE TO PARTNER <span>02 — 05</span></div><div class="section-heading-row"><h2>Every handover<br>has a record.</h2><p>Material moves through clear stages. Quantities and quality are recorded at each step, not assumed.</p></div>
          <div class="process-line"><article><span class="step-num">01</span><div class="step-mark">01</div><h3>Collect</h3><p>Approved sources and bin conditions are scheduled and documented.</p><small>Source · Operations</small></article><article><span class="step-num">02</span><div class="step-mark">02</div><h3>Transport</h3><p>Assigned vendors record arrival, outcome and collection evidence.</p><small>Vendor · Driver</small></article><article><span class="step-num">03</span><div class="step-mark">03</div><h3>Clean & segregate</h3><p>Facility intake, processing losses and inspected output stay traceable.</p><small>Facility · Quality</small></article><article><span class="step-num">04</span><div class="step-mark">04</div><h3>Deliver</h3><p>Released stock is allocated, dispatched and tracked to its destination.</p><small>Operations · Vendor</small></article><article><span class="step-num">05</span><div class="step-mark">05</div><h3>Confirm & learn</h3><p>Partners confirm actual receipt and share quality feedback.</p><small>Startup · Operations</small></article></div>
        </div></section>
        <section class="network-section section-wrap" id="network"><div class="section-kicker">A CONNECTED NETWORK <span>03 — 05</span></div><div class="section-heading-row"><h2>Built around<br>real collaboration.</h2><p>Approved organisations will appear here when verified information is available.</p></div><div class="network-map-card"><div class="network-map-heading"><div><span class="mini-label">JAMMU · DEMONSTRATION MAP</span><h3>Explore the example locations.</h3></div><span id="google-map-status" class="map-status" data-state="loading" role="status" aria-live="polite">Checking Google Maps…</span></div><p class="network-map-note">Pins are fictional demonstration points, not verified collection centres or partner locations. Google Maps availability is reported below.</p><div id="network-map" class="network-map" role="region" aria-label="Google map showing fictional demonstration points near Jammu"></div><div class="network-map-footer"><a class="text-link" href="https://www.google.com/maps/search/?api=1&amp;query=Jammu%2C%20India" target="_blank" rel="noopener noreferrer">Open Jammu in Google Maps <span aria-hidden="true">↗</span></a><button class="text-link" data-action="contact">Start a conversation <span>→</span></button></div></div></section>
        <section class="impact-section" id="impact"><div class="section-wrap"><div class="section-kicker">MEASURE WHAT IS VERIFIED <span>04 — 05</span></div><div class="impact-header"><h2>Transparent by design.</h2><span class="period-tag">DEMONSTRATION DATA ONLY</span></div><p class="impact-copy">Illustrative workflow totals from fictional demo records. These figures do not represent project activity or environmental impact.</p><div class="impact-metrics"><div><small>Pickup quantities recorded</small><strong>${kg(collected)}</strong><span>Demo records · reported weight</span></div><div><small>Quality-approved output</small><strong>${kg(approved)}</strong><span>Demo records · measured output</span></div><div><small>Confirmed accepted</small><strong>${kg(s.shipments.filter(x => x.status === 'Receipt Confirmed').reduce((n, x) => n + (x.receivedKg || 0), 0))}</strong><span>Demo records · partner-confirmed</span></div><div><small>Verified participation</small><strong>—</strong><span>No verified data available</span></div></div></div></section>
        <section class="resources-section section-wrap" id="resources"><div class="section-kicker">RESOURCES <span>05 — 05</span></div><div class="resource-row"><div><span class="mini-label">METHODOLOGY & REPORTING</span><h2>Evidence before claims.</h2></div><div><p>Reports, measurement definitions and educational resources will be published as they become available. No project reports have been added yet.</p><span class="empty-inline">No resources available</span></div></div></section>
        <section class="faq-section section-wrap" id="faq"><div class="section-kicker">PRACTICAL QUESTIONS <span>POLICIES</span></div><div class="faq-grid"><div><span class="mini-label">FAQ & RESPONSIBILITY</span><h2>Clear expectations<br>at every handover.</h2><p>Project procedures and formal policies should be agreed with participating organisations before operations begin.</p></div><div class="faq-list"><details><summary>How are quantities verified?</summary><p>Collection reports and facility net weights are separate records. Differences require a note and review; processing output is divided into usable, rejected and loss quantities.</p></details><details><summary>Is vehicle location tracked?</summary><p>The map can show static fictional demonstration pins when Google Maps is configured; it does not track vehicles or show verified partner locations. Production tracking requires explicit driver consent, defined tracking periods and protected location history.</p></details><details><summary>What if a delivery quantity differs?</summary><p>The receiving partner records actual quantity and outcome. A difference remains disputed, creates an operations alert and is not counted as accepted stock.</p></details><details><summary>How is demo information handled?</summary><p>Sample workflow changes stay in this browser's local storage. Do not enter personal, confidential or real operational data. There is no account security or server-side access control.</p></details><details id="privacy"><summary>Privacy notice</summary><p>This prototype has no server-side collection, analytics, GPS or messaging integration. A production privacy notice must explain data use, retention, access, evidence storage, tracking consent and contact routes after those services are configured.</p></details><details id="terms"><summary>Terms and partner responsibilities</summary><p>These demo screens do not establish service, payment, safety, quality or dispute terms. Participating organisations should approve written procedures and obtain local legal review before use.</p></details></div></div></section>
        <section class="contact-section" id="contact"><div class="section-wrap contact-grid contact-grid-enquiry"><div><span class="mini-label">WORK WITH THE NETWORK</span><h2>Contribute floral waste<br>or submit an enquiry.</h2><p>Flower shops, temples, individuals and organisations can tell us about floral waste donations or sales, regular collection, partnerships, or another enquiry.</p><p>Share your contact details and, where relevant, the material, estimated quantity, location and collection frequency.</p></div><div class="contact-action"><form class="public-enquiry-form" data-form="contact" aria-describedby="enquiry-storage-notice enquiry-feedback"><h3>Contribution enquiry</h3><p class="enquiry-form-intro">Fields marked <i>*</i> are required.</p><div class="public-enquiry-fields"><label class="form-field"><span>Full name <i>*</i></span><input name="fullName" type="text" required minlength="2" maxlength="100" autocomplete="name" placeholder="Your full name"></label><label class="form-field"><span>Mobile number <i>*</i></span><input name="mobile" type="tel" required inputmode="tel" autocomplete="tel" maxlength="20" pattern="\\+?[0-9\\s\\(\\)\\.\\-]{7,20}" placeholder="+91 98765 43210"></label><label class="form-field"><span>Email address <i>*</i></span><input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="you@example.in"></label><label class="form-field"><span>Organization / shop name</span><input name="organization" type="text" maxlength="120" autocomplete="organization" placeholder="Optional"></label><label class="form-field"><span>Stakeholder type <i>*</i></span><select name="stakeholderType" required><option value="">Choose one</option><option>Flower shopkeeper</option><option>Temple</option><option>Individual</option><option>Organization</option><option>Other</option></select></label><label class="form-field"><span>Purpose of enquiry <i>*</i></span><select name="purpose" required><option value="">Choose one</option><option>Donate floral waste</option><option>Sell floral waste</option><option>Arrange regular collection</option><option>Partner with Floral Circular</option><option>General enquiry</option></select></label><label class="form-field form-field-wide"><span>Floral waste details</span><textarea name="floralDetails" rows="3" maxlength="1000" placeholder="Optional: flower types, estimated quantity, location, collection frequency, handling needs"></textarea><small class="field-hint">Share only what is relevant; up to 1,000 characters.</small></label><label class="form-field form-field-wide"><span>Additional message</span><textarea name="message" rows="3" maxlength="2000" placeholder="Anything else you would like us to know?"></textarea></label></div><p class="enquiry-storage-notice" id="enquiry-storage-notice"><strong>Demonstration only:</strong> This site has no backend or secure database. Do not enter real personal or confidential information; submissions are stored only in this browser and are not shared with an operations team.</p><p class="enquiry-feedback" id="enquiry-feedback" role="status" aria-live="polite"></p><button class="button button-primary enquiry-submit" type="submit">Submit enquiry</button></form></div></div></section>
      </main>
      <footer class="public-footer"><a class="brand-lockup" href="#home">${icon}<span><strong>FLORAL CIRCULAR</strong><small>FROM OFFERING TO OPPORTUNITY</small></span></a><span>Coordination for a more accountable circular supply chain.</span><div><a href="#about">About</a><a href="#process">Process</a><a href="#faq">FAQ</a><a href="#privacy">Privacy</a><a href="#terms">Terms</a><button data-action="login">Portal login</button><a href="#contact">Contact</a></div><small class="footer-note">Demo interface · Sample data is fictional · Policies require local legal review</small></footer>`;
          loadGoogleMaps();
        }

        function setGoogleMapsStatus(state, message) {
          const status = document.getElementById('google-map-status');
          if (!status) return;
          status.dataset.state = state;
          status.textContent = message;
        }

        function initializeGoogleMap() {
          const mapElement = document.getElementById('network-map');
          if (!mapElement || !window.google?.maps) return;

          clearTimeout(mapTilesTimer);
          setGoogleMapsStatus('loading', 'Google Maps loaded; waiting for map tiles…');

          try {
            const center = { lat: 32.7266, lng: 74.8570 };
            const map = new window.google.maps.Map(mapElement, {
              center,
              zoom: 13,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true
            });
            const infoWindow = new window.google.maps.InfoWindow();
            const demoLocations = [
              { name: 'Demo location 1', lat: 32.7266, lng: 74.8570 },
              { name: 'Demo location 2', lat: 32.7350, lng: 74.8700 },
              { name: 'Demo location 3', lat: 32.7150, lng: 74.8400 }
            ];

            demoLocations.forEach(location => {
              const marker = new window.google.maps.Marker({
                map,
                position: { lat: location.lat, lng: location.lng },
                title: location.name
              });
              marker.addListener('click', () => {
                const label = document.createElement('strong');
                label.textContent = location.name + ' · demonstration only';
                infoWindow.setContent(label);
                infoWindow.open({ map, anchor: marker });
              });
            });

            let tilesLoaded = false;
            map.addListener('tilesloaded', () => {
              tilesLoaded = true;
              clearTimeout(mapTilesTimer);
              if (!googleMapsAuthFailed) {
                setGoogleMapsStatus('ready', 'Google Maps is working.');
              }
            });
            if (!tilesLoaded && !googleMapsAuthFailed) {
              mapTilesTimer = setTimeout(() => {
                setGoogleMapsStatus('error', 'Google Maps did not load map tiles. Check the API key, billing, restrictions, and internet connection.');
              }, 12000);
            }
          } catch (error) {
            clearTimeout(mapTilesTimer);
            setGoogleMapsStatus('error', 'Google Maps could not be initialized. Check the API key and Maps JavaScript API setup.');
          }
        }

        function loadGoogleMaps() {
          const configuredKey = window.FloralMapsConfig?.googleMapsApiKey;
          const apiKey = typeof configuredKey === 'string' ? configuredKey.trim() : '';
          if (!apiKey) {
            setGoogleMapsStatus('unavailable', 'Google Maps is not working: no API key is configured.');
            return;
          }
          if (window.google?.maps) {
            initializeGoogleMap();
            return;
          }

          setGoogleMapsStatus('loading', 'Connecting to Google Maps…');
          if (!googleMapsLoadPromise) {
            googleMapsLoadPromise = new Promise((resolve, reject) => {
              window.floralGoogleMapsReady = resolve;
              googleMapsAuthFailed = false;
              window.gm_authFailure = () => {
                googleMapsAuthFailed = true;
                clearTimeout(mapTilesTimer);
                setGoogleMapsStatus('error', 'Google Maps authentication failed. Check the API key, billing, and allowed referrers.');
              };
              const script = document.createElement('script');
              script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=floralGoogleMapsReady`;
              script.async = true;
              script.defer = true;
              script.onerror = () => reject(new Error('Google Maps JavaScript API failed to load.'));
              document.head.appendChild(script);
            }).catch(error => {
              googleMapsLoadPromise = null;
              throw error;
            });
          }

          googleMapsLoadPromise.then(initializeGoogleMap).catch(() => {
            setGoogleMapsStatus('error', 'Google Maps could not be loaded. Check the API key and internet connection.');
          });
        }

        function pageHeading(eyebrow, title, description, action) {
            return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-description">${description}</p></div>${action || ''}</div>`;
        }

        function metric(label, value, foot, tone) {
            return `<article class="metric-card ${tone || ''}"><span class="metric-label">${label}</span><strong>${value}</strong><span class="metric-foot">${foot}</span></article>`;
        }

        function dataTable(headers, rows, empty) {
            return `<div class="table-wrap"><table><thead><tr>${headers.map(item => `<th>${item}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="empty-cell">${empty || 'No records found.'}</td></tr>`}</tbody></table></div>`;
  }

  function panel(title, subtitle, content, action) {
    return `<section class="panel"><div class="panel-heading"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${action || ''}</div>${content}</section>`;
  }

  function activityFeed() {
    return `<div class="activity-list">${state().activity.slice(0, 5).map(item => `<div class="activity-item"><span class="activity-mark"></span><div><p>${esc(item.text)}</p><small>${esc(item.time)}</small></div></div>`).join('')}</div>`;
  }

  function alertRows() {
    const alerts = state().alerts.filter(item => item.status !== 'Resolved');
    return alerts.length ? alerts.slice(0, 4).map(item => `<div class="alert-row"><span class="alert-indicator ${statusClass(item.severity)}"></span><div><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></div>${badge(item.severity)}<button class="icon-button" aria-label="Resolve alert" title="Resolve alert" data-action="resolve-alert" data-id="${esc(item.id)}">✓</button></div>`).join('') : '<div class="empty-inline">No open alerts. Exceptions will appear here.</div>';
  }

  function operationsOverview() {
    const s = state();
    const pickups = s.pickups;
    const todayPickups = pickups.filter(x => x.date === today());
    const completed = todayPickups.filter(x => ['Collected', 'Partial'].includes(x.status)).length;
    const awaiting = s.batches.filter(x => ['Awaiting Processing', 'Processing'].includes(x.status)).length;
    const inspection = s.batches.filter(x => x.status === 'Awaiting Quality Inspection').length;
    const stock = s.batches.reduce((sum, x) => sum + (x.status === 'Available' ? Math.max(0, x.usableKg - x.reservedKg) : 0), 0);
    const transit = s.shipments.filter(x => x.status === 'In Transit').length;
    const exceptions = s.alerts.filter(x => x.status !== 'Resolved').length;
    const pickupRows = todayPickups.map(x => `<tr><td><strong>${esc(x.id)}</strong><small class="cell-sub">${esc(x.source)}</small></td><td>${esc(x.window)}</td><td>${esc(x.vendor)}</td><td>${badge(x.status)}</td><td>${x.quantity == null ? '—' : kg(x.quantity)}</td></tr>`).join('');
    return `${pageHeading('OPERATIONS · JAMMU', 'Good day, Operations', 'A clear view of today’s material movement. All figures below use fictional demonstration records.', button('＋ Schedule pickup', 'new-pickup', 'primary'))}
      <div class="metric-grid">${metric('Pickups completed', `${completed}<em> / ${todayPickups.length}</em>`, 'Today · task count', 'metric-sage')}${metric('Awaiting processing', `${awaiting}<em> batches</em>`, 'Facility · not yet released')}${metric('Awaiting inspection', `${inspection}<em> batches</em>`, 'Quality gate · approval required', 'metric-cream')}${metric('Approved stock', kg(stock), 'Released · available to allocate', 'metric-sage')}${metric('Shipments in transit', transit, 'Vendor handover recorded')}${metric('Open exceptions', exceptions, 'Owner assigned · action required', exceptions ? 'metric-alert' : '')}</div>
      <div class="dashboard-grid"><div class="dashboard-main">${panel('Today’s collection plan', 'Schedule, source and reported weight', dataTable(['TASK / SOURCE', 'WINDOW', 'ASSIGNED VENDOR', 'STATUS', 'REPORTED'], pickupRows, 'No pickups scheduled for today.'), `<button class="text-button" data-view="collections">View all →</button>`)}${panel('Priority alerts', 'Open exceptions requiring attention', `<div class="alert-list">${alertRows()}</div>`, `<button class="text-button" data-view="alerts">View alert centre →</button>`)}</div><aside class="dashboard-side">${panel('Material journey', 'Current demo workflow status', `<div class="journey-stack"><div><span>01</span><b>Collection tasks</b><strong>${pickups.length}</strong></div><div><span>02</span><b>Facility intakes</b><strong>${s.intakes.length}</strong></div><div><span>03</span><b>Processing batches</b><strong>${s.batches.length}</strong></div><div><span>04</span><b>Shipment records</b><strong>${s.shipments.length}</strong></div></div>`)}${panel('Recent activity', 'Latest recorded updates', activityFeed())}</aside></div>`;
  }

  function collectionsView() {
    const rows = state().pickups.map(x => `<tr><td><strong>${esc(x.id)}</strong><small class="cell-sub">${esc(x.bin)}</small></td><td>${esc(x.source)}</td><td>${esc(x.date)}<small class="cell-sub">${esc(x.window)}</small></td><td>${esc(x.vendor)}</td><td>${badge(x.status)}</td><td>${x.quantity == null ? '—' : kg(x.quantity)}</td><td>${x.verified ? badge('Verified') : ['Collected', 'Partial'].includes(x.status) ? button('Verify', 'verify-pickup', 'small', `data-id="${esc(x.id)}"`) : '—'}</td></tr>`).join('');
    return `${pageHeading('FIELD OPERATIONS', 'Collections', 'Planned and completed pickup records. Arrival and collection evidence are distinct events.', button('＋ Schedule pickup', 'new-pickup', 'primary'))}${panel('Pickup schedule', 'Fictional demo schedule · select Verify after reviewing evidence', dataTable(['TASK / BIN', 'SOURCE', 'DATE / WINDOW', 'VENDOR', 'STATUS', 'REPORTED', 'REVIEW'], rows, 'No pickup records yet.'))}`;
  }

  function vendorHistoryView() {
    const vendorName = 'North Route Services (demo)';
    const rows = state().pickups.filter(x => x.vendor === vendorName && x.status !== 'Scheduled').map(x => `<tr><td><strong>${esc(x.id)}</strong><small class="cell-sub">${esc(x.bin)}</small></td><td>${esc(x.source)}</td><td>${esc(x.date)}</td><td>${badge(x.status)}</td><td>${x.quantity == null ? '—' : kg(x.quantity)}</td><td>${x.verified ? badge('Verified') : 'Pending review'}</td></tr>`).join('');
    return `${pageHeading('VENDOR FIELD PORTAL', 'Task history', 'Completed, partial and exception tasks remain visible for reconciliation.')}${panel('Pickup records', 'History is read-only for this demo vendor.', dataTable(['TASK / BIN', 'SOURCE', 'DATE', 'OUTCOME', 'REPORTED', 'OPERATIONS REVIEW'], rows, 'No completed pickup records yet.'))}`;
  }

  function facilityView() {
    const s = state();
    const eligible = s.pickups.filter(x => x.verified && !s.intakes.some(intake => intake.pickupId === x.id));
    const rows = s.intakes.map(x => `<tr><td><strong>${esc(x.id)}</strong></td><td>${esc(x.pickupId)}</td><td>${esc(x.source)}</td><td>${esc(x.date)}</td><td>${kg(x.netKg)}</td><td>${badge(x.status)}</td></tr>`).join('');
    return `${pageHeading('FACILITY OPERATIONS', 'Facility intake', 'Reconcile verified pickup handovers with measured facility weight.', eligible.length ? button('＋ Register intake', 'new-intake', 'primary') : '')}<div class="notice notice-info"><strong>Reconciliation matters.</strong> Pickup-reported and facility intake weights can differ. Record the measured net weight and note the reason.</div>${panel('Received material', 'Only operations-verified pickups can be linked to a new intake.', dataTable(['INTAKE', 'PICKUP', 'SOURCE', 'RECEIVED', 'NET WEIGHT', 'STATUS'], rows, 'No intake records yet. Verify a pickup, then register its facility handover.'))}`;
  }

  function processingView() {
    const s = state();
    const eligible = s.intakes.filter(x => x.status === 'Received' && !s.batches.some(batch => batch.intakeId === x.id));
    const rows = s.batches.map(x => {
      let next = '—';
      if (x.status === 'Awaiting Processing') next = button('Start', 'start-batch', 'small', `data-id="${esc(x.id)}"`);
      if (x.status === 'Processing') next = button('Record output', 'complete-batch', 'small', `data-id="${esc(x.id)}"`);
      if (x.status === 'Awaiting Quality Inspection') next = button('Inspect & release', 'approve-batch', 'small', `data-id="${esc(x.id)}"`);
      return `<tr><td><strong>${esc(x.id)}</strong><small class="cell-sub">${esc(x.intakeId)}</small></td><td>${esc(x.source)}</td><td>${esc(x.material)}</td><td>${kg(x.inputKg)}</td><td>${x.usableKg ? kg(x.usableKg) : '—'}</td><td>${badge(x.status)}${x.estimated ? '<small class="cell-sub">Estimated · not releasable</small>' : ''}</td><td>${next}</td></tr>`;
    }).join('');
    return `${pageHeading('PROCESSING & QUALITY', 'Processing & QC', 'Track input, usable output, rejects and loss. Only measured, inspected output can be released.', eligible.length ? button('＋ Create batch', 'new-batch', 'primary') : '')}<div class="notice notice-warning"><strong>Yield is not assumed.</strong> Usable, rejected and process-loss quantities must reconcile to input. Estimated output cannot be released to inventory.</div>${panel('Processing batches', 'Every batch retains its source intake reference.', dataTable(['BATCH / INTAKE', 'SOURCE', 'MATERIAL', 'INPUT', 'USABLE OUTPUT', 'WORKFLOW STATUS', 'ACTION'], rows, 'No processing batches yet.'))}`;
  }

  function inventoryView() {
    const s = state();
    const rows = s.batches.map(x => `<tr><td><strong>${esc(x.id)}</strong><small class="cell-sub">${esc(x.intakeId)}</small></td><td>${esc(x.material)}</td><td>${esc(x.source)}</td><td>${badge(x.status)}</td><td>${kg(x.usableKg)}</td><td>${kg(x.reservedKg)}</td><td>${kg(Math.max(0, x.usableKg - x.reservedKg))}</td></tr>`).join('');
    return `${pageHeading('TRACEABLE STOCK', 'Inventory & batches', 'Approved stock only. Reservations and dispatches remain linked to their source batch.')}${panel('Stock ledger · current balance', 'Demo balances · available quantity cannot go below zero.', dataTable(['BATCH / SOURCE INTAKE', 'MATERIAL', 'ORIGIN', 'STATE', 'USABLE', 'RESERVED', 'AVAILABLE'], rows, 'No inventory movements recorded.'))}<p class="footnote">The production ledger must be append-only and database-enforced. This browser demo stores only the latest sample state.</p>`;
  }

  function shipmentsView() {
    const s = state();
    const eligible = s.batches.filter(x => x.status === 'Available' && x.usableKg > x.reservedKg);
    const rows = s.shipments.map(x => `<tr><td><strong>${esc(x.id)}</strong><small class="cell-sub">${esc(x.batchId)}</small></td><td>${esc(x.startup)}</td><td>${esc(x.material)}</td><td>${kg(x.quantityKg)}</td><td>${esc(x.date)}</td><td>${badge(x.status)}</td><td>${esc(x.status === 'Disputed' ? kg(x.receivedKg) + ' received' : x.destination)}</td></tr>`).join('');
    return `${pageHeading('ORDERS & DISPATCH', 'Orders & shipments', 'Allocate only inspected stock. Delivery and partner acceptance are separate milestones.', eligible.length ? button('＋ Create shipment', 'new-shipment', 'primary') : '')}${panel('Shipment register', 'Demo destinations and partner labels are fictional.', dataTable(['SHIPMENT / BATCH', 'PARTNER', 'MATERIAL', 'ALLOCATED', 'DELIVERY DATE', 'STATUS', 'DESTINATION / RECEIPT'], rows, 'No shipment records yet.'))}`;
  }

  function alertsView() {
    const rows = state().alerts.map(x => `<tr><td><strong>${esc(x.id)}</strong></td><td>${esc(x.title)}<small class="cell-sub">${esc(x.detail)}</small></td><td>${badge(x.severity)}</td><td>${esc(x.owner)}</td><td>${badge(x.status)}</td><td>${x.status === 'Resolved' ? '—' : button('Resolve', 'resolve-alert', 'small', `data-id="${esc(x.id)}"`)}</td></tr>`).join('');
    return `${pageHeading('EXCEPTIONS', 'Alerts & issues', 'Keep exception ownership and resolution visible. Resolving an alert does not erase the underlying event.')}${panel('Exception register', 'Fictional demo alerts', dataTable(['REFERENCE', 'ISSUE', 'SEVERITY', 'OWNER', 'STATUS', 'ACTION'], rows, 'No alerts. Exceptions will be recorded as workflows progress.'))}`;
  }

  function enquiriesView() {
    const rows = state().enquiries.map(item => {
      const received = new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const details = [item.floralDetails && `<p><strong>Floral waste details:</strong> ${esc(item.floralDetails)}</p>`, item.message && `<p><strong>Additional message:</strong> ${esc(item.message)}</p>`].filter(Boolean).join('');
      return `<tr><td><strong>${esc(item.fullName)}</strong><small class="cell-sub">${esc(item.id)}</small><small class="cell-sub">${esc(item.mobile)}</small><small class="cell-sub">${esc(item.email)}</small>${item.organization ? `<small class="cell-sub">${esc(item.organization)}</small>` : ''}</td><td>${esc(item.stakeholderType)}</td><td>${esc(item.purpose)}</td><td>${details ? `<details class="enquiry-details"><summary>View details</summary>${details}</details>` : '—'}</td><td>${esc(received)}</td><td>${badge(item.status)}</td><td>${button('Update status', 'update-enquiry', 'small', `data-id="${esc(item.id)}"`)}</td></tr>`;
    }).join('');
    return `${pageHeading('PUBLIC CONTACT', 'Contribution enquiries', 'Review incoming demo submissions and update their status. Submissions are stored only in this browser; this is not a secure shared operations inbox.')}${panel('All enquiries', 'Contact details and enquiry information are visible to anyone using this browser profile.', dataTable(['CONTACT', 'STAKEHOLDER', 'PURPOSE', 'MESSAGE / MATERIAL DETAILS', 'RECEIVED', 'STATUS', 'ACTION'], rows, 'No enquiries submitted yet.'))}<p class="footnote">This prototype has no authenticated operations access or server-side database. Do not use it for real personal information.</p>`;
  }

  function reportsView() {
    const s = state();
    const input = s.batches.reduce((sum, x) => sum + x.inputKg, 0);
    const output = s.batches.reduce((sum, x) => sum + x.usableKg, 0);
    const completed = s.pickups.filter(x => ['Collected', 'Partial'].includes(x.status));
    const rate = completed.length ? Math.round(completed.filter(x => x.verified).length / completed.length * 100) : null;
    const shipmentRows = s.shipments.map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.batchId)}</td><td>${esc(x.startup)}</td><td>${kg(x.quantityKg)}</td><td>${x.receivedKg == null ? '—' : kg(x.receivedKg)}</td><td>${badge(x.status)}</td></tr>`).join('');
    return `${pageHeading('DEMO ANALYTICS', 'Reports & analytics', 'Calculated from current fictional demo records. Reporting period: all records in this browser dataset.', button('↓ Export shipments CSV', 'export-csv', 'secondary'))}<div class="metric-grid metric-grid-three">${metric('Processing yield', input ? (output / input * 100).toFixed(1) + '%' : '—', `${kg(output)} output / ${kg(input)} input · all batches`)}${metric('Pickup verification', rate == null ? '—' : rate + '%', `${completed.filter(x => x.verified).length} verified / ${completed.length} completed · count-based`, 'metric-sage')}${metric('Partner acceptance', '—', 'No delivery receipt confirmed in this dataset')}</div>${panel('Delivery reconciliation', 'A driver delivery is not counted as partner acceptance.', dataTable(['SHIPMENT', 'BATCH', 'PARTNER', 'DISPATCHED', 'RECEIVED', 'STATE'], shipmentRows, 'No shipment data available.'))}<p class="footnote">No costs, revenue, on-time rates or environmental impact are estimated in this demo.</p>`;
  }

  function vendorOverview() {
    const s = state();
    const vendorName = 'North Route Services (demo)';
    const pickups = s.pickups.filter(x => x.vendor === vendorName && !['Receipt Confirmed'].includes(x.status));
    const shipments = s.shipments.filter(x => x.vendor === vendorName && ['Assigned', 'In Transit'].includes(x.status));
    const pickupRows = pickups.map(x => `<tr><td><strong>${esc(x.id)}</strong><small class="cell-sub">${esc(x.bin)}</small></td><td>${esc(x.source)}</td><td>${esc(x.date)} · ${esc(x.window)}</td><td>${badge(x.status)}</td><td>${x.status === 'Scheduled' ? button('Record pickup', 'record-pickup', 'small', `data-id="${esc(x.id)}"`) : x.status}</td></tr>`).join('');
    const shipmentRows = shipments.map(x => `<tr><td><strong>${esc(x.id)}</strong><small class="cell-sub">${esc(x.batchId)}</small></td><td>${esc(x.startup)}</td><td>${esc(x.destination)}</td><td>${badge(x.status)}</td><td>${x.status === 'Assigned' ? button('Mark dispatched', 'dispatch-shipment', 'small', `data-id="${esc(x.id)}"`) : button('Record delivery', 'deliver-shipment', 'small', `data-id="${esc(x.id)}"`)}</td></tr>`).join('');
    return `${pageHeading('VENDOR FIELD PORTAL', 'Your assigned work', 'Fictional demo tasks. Record the physical handover and evidence; GPS arrival alone is not collection proof.')}
      <div class="mobile-task-callout"><span class="mini-label">NEXT ACTION</span><strong>${pickups.find(x => x.status === 'Scheduled') ? 'Pickup · ' + esc(pickups.find(x => x.status === 'Scheduled').source) : 'No pending pickup'}</strong><small>Submit the actual outcome and recorded quantity.</small></div>
      <div class="metric-grid metric-grid-three">${metric('Pickup tasks', pickups.filter(x => x.status === 'Scheduled').length, 'Assigned to demo vendor')}${metric('Shipment tasks', shipments.length, 'Assigned or in transit', 'metric-sage')}${metric('Needs operations review', pickups.filter(x => ['Partial', 'Exception'].includes(x.status)).length, 'Exceptions remain on record', 'metric-cream')}</div>
      ${panel('Pickup schedule', 'Use the task action to report the outcome and collection evidence.', dataTable(['TASK / BIN', 'SOURCE', 'SCHEDULED', 'STATE', 'ACTION'], pickupRows, 'No assigned pickup tasks.'))}${panel('Delivery tasks', 'Startup acceptance must be recorded by the startup partner.', dataTable(['SHIPMENT / BATCH', 'PARTNER', 'DESTINATION', 'STATE', 'ACTION'], shipmentRows, 'No assigned delivery tasks.'))}`;
  }

  function vendorView() {
    if (view === 'issues') {
      const rows = state().alerts.map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.title)}<small class="cell-sub">${esc(x.detail)}</small></td><td>${badge(x.severity)}</td><td>${badge(x.status)}</td></tr>`).join('');
      return `${pageHeading('VENDOR FIELD PORTAL', 'Issues & exceptions', 'Report access, route, vehicle or material issues so the operations team can respond.', button('＋ Raise an issue', 'new-issue', 'primary'))}${panel('Reported issues', 'Issues are visible in the shared demo operations queue.', dataTable(['REFERENCE', 'ISSUE', 'SEVERITY', 'STATUS'], rows, 'No issues reported.'))}`;
    }
    if (view === 'history') return vendorHistoryView();
    return vendorOverview();
  }

  function startupOverview() {
    const s = state();
    const partner = 'Startup partner 01 (demo)';
    const shipments = s.shipments.filter(x => x.startup === partner);
    const incoming = shipments.filter(x => ['Assigned', 'In Transit', 'Delivered Awaiting Confirmation', 'Disputed'].includes(x.status));
    const rows = incoming.map(x => `<tr><td><strong>${esc(x.id)}</strong><small class="cell-sub">${esc(x.batchId)}</small></td><td>${esc(x.material)}</td><td>${kg(x.expectedKg)}</td><td>${esc(x.date)}</td><td>${badge(x.status)}</td><td>${x.status === 'Delivered Awaiting Confirmation' ? button('Confirm receipt', 'confirm-receipt', 'small', `data-id="${esc(x.id)}"`) : '—'}</td></tr>`).join('');
    const accepted = shipments.filter(x => x.status === 'Receipt Confirmed').reduce((sum, x) => sum + (x.receivedKg || 0), 0);
    const openDisputes = shipments.filter(x => x.status === 'Disputed').length;
    return `${pageHeading('STARTUP PARTNER PORTAL', 'Material, with a clear record.', 'Fictional demo organisation. Confirm actual quantities only after delivery; report a discrepancy for review.', button('＋ Request material', 'new-request', 'primary'))}<div class="metric-grid metric-grid-three">${metric('Upcoming deliveries', s.shipments.filter(x => x.status === 'Assigned').length, 'Scheduled to your demo destination')}${metric('In transit', s.shipments.filter(x => x.status === 'In Transit').length, 'Vendor departure recorded', 'metric-sage')}${metric('Accepted quantity', kg(accepted), 'Partner-confirmed · demo records')}${metric('Open disputes', openDisputes, 'Quantity or quality case under review', openDisputes ? 'metric-alert' : '')}</div>${panel('Incoming deliveries', 'Acceptance is recorded separately from driver delivery.', dataTable(['SHIPMENT / BATCH', 'MATERIAL', 'EXPECTED', 'DELIVERY DATE', 'STATUS', 'ACTION'], rows, 'No incoming deliveries.'))}${panel('Recent quality feedback', 'Feedback is linked to the shipment and source batch.', state().feedback.length ? `<div class="feedback-list">${state().feedback.map(f => `<div><strong>${esc(f.shipmentId)} · ${f.rating}/5</strong><p>${esc(f.comments)}</p></div>`).join('')}</div>` : '<div class="empty-inline">No quality feedback submitted.</div>')}`;
  }

  function startupView() {
    if (view === 'incoming') return startupOverview();
    if (view === 'requests') return `${pageHeading('PROCUREMENT', 'Material requests', 'Requests are submitted to operations for review; they do not reserve stock.', button('＋ New request', 'new-request', 'primary'))}${panel('Demand requests', 'Demo partner requests', dataTable(['REQUEST', 'MATERIAL', 'QUANTITY', 'REQUIRED BY', 'STATUS'], state().requests.map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.material)}</td><td>${kg(x.quantityKg)}</td><td>${esc(x.date)}</td><td>${badge(x.status)}</td></tr>`).join(''), 'No requests submitted yet.'))}`;
    if (view === 'feedback') return `${pageHeading('QUALITY & FEEDBACK', 'Quality feedback', 'Submit structured partner feedback after receipt confirmation.')}${panel('Eligible shipments', '', dataTable(['SHIPMENT', 'BATCH', 'STATUS', 'ACTION'], state().shipments.filter(x => x.startup === 'Startup partner 01 (demo)' && ['Receipt Confirmed', 'Disputed'].includes(x.status) && !state().feedback.some(f => f.shipmentId === x.id)).map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.batchId)}</td><td>${badge(x.status)}</td><td>${button('Add feedback', 'new-feedback', 'small', `data-id="${esc(x.id)}"`)}</td></tr>`).join(''), 'No shipments are awaiting feedback.'))}`;
    if (view === 'disputes') return `${pageHeading('PARTNER RESOLUTION', 'Disputes', 'Quantity and quality exceptions stay visible until investigated by operations.')}${panel('Open cases', 'Receipt differences are not recorded as accepted stock.', dataTable(['SHIPMENT', 'BATCH', 'EXPECTED', 'RECEIVED', 'OUTCOME', 'CASE NOTE'], state().shipments.filter(x => x.startup === 'Startup partner 01 (demo)' && x.status === 'Disputed').map(x => `<tr><td><strong>${esc(x.id)}</strong></td><td>${esc(x.batchId)}</td><td>${kg(x.expectedKg)}</td><td>${kg(x.receivedKg)}</td><td>${badge(x.receiptOutcome || 'Disputed')}</td><td>${esc(x.receiptNote || 'Operations review required')}</td></tr>`).join(''), 'No disputed deliveries.'))}`;
    if (view === 'history') return `${pageHeading('PARTNER RECORDS', 'Shipment history', 'Your organisation’s receipt confirmations and quality records.')}${panel('All demo shipments', '', dataTable(['SHIPMENT', 'BATCH', 'MATERIAL', 'EXPECTED', 'RECEIVED', 'STATUS'], state().shipments.filter(x => x.startup === 'Startup partner 01 (demo)').map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.batchId)}</td><td>${esc(x.material)}</td><td>${kg(x.expectedKg)}</td><td>${x.receivedKg == null ? '—' : kg(x.receivedKg)}</td><td>${badge(x.status)}</td></tr>`).join(''), 'No shipment records yet.'))}`;
    return startupOverview();
  }

  function workspace() {
    const current = roles[role];
    const content = role === 'operations' ? ({ overview: operationsOverview, enquiries: enquiriesView, collections: collectionsView, facility: facilityView, processing: processingView, inventory: inventoryView, shipments: shipmentsView, alerts: alertsView, reports: reportsView }[view] || operationsOverview)() : role === 'vendor' ? vendorView() : startupView();
    const unread = state().alerts.filter(x => x.status !== 'Resolved').length;
    app.innerHTML = `<div class="workspace"><aside class="sidebar"><a href="#" class="sidebar-brand" data-action="home">${icon}<span><strong>FLORAL<br>CIRCULAR</strong><small>DEMO CONTROL TOWER</small></span></a><div class="sidebar-org"><span class="org-avatar">${current.initials}</span><div><strong>${current.title}</strong><small>${current.tagline}</small></div><span class="org-chevron">⌄</span></div><nav class="side-nav" aria-label="Workspace navigation"><span class="nav-caption">WORKSPACE</span>${current.views.map(([key, label]) => `<button class="side-link ${view === key ? 'active' : ''}" data-view="${key}"><span class="side-glyph">${navGlyph(key)}</span>${label}${key === 'alerts' && unread ? `<i class="nav-count">${unread}</i>` : key === 'enquiries' && state().enquiries.filter(item => item.status === 'New').length ? `<i class="nav-count">${state().enquiries.filter(item => item.status === 'New').length}</i>` : ''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="demo-status"><span></span><div><b>DEMO ENVIRONMENT</b><small>Local browser data</small></div></div><button class="side-link" data-action="reset-demo"><span class="side-glyph">↻</span>Reset demo data</button><button class="side-link" data-action="logout"><span class="side-glyph">↗</span>Return to public site</button><div class="sidebar-foot">Floral Circular · Prototype<br>Not for operational use</div></div></aside><div class="workspace-main"><header class="topbar"><button class="icon-button sidebar-toggle" aria-label="Toggle navigation" data-action="sidebar-toggle">☰</button><div class="breadcrumb"><span>Floral Circular</span><b>/</b><strong>${esc(current.views.find(x => x[0] === view)?.[1] || 'Overview')}</strong></div><div class="topbar-right"><span class="top-date">Jammu <b>·</b> Demo dataset</span><button class="icon-button notification-button" aria-label="Open alerts" title="Open alerts" data-view="alerts">♧${unread ? `<i>${unread}</i>` : ''}</button><button class="profile-chip" data-action="switch-role"><span>${current.initials}</span><span class="profile-label">${current.title}<small>Demo role · not authenticated</small></span><b>⌄</b></button></div></header><main class="workspace-content"><div class="demo-banner"><span>DEMO</span><p>Fictional sample records are stored in this browser only. This role switch is not a secure login.</p><button data-action="about-demo" aria-label="About demo data">ⓘ</button></div><div class="view-content">${content}</div><footer class="workspace-footer">Demo preview · No live GPS, external messaging or production records connected <a href="#" data-action="about-demo">About this demo</a></footer></main></div></div>`;
  }

  function navGlyph(key) {
    return ({ overview: '⌂', enquiries: '✉', collections: '◌', facility: '▤', processing: '◇', inventory: '▦', shipments: '⇄', alerts: '!', reports: '▥', today: '▦', pickups: '↓', deliveries: '↑', issues: '⚑', history: '◷', incoming: '↙', requests: '＋', feedback: '☆' })[key] || '·';
  }

  function render() {
    if (!role) publicSite();
    else workspace();
    dialogRoot.innerHTML = '';
  }

  function field(label, name, type = 'text', required = true, placeholder = '', value = '') {
    const common = `name="${name}" ${required ? 'required' : ''} placeholder="${placeholder}" value="${esc(value)}"`;
    return `<label class="form-field"><span>${label}${required ? ' <i>*</i>' : ''}</span><input type="${type}" ${common}></label>`;
  }

  function selectField(label, name, options, required = true, selectedValue = '') {
    return `<label class="form-field"><span>${label}${required ? ' <i>*</i>' : ''}</span><select name="${name}" ${required ? 'required' : ''}>${options.map(([value, text]) => `<option value="${esc(value)}" ${value === selectedValue ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></label>`;
  }

  function multiSelectField(label, name, options) {
    return `<label class="form-field form-field-wide"><span>${label} <i>*</i></span><select name="${name}" multiple required size="${Math.min(4, options.length)}">${options.map(([value, text]) => `<option value="${esc(value)}">${esc(text)}</option>`).join('')}</select><small class="field-hint">Use Ctrl or Command to select multiple source intakes.</small></label>`;
  }

  function textareaField(label, name, placeholder, required = true) {
    return `<label class="form-field form-field-wide"><span>${label}${required ? ' <i>*</i>' : ''}</span><textarea name="${name}" rows="3" ${required ? 'required' : ''} placeholder="${placeholder}"></textarea></label>`;
  }

  function openDialog(title, subtitle, body, submitLabel, formName, formId = '') {
    dialogRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><p class="eyebrow">FLORAL CIRCULAR · DEMO</p><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></header><form data-form="${formName}" data-id="${esc(formId)}"><div class="modal-body">${body}</div><footer class="modal-footer"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button type="submit" class="button button-primary">${submitLabel}</button></footer></form></section></div>`;
    const first = dialogRoot.querySelector('input, select, textarea');
    if (first) first.focus();
  }

  function openRoles() {
    openDialog('Choose a demo portal', 'Role selection previews separate interface workflows. It does not authenticate or enforce real permissions.', `<div class="role-options"><button type="button" data-role="operations"><span>OP</span><strong>Internal operations team</strong><small>Schedules, intake, processing, inventory and dispatch</small><b>→</b></button><button type="button" data-role="vendor"><span>TV</span><strong>Transport vendor</strong><small>Assigned pickup and delivery task actions</small><b>→</b></button><button type="button" data-role="startup"><span>SP</span><strong>Startup partner</strong><small>Incoming material, receipt and quality feedback</small><b>→</b></button></div>`, '', 'roles');
  }

  function openContact() {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    document.querySelector('.public-enquiry-form [name="fullName"]')?.focus({ preventScroll: true });
  }

  function openForm(action, id) {
    const s = state();
    if (action === 'new-pickup') return openDialog('Schedule a collection', 'Add a planned pickup to the shared demo schedule.', `${field('Collection point', 'source', 'text', true, 'Collection point label')}${field('Bin ID', 'bin', 'text', true, 'BIN-000')}${field('Assigned vendor', 'vendor', 'text', true, 'Vendor label · demo')}${field('Collection date', 'date', 'date', true, '', today())}${field('Time window', 'window', 'text', true, '08:00–09:00')}`, 'Create pickup', action);
    if (action === 'record-pickup') return openDialog('Record pickup evidence', 'Record the actual outcome. GPS arrival does not confirm successful collection.', `${selectField('Pickup task', 'pickupId', [[id, id + ' · ' + (s.pickups.find(x => x.id === id)?.source || '')]])}${selectField('Collection outcome', 'outcome', [['Collected Successfully', 'Collected successfully'], ['Partially Collected', 'Partially collected'], ['Bin Empty', 'Bin empty'], ['Access Blocked', 'Access blocked'], ['Bin Missing', 'Bin missing'], ['Other', 'Other']])}${field('Measured quantity (kg)', 'quantity', 'number', false, 'Only if weighed')}${textareaField('Evidence or exception details', 'evidence', 'What was observed? Add a photo reference or explain the exception.')}`, 'Submit pickup record', action);
    if (action === 'new-intake') {
      const eligible = s.pickups.filter(x => x.verified && !s.intakes.some(intake => intake.pickupId === x.id));
      return openDialog('Register facility intake', 'Use facility-measured net weight and retain any discrepancy explanation.', `${selectField('Verified pickup', 'pickupId', eligible.map(x => [x.id, x.id + ' · ' + x.source]))}${field('Net weight (kg)', 'netKg', 'number', true, 'Measured net kg')}${textareaField('Discrepancy / intake notes', 'note', 'Explain a difference from the reported pickup weight, if any.', false)}`, 'Register intake', action);
    }
    if (action === 'new-batch') {
      const eligible = s.intakes.filter(x => x.status === 'Received' && !s.batches.some(batch => (batch.intakeIds || [batch.intakeId]).includes(x.id)));
      return openDialog('Create processing batch', 'Select one or more intake sources. Input weight is summed from facility measurements.', `${multiSelectField('Facility intakes', 'intakeIds', eligible.map(x => [x.id, x.id + ' · ' + x.source + ' · ' + kg(x.netKg)]))}${field('Material category', 'material', 'text', true, 'For example, mixed marigold')}${field('Storage location', 'location', 'text', false, 'Receiving bay')}`, 'Create batch', action);
    }
    if (action === 'complete-batch') {
      const batch = s.batches.find(x => x.id === id);
      return openDialog('Record processing output', `Batch ${id} · input ${kg(batch?.inputKg)}. Usable + rejected must not exceed input.`, `${field('Usable output (kg)', 'usableKg', 'number', true, 'Measured kg')}${field('Rejected / contaminated (kg)', 'rejectedKg', 'number', true, 'Measured kg', '0')}${textareaField('Processing and handling notes', 'processNote', 'Cleaning, segregation and measured quality observations')}${`<label class="checkbox-field"><input type="checkbox" name="estimated"><span>Values are estimates, not measured</span></label>`}`, 'Submit for quality inspection', action, id);
    }
    if (action === 'new-shipment') {
      const eligible = s.batches.filter(x => x.status === 'Available' && x.usableKg > x.reservedKg);
      return openDialog('Create partner shipment', 'Only approved available stock can be reserved. Partner acceptance is a separate step.', `${selectField('Approved batch', 'batchId', eligible.map(x => [x.id, x.id + ' · ' + x.material + ' · available ' + kg(x.usableKg - x.reservedKg)]))}${selectField('Startup partner', 'startup', [['Startup partner 01 (demo)', 'Startup partner 01 (demo)']])}${field('Quantity (kg)', 'quantityKg', 'number', true, 'Within available stock')}${field('Delivery date', 'date', 'date', true, '', today())}${selectField('Assigned vendor', 'vendor', [['North Route Services (demo)', 'North Route Services (demo)'], ['City Loop Logistics (demo)', 'City Loop Logistics (demo)']])}${field('Destination', 'destination', 'text', true, 'Delivery location · demo')}`, 'Reserve & assign', action);
    }
    if (action === 'confirm-receipt') return openDialog('Confirm material receipt', `Shipment ${id} · expected ${kg(s.shipments.find(x => x.id === id)?.expectedKg)}. Discrepancies create an open case.`, `${field('Actual quantity received (kg)', 'receivedKg', 'number', true, 'Measured quantity')}${selectField('Receipt outcome', 'outcome', [['Accepted', 'Accepted'], ['Partially Accepted', 'Partially accepted'], ['Received with Quality Concerns', 'Received with quality concerns'], ['Rejected', 'Rejected']])}${textareaField('Receipt notes', 'receiptNote', 'Condition, count or quality observations', false)}`, 'Save receipt record', action, id);
    if (action === 'new-feedback') return openDialog('Submit quality feedback', `Feedback for ${id} is linked to the shipment and source batch.`, `${selectField('Overall usability', 'rating', [['5', '5 · Excellent'], ['4', '4 · Good'], ['3', '3 · Acceptable'], ['2', '2 · Poor'], ['1', '1 · Unusable']])}${textareaField('Quality observations', 'comments', 'Freshness, moisture, contamination, composition, packaging and usability')}`, 'Submit feedback', action, id);
    if (action === 'new-request') return openDialog('Request future material', 'Your request is sent to operations for review and does not reserve available stock.', `${field('Material category', 'material', 'text', true, 'Material type required')}${field('Requested quantity (kg)', 'quantityKg', 'number', true, 'Quantity')}${field('Required by', 'date', 'date', true, '', today())}${textareaField('Requirements', 'requirements', 'Freshness, moisture, packaging or handling needs', false)}`, 'Submit request', action);
    if (action === 'new-issue') return openDialog('Raise a transport issue', 'Issue details are added to the shared demo exception queue.', `${selectField('Issue category', 'category', [['Vehicle breakdown', 'Vehicle breakdown'], ['Traffic or route obstruction', 'Traffic or route obstruction'], ['Temple inaccessible', 'Temple inaccessible'], ['Bin missing or damaged', 'Bin missing or damaged'], ['No waste available', 'No waste available'], ['Incorrect schedule', 'Incorrect schedule'], ['Safety concern', 'Safety concern'], ['Quantity mismatch', 'Quantity mismatch'], ['Delivery delay', 'Delivery delay'], ['Other', 'Other']])}${field('Affected task or shipment', 'reference', 'text', false, 'PU-0000 / SH-0000')}${selectField('Severity', 'severity', [['Medium', 'Medium'], ['High', 'High'], ['Critical', 'Critical']])}${textareaField('Description', 'description', 'What happened and what response is needed?')}`, 'Report issue', action);
    if (action === 'update-enquiry') {
      const enquiry = s.enquiries.find(item => item.id === id);
      if (!enquiry) return toast('Enquiry not found.', true);
      const statuses = ['New', 'In Review', 'Contacted', 'Closed'];
      const options = [enquiry.status, ...statuses.filter(status => status !== enquiry.status)].map(status => [status, status]);
      return openDialog('Update enquiry status', `${enquiry.id} · ${enquiry.fullName}`, selectField('Status', 'status', options, true, enquiry.status), 'Save status', action, id);
    }
  }

  function submitForm(form) {
    const values = Object.fromEntries(new FormData(form).entries());
    if (form.elements.intakeIds) values.intakeIds = Array.from(form.elements.intakeIds.selectedOptions, option => option.value);
    const action = form.dataset.form;
    if (action === 'contact') {
      const feedback = document.getElementById('enquiry-feedback');
      try {
        const enquiry = data.addEnquiry(values);
        form.reset();
        feedback.textContent = `Demo enquiry ${enquiry.id} was saved in this browser only. It was not securely sent to or shared with an operations team.`;
        feedback.classList.add('enquiry-feedback-visible');
        feedback.setAttribute('role', 'status');
        toast('Demo enquiry saved in this browser only.');
      } catch (error) {
        feedback.textContent = error.message || 'Unable to save this enquiry.';
        feedback.classList.add('enquiry-feedback-visible');
        feedback.setAttribute('role', 'alert');
        toast(error.message || 'Unable to save this enquiry.', true);
      }
      return;
    }
    try {
      if (action === 'new-pickup') { data.createPickup(values); toast('Pickup added to the demo schedule.'); }
      if (action === 'record-pickup') { data.recordPickup(values.pickupId, values); toast('Pickup record submitted for operations review.'); }
      if (action === 'new-intake') { data.createIntake(values); toast('Facility intake registered.'); }
      if (action === 'new-batch') { data.createBatch(values); toast('Batch created from the selected intake.'); }
      if (action === 'complete-batch') { data.completeBatch(form.dataset.id, values); toast('Processing output submitted for inspection.'); }
      if (action === 'new-shipment') { data.createShipment(values); toast('Stock reserved and shipment assigned.'); }
      if (action === 'confirm-receipt') { data.confirmReceipt(form.dataset.id, values); toast('Receipt saved. Discrepancies remain open for review.'); }
      if (action === 'new-feedback') { data.submitFeedback(form.dataset.id, values); toast('Quality feedback submitted.'); }
      if (action === 'new-request') { data.createRequest(values); toast('Material request submitted for operations review.'); }
      if (action === 'new-issue') { data.reportIssue(values); toast('Issue added to the operations exception queue.'); }
      if (action === 'update-enquiry') { data.updateEnquiryStatus(form.dataset.id, values.status); toast('Enquiry status updated.'); }
      if (action === 'complete-batch' && values.estimated === 'on') toast('Estimated batch output saved; it cannot be released as stock.');
      dialogRoot.innerHTML = '';
      render();
    } catch (error) {
      toast(error.message || 'Unable to save this record.', true);
    }
  }

  function exportCsv() {
    const rows = [['Shipment', 'Batch', 'Partner', 'Material', 'Allocated kg', 'Received kg', 'Status'], ...state().shipments.map(x => [x.id, x.batchId, x.startup, x.material, x.quantityKg, x.receivedKg ?? '', x.status])];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'floral-circular-demo-shipments.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    toast('Demo shipment CSV exported.');
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action], [data-view], [data-role]');
    if (!target) return;
    if (target.dataset.role) { role = target.dataset.role; view = role === 'vendor' ? 'today' : 'overview'; render(); return; }
    if (target.dataset.view) { view = target.dataset.view; render(); return; }
    const action = target.dataset.action;
    if (action === 'login' || action === 'switch-role') return openRoles();
    if (action === 'contact') return openContact();
    if (action === 'logout' || action === 'home') { role = null; window.scrollTo(0, 0); render(); return; }
    if (action === 'mobile-menu') return document.querySelector('.public-nav')?.classList.toggle('nav-open');
    if (action === 'sidebar-toggle') return document.querySelector('.sidebar')?.classList.toggle('sidebar-open');
    if (action === 'close-modal') { if (target === event.target || target.closest('.modal')) dialogRoot.innerHTML = ''; return; }
    if (action === 'about-demo') return openDialog('About this demonstration', 'Floral Circular is a fictional demonstration product. All identities, locations, weights and operational records shown are example data.', '<p class="modal-copy">This prototype stores data in your browser only. It does not provide secure user accounts, server-side role enforcement, live GPS, operational route mapping, messaging, or protected document storage. The optional Google Map shows only fictional sample points and requires a configured API key. Never enter personal or confidential information.</p><p class="modal-copy">Real operations require a backend, a relational database, authenticated organisations, role permissions, audit history and configured integrations.</p>', 'Close', 'info');
    if (action === 'reset-demo') { data.resetDemo(); view = role === 'vendor' ? 'today' : 'overview'; toast('Demo data reset to its original sample state.'); render(); return; }
    if (action === 'resolve-alert') { try { data.resolveAlert(target.dataset.id); toast('Alert marked resolved.'); render(); } catch (error) { toast(error.message, true); } return; }
    if (action === 'verify-pickup') { try { data.verifyPickup(target.dataset.id); toast('Pickup verified. Facility intake is now available.'); render(); } catch (error) { toast(error.message, true); } return; }
    if (action === 'start-batch') { try { data.startBatch(target.dataset.id); toast('Processing started.'); render(); } catch (error) { toast(error.message, true); } return; }
    if (action === 'approve-batch') { try { data.approveBatch(target.dataset.id); toast('Quality inspection passed; measured stock released.'); render(); } catch (error) { toast(error.message, true); } return; }
    if (action === 'dispatch-shipment') { try { data.advanceShipment(target.dataset.id, 'In Transit'); toast('Departure recorded. Startup acceptance is still pending.'); render(); } catch (error) { toast(error.message, true); } return; }
    if (action === 'deliver-shipment') { try { data.advanceShipment(target.dataset.id, 'Delivered Awaiting Confirmation'); toast('Delivery evidence recorded. Startup receipt is still pending.'); render(); } catch (error) { toast(error.message, true); } return; }
    if (action === 'export-csv') return exportCsv();
    if (action === 'record-pickup' || action === 'new-pickup' || action === 'new-intake' || action === 'new-batch' || action === 'complete-batch' || action === 'new-shipment' || action === 'confirm-receipt' || action === 'new-feedback' || action === 'new-request' || action === 'new-issue' || action === 'update-enquiry') return openForm(action, target.dataset.id);
  });

  document.addEventListener('submit', event => {
    const form = event.target.closest('[data-form]');
    if (!form) return;
    event.preventDefault();
    submitForm(form);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialogRoot.innerHTML) dialogRoot.innerHTML = '';
  });

  window.addEventListener('floral:datachange', () => { if (role && !dialogRoot.innerHTML) render(); });
  render();
})();