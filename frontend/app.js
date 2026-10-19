(function() {
        const data = window.FloralData;
        const app = document.getElementById('app');
        const dialogRoot = document.getElementById('dialog-root');
        let role = null;
        let view = 'overview';
        let toastTimer;
        const planning = window.FloralPlanning;
        const planningDayLabels = { ordinary: 'Ordinary day', tuesday: 'Tuesday', festival: 'Festival day' };
        let planningDay = 'ordinary';
        let selectedLocationId = 'raghunath';
        let selectedTempleId = 'raghunath';
        let planningMap;
        let planningResizeObserver;
        let planningResizeHandler;
        let planningTileTimer;
        let planningMarkers = new Map();
        let planningSpiderLayers = [];
        let activePlanningPopup;

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
        <section class="network-section section-wrap" id="network">
          <div class="section-kicker">A CONNECTED NETWORK <span>03 — 05</span></div>
          <div class="section-heading-row"><h2>Plan a more thoughtful<br>flower-waste journey.</h2><p>Explore the proposed Jammu network and the workbook-based bin plan. Potential partners and site locations are not confirmed operations.</p></div>
          <div class="network-map-card">
            <div class="network-map-heading"><div><span class="mini-label">JAMMU · LOCATION PLANNING MAP</span><h3>Temples, potential partners and a proposed site.</h3></div><span id="planning-map-status" class="map-status" data-state="loading" role="status" aria-live="polite">Loading OpenStreetMap…</span></div>
            <p class="network-map-note">Pins use the supplied coordinates. Nearby points may fan out visually at overview zoom; popups and directions retain each exact coordinate. Temple points are proposed collection locations; partner markers are potential processing partners or initiatives; Gangyal is a proposed site only. None of these markers indicates a confirmed agreement or operational facility.</p>
            <div class="planning-map-tools">
              <label class="planning-search"><span>Search locations</span><input id="location-search" type="search" placeholder="Temple, initiative or area" autocomplete="off"></label>
              <fieldset class="planning-filters"><legend>Show on map and in the list</legend>
                <label><input class="category-filter" type="checkbox" value="temple" checked><span class="map-key map-key-temple">T</span> Temples / collection points</label>
                <label><input class="category-filter" type="checkbox" value="partner" checked><span class="map-key map-key-partner">P</span> Potential partners / initiatives</label>
                <label><input class="category-filter" type="checkbox" value="site" checked><span class="map-key map-key-site">S</span> Proposed processing site</label>
              </fieldset>
            </div>
            <div class="planning-map-layout">
              <div id="network-map" class="network-map" role="region" aria-label="Interactive map of eight supplied temple, potential partner and proposed-site coordinates"></div>
              <aside class="location-panel" aria-label="Map locations">
                <h4>Locations <span id="location-count"></span></h4>
                <div id="location-list" class="location-list" role="list"></div>
                <div id="selected-location-detail" class="selected-location-detail" aria-live="polite"></div>
              </aside>
            </div>
            <div class="network-map-footer"><span>Map tiles © OpenStreetMap contributors</span><a class="text-link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">Attribution <span aria-hidden="true">↗</span></a></div>
          </div>
          <section class="planning-dashboard" aria-labelledby="planning-title">
            <div class="planning-heading"><div><span class="mini-label">WORKBOOK-BASED ESTIMATES · FOUR TEMPLES</span><h3 id="planning-title">Temple bin planning and pickup management</h3><p>Switch day type to compare estimated visitor counts, flower waste, bin cover and pickup planning.</p></div>
              <div class="day-selector" role="group" aria-label="Select planning day type">
                <button type="button" data-planning-day="ordinary" aria-pressed="true">Ordinary day</button>
                <button type="button" data-planning-day="tuesday" aria-pressed="false">Tuesday</button>
                <button type="button" data-planning-day="festival" aria-pressed="false">Festival day</button>
              </div>
            </div>
            <div id="planning-summary" class="planning-summary"></div>
            <div id="temple-planning-cards" class="temple-planning-grid"></div>
            <div class="pickup-timing-note"><strong>Pickup-time check:</strong> the workbook models a 6-hour gap (12 accumulation hours ÷ 2 pickups), but its default 10:00 AM and 8:00 PM pickup times are 10 hours apart on the clock. Both workbook values are retained; the 6-hour model result is not a promise about real freshness or a claim that the displayed times are 6 hours apart.</div>
            <details class="planning-methodology"><summary>Methodology and assumptions</summary>
              <div class="methodology-grid">
                <div><h4>Model inputs and calculation</h4><ul><li>20 kg rated container (cleaning-worker input) and about 95% maximum fill (team field input) produce a calculated usable capacity of 19 kg. The workbook's minimum of 2 permanent bins is a team decision for placing bins at different points, such as floors and entry/exit gates.</li><li>12 accumulation hours and 2 daily pickup rounds are workbook inputs; the latter is attributed to a cleaning worker. The 24-hour freshness limit is an assumption based on the workbook note that flowers rot within 24–48 hours.</li><li>Default pickup times 10:00 AM (after the morning rush) and 8:00 PM (after evening aarti) are assumptions in the workbook. The modelled interval is 12 ÷ 2 = 6 hours.</li><li>Permanent bins = the largest of ordinary- and Tuesday-gap requirements, the minimum 2 bins, and the ceiling of the busier regular-day footfall ÷ 500. The 500-visitors-per-bin rule is an assumption, not a measured standard.</li><li>Festival bins are permanent bins plus the workbook's temple-specific temporary-bin decisions, subject to the calculated festival interval requirement. Daily waste = estimated visitors × estimated kg per visitor; accumulation rate = daily waste ÷ 12 hours.</li><li>Bins needed for one pickup gap = round up (kg/hour × 6 hours ÷ 19 kg). Time to fill one bin = 19 kg ÷ kg/hour; time for all bins in place = planned bin count × 19 kg ÷ kg/hour.</li></ul></div>
                  <div><h4>Source and validation limits</h4><p>These are planning estimates transcribed from the team's attached workbook, not live or independently verified measurements. The workbook cites a Team Warriors, University of Jammu Old City survey (Feb 2024; 68,107 weekly visitors across 30 temples), including its Tuesday index (20.7% of weekly visitors). It cites a festival-waste midpoint of 18.9 and 22.5 kg in Table 4.3.9, with the basis marked unclear, and a 3.21–3.50 kg ordinary-day Ranbireshwar range for all waste types. The workbook's cited source descriptions and temple-specific assumptions are shown in the cards below; they have not been independently checked here.</p><p>Other values, including festival footfall and the 500-visitors-per-bin rule, are assumptions. Validate estimates through temple surveys, collection records and operational trials. The model supports initial planning; it does not establish actual bin deployment, pickup service, flower freshness or a validated operating system. The workbook labels its modelled gap within its assumed freshness limit because 6 hours is less than 24 hours; this is not a freshness guarantee.</p></div>
              </div>
            </details>
          </section>
          <section class="proposed-flow" aria-labelledby="flow-title">
            <div class="flow-heading"><div><span class="mini-label">A CONCEPTUAL SYSTEM FLOW</span><h3 id="flow-title">From offering to possible recovery.</h3></div><p>A proposed journey for planning and discussion—not a representation that these steps are already operational.</p></div>
            <ol class="circular-flow">
              <li><span>01</span><strong>Temple floral waste</strong><small>Offerings are generated</small></li>
              <li><span>02</span><strong>Segregate & collect</strong><small>At planned temple bins</small></li>
              <li><span>03</span><strong>Scheduled pickup</strong><small>Collection and transport concept</small></li>
              <li><span>04</span><strong>Processing option</strong><small>Potential partners or proposed site</small></li>
              <li><span>05</span><strong>Possible products</strong><small>Compost, agarbatti, dhoop, dyes or other pathways</small></li>
            </ol>
            <p class="flow-disclaimer">Potential organisations are not confirmed partners, and no processing site or product output is represented as approved or operational.</p>
          </section>
        </section>
        <section class="impact-section" id="impact"><div class="section-wrap"><div class="section-kicker">MEASURE WHAT IS VERIFIED <span>04 — 05</span></div><div class="impact-header"><h2>Transparent by design.</h2><span class="period-tag">DEMONSTRATION DATA ONLY</span></div><p class="impact-copy">Illustrative workflow totals from fictional demo records. These figures do not represent project activity or environmental impact.</p><div class="impact-metrics"><div><small>Pickup quantities recorded</small><strong>${kg(collected)}</strong><span>Demo records · reported weight</span></div><div><small>Quality-approved output</small><strong>${kg(approved)}</strong><span>Demo records · measured output</span></div><div><small>Confirmed accepted</small><strong>${kg(s.shipments.filter(x => x.status === 'Receipt Confirmed').reduce((n, x) => n + (x.receivedKg || 0), 0))}</strong><span>Demo records · partner-confirmed</span></div><div><small>Verified participation</small><strong>—</strong><span>No verified data available</span></div></div></div></section>
        <section class="resources-section section-wrap" id="resources"><div class="section-kicker">RESOURCES <span>05 — 05</span></div><div class="resource-row"><div><span class="mini-label">METHODOLOGY & REPORTING</span><h2>Evidence before claims.</h2></div><div><p>Reports, measurement definitions and educational resources will be published as they become available. No project reports have been added yet.</p><span class="empty-inline">No resources available</span></div></div></section>
        <section class="faq-section section-wrap" id="faq"><div class="section-kicker">PRACTICAL QUESTIONS <span>POLICIES</span></div><div class="faq-grid"><div><span class="mini-label">FAQ & RESPONSIBILITY</span><h2>Clear expectations<br>at every handover.</h2><p>Project procedures and formal policies should be agreed with participating organisations before operations begin.</p></div><div class="faq-list"><details><summary>How are quantities verified?</summary><p>Collection reports and facility net weights are separate records. Differences require a note and review; processing output is divided into usable, rejected and loss quantities.</p></details><details><summary>Is vehicle location tracked?</summary><p>The Jammu map shows the supplied static temple, potential-initiative and proposed-site locations. It does not track vehicles, verify operational status or show approved routes. The basic map uses OpenStreetMap and does not require a paid API key.</p></details><details><summary>What if a delivery quantity differs?</summary><p>The receiving partner records actual quantity and outcome. A difference remains disputed, creates an operations alert and is not counted as accepted stock.</p></details><details><summary>How is demo information handled?</summary><p>Sample workflow changes stay in this browser's local storage. Do not enter personal, confidential or real operational data. There is no account security or server-side access control.</p></details><details id="privacy"><summary>Privacy notice</summary><p>This prototype has no server-side collection, analytics, GPS or messaging integration. A production privacy notice must explain data use, retention, access, evidence storage, tracking consent and contact routes after those services are configured.</p></details><details id="terms"><summary>Terms and partner responsibilities</summary><p>These demo screens do not establish service, payment, safety, quality or dispute terms. Participating organisations should approve written procedures and obtain local legal review before use.</p></details></div></div></section>
        <section class="contact-section" id="contact"><div class="section-wrap contact-grid contact-grid-enquiry"><div><span class="mini-label">WORK WITH THE NETWORK</span><h2>Contribute floral waste<br>or submit an enquiry.</h2><p>Flower shops, temples, individuals and organisations can tell us about floral waste donations or sales, regular collection, partnerships, or another enquiry.</p><p>Share your contact details and, where relevant, the material, estimated quantity, location and collection frequency.</p></div><div class="contact-action"><form class="public-enquiry-form" data-form="contact" aria-describedby="enquiry-storage-notice enquiry-feedback"><h3>Contribution enquiry</h3><p class="enquiry-form-intro">Fields marked <i>*</i> are required.</p><div class="public-enquiry-fields"><label class="form-field"><span>Full name <i>*</i></span><input name="fullName" type="text" required minlength="2" maxlength="100" autocomplete="name" placeholder="Your full name"></label><label class="form-field"><span>Mobile number <i>*</i></span><input name="mobile" type="tel" required inputmode="tel" autocomplete="tel" maxlength="20" pattern="\\+?[0-9\\s\\(\\)\\.\\-]{7,20}" placeholder="+91 98765 43210"></label><label class="form-field"><span>Email address <i>*</i></span><input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="you@example.in"></label><label class="form-field"><span>Organization / shop name</span><input name="organization" type="text" maxlength="120" autocomplete="organization" placeholder="Optional"></label><label class="form-field"><span>Stakeholder type <i>*</i></span><select name="stakeholderType" required><option value="">Choose one</option><option>Flower shopkeeper</option><option>Temple</option><option>Individual</option><option>Organization</option><option>Other</option></select></label><label class="form-field"><span>Purpose of enquiry <i>*</i></span><select name="purpose" required><option value="">Choose one</option><option>Donate floral waste</option><option>Sell floral waste</option><option>Arrange regular collection</option><option>Partner with Floral Circular</option><option>General enquiry</option></select></label><label class="form-field form-field-wide"><span>Floral waste details</span><textarea name="floralDetails" rows="3" maxlength="1000" placeholder="Optional: flower types, estimated quantity, location, collection frequency, handling needs"></textarea><small class="field-hint">Share only what is relevant; up to 1,000 characters.</small></label><label class="form-field form-field-wide"><span>Additional message</span><textarea name="message" rows="3" maxlength="2000" placeholder="Anything else you would like us to know?"></textarea></label></div><p class="enquiry-storage-notice" id="enquiry-storage-notice"><strong>Demonstration only:</strong> This site has no backend or secure database. Do not enter real personal or confidential information; submissions are stored only in this browser and are not shared with an operations team.</p><p class="enquiry-feedback" id="enquiry-feedback" role="status" aria-live="polite"></p><button class="button button-primary enquiry-submit" type="submit">Submit enquiry</button></form></div></div></section>
      </main>
      <footer class="public-footer"><a class="brand-lockup" href="#home">${icon}<span><strong>FLORAL CIRCULAR</strong><small>FROM OFFERING TO OPPORTUNITY</small></span></a><span>Coordination for a more accountable circular supply chain.</span><div><a href="#about">About</a><a href="#process">Process</a><a href="#faq">FAQ</a><a href="#privacy">Privacy</a><a href="#terms">Terms</a><button data-action="login">Portal login</button><a href="#contact">Contact</a></div><small class="footer-note">Demo interface · Sample data is fictional · Policies require local legal review</small></footer>`;
          initializePlanningMap();
          updatePlanningExperience();
        }

        function setPlanningMapStatus(state, message) {
          const status = document.getElementById('planning-map-status');
          if (!status) return;
          status.dataset.state = state;
          status.textContent = message;
        }

        function destroyPlanningMap() {
          clearTimeout(planningTileTimer);
          if (planningResizeObserver) planningResizeObserver.disconnect();
          if (planningResizeHandler) window.removeEventListener('resize', planningResizeHandler);
          planningResizeObserver = null;
          planningResizeHandler = null;
          planningSpiderLayers.forEach(layer => layer.remove());
          if (planningMap) planningMap.remove();
          planningMap = null;
          planningMarkers = new Map();
          planningSpiderLayers = [];
          activePlanningPopup = null;
        }

        function categoryLabel(category) {
          return ({ temple: 'Temple / collection point', partner: 'Potential processing partner or initiative', site: 'Proposed processing site' })[category];
        }

        function locationDirectionUrl(location) {
          return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
        }

        function locationPopup(location) {
          const templePlan = location.templeId ? planning.getPlan(location.templeId, planningDay) : null;
          const estimate = templePlan
            ? `<p>Estimated ${planningDayLabels[planningDay].toLowerCase()} waste: <strong>${formatPlanningKg(templePlan.wasteKgPerDay)}</strong> · planned bins: <strong>${templePlan.plannedBins}</strong></p>`
            : '';
          return `<div class="planning-popup"><strong>${esc(location.name)}</strong><small>${esc(categoryLabel(location.category))}</small><p>${esc(location.role)}</p>${estimate}<small>${location.lat}, ${location.lng}</small><a href="${locationDirectionUrl(location)}" target="_blank" rel="noopener noreferrer">Directions ↗</a></div>`;
        }

        function initializePlanningMap() {
          const mapElement = document.getElementById('network-map');
          if (!mapElement) return;
          if (!window.L) {
            setPlanningMapStatus('error', 'The map library is unavailable. The searchable location list and planning data remain usable.');
            return;
          }
          destroyPlanningMap();
          try {
            const map = window.L.map(mapElement, { scrollWheelZoom: true });
            planningMap = map;
            const tileLayer = window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            }).addTo(map);

            planning.locations.forEach(location => {
              const marker = window.L.marker([location.lat, location.lng], {
                title: location.name,
                icon: planningMarkerIcon(location)
              });
              marker.on('click', () => selectPlanningLocation(location.id, true));
              planningMarkers.set(location.id, marker);
            });

            const bounds = window.L.latLngBounds(planning.locations.map(location => [location.lat, location.lng]));
            map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
            map.on('zoomend moveend', refreshPlanningMarkers);
            refreshPlanningMarkers();
            setPlanningMapStatus('loading', 'Loading OpenStreetMap tiles…');
            planningTileTimer = setTimeout(() => {
              if (planningMap === map) setPlanningMapStatus('error', 'Map tiles are not loading. Check your internet connection; the location list and bin plan remain usable.');
            }, 12000);
            tileLayer.once('tileload', () => {
              if (planningMap !== map) return;
              clearTimeout(planningTileTimer);
              setPlanningMapStatus('ready', 'OpenStreetMap is ready · all locations plotted.');
            });
            tileLayer.once('tileerror', () => {
              if (planningMap === map) setPlanningMapStatus('error', 'Some map tiles could not load. Check your connection; locations remain available in the list.');
            });
            if (window.ResizeObserver) {
              planningResizeObserver = new ResizeObserver(() => {
                if (planningMap !== map) return;
                map.invalidateSize({ pan: false });
                map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14, animate: false });
              });
              planningResizeObserver.observe(mapElement);
            }
            planningResizeHandler = () => {
              if (planningMap !== map) return;
              map.invalidateSize({ pan: false });
              map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14, animate: false });
            };
            window.addEventListener('resize', planningResizeHandler);
            setTimeout(() => {
              if (planningMap !== map) return;
              map.invalidateSize({ pan: false });
              map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14, animate: false });
            }, 0);
          } catch (error) {
            destroyPlanningMap();
            console.error('Unable to initialize the planning map.', error);
            setPlanningMapStatus('error', `The map could not be initialized (${error.message}). The location list and planning data remain usable.`);
          }
        }

        function planningMarkerIcon(location) {
          const selected = location.id === selectedLocationId;
          const symbol = ({ temple: 'T', partner: 'P', site: 'S' })[location.category];
          return window.L.divIcon({
            className: `planning-marker-container${selected ? ' planning-marker-selected' : ''}`,
            html: `<span class="planning-marker planning-marker-${location.category}" aria-hidden="true">${symbol}</span>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            popupAnchor: [0, -12]
          });
        }

        function formatPlanningKg(value) {
          return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 3 }) + ' kg';
        }

        function formatPlanningNumber(value) {
          return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 });
        }

        function formatPlanningRate(value) {
          return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 3 });
        }

        function formatPlanningHours(value) {
          if (!Number.isFinite(value)) return '—';
          return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' h';
        }

        function formatPickupTime(value) {
          const [hours, minutes] = value.split(':').map(Number);
          const suffix = hours >= 12 ? 'PM' : 'AM';
          return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
        }

        function getVisibleCategories() {
          return new Set(Array.from(document.querySelectorAll('.category-filter:checked'), input => input.value));
        }

        function renderLocationList() {
          const list = document.getElementById('location-list');
          if (!list) return;
          const query = (document.getElementById('location-search')?.value || '').trim().toLocaleLowerCase();
          const visibleCategories = getVisibleCategories();
          const filtered = planning.locations.filter(location =>
            visibleCategories.has(location.category) &&
            `${location.name} ${categoryLabel(location.category)} ${location.role}`.toLocaleLowerCase().includes(query)
          );
          document.getElementById('location-count').textContent = `(${filtered.length})`;
          list.innerHTML = filtered.length
            ? filtered.map(location => `<button type="button" role="listitem" class="location-list-item${selectedLocationId === location.id ? ' is-selected' : ''}" data-action="select-planning-location" data-id="${esc(location.id)}" aria-pressed="${selectedLocationId === location.id}"><span class="map-key map-key-${location.category}">${({ temple: 'T', partner: 'P', site: 'S' })[location.category]}</span><span><strong>${esc(location.name)}</strong><small>${esc(categoryLabel(location.category))}</small></span><span aria-hidden="true">›</span></button>`).join('')
            : '<p class="location-empty">No locations match these filters.</p>';
        }

        function updateLocationDetails() {
          const panel = document.getElementById('selected-location-detail');
          if (!panel) return;
          const location = planning.locations.find(item => item.id === selectedLocationId);
          if (!location) {
            panel.innerHTML = '<p>Select a location to view its role and details.</p>';
            return;
          }
          const plan = location.templeId ? planning.getPlan(location.templeId, planningDay) : null;
          const planningDetails = plan
            ? `<div class="location-plan-summary"><strong>${esc(planningDayLabels[planningDay])} estimate</strong><span>${formatPlanningKg(plan.wasteKgPerDay)} · ${plan.plannedBins} planned bin${plan.plannedBins === 1 ? '' : 's'}</span><small>${plan.permanentBins} permanent${plan.temporaryFestivalBins ? ` + ${plan.temporaryFestivalBins} temporary festival` : ''} · pickup ${formatPickupTime(planning.parameters.morningPickup)} and ${formatPickupTime(planning.parameters.eveningPickup)}</small></div>`
            : '<p class="no-location-plan">No bin counts, footfall estimates or pickup schedule are assigned to this location.</p>';
          panel.innerHTML = `<span class="mini-label">${esc(categoryLabel(location.category))}</span><h4>${esc(location.name)}</h4><p>${esc(location.role)}</p><small class="location-coordinates">${location.lat}, ${location.lng}</small>${planningDetails}<a href="${locationDirectionUrl(location)}" target="_blank" rel="noopener noreferrer">Directions to this point ↗</a>`;
        }

        function updateCategoryMarkers() {
          refreshPlanningMarkers();
        }

        function refreshPlanningMarkers() {
          if (!planningMap) return;
          planningSpiderLayers.forEach(layer => layer.remove());
          planningSpiderLayers = [];
          planningMarkers.forEach((marker, locationId) => {
            const location = planning.locations.find(item => item.id === locationId);
            if (location) marker.setIcon(planningMarkerIcon(location));
            marker.removeFrom(planningMap);
          });

          const visibleCategories = getVisibleCategories();
          const points = planning.locations
            .filter(location => visibleCategories.has(location.category))
            .map(location => ({
              location,
              point: planningMap.latLngToContainerPoint([location.lat, location.lng])
            }));
          const parents = points.map((_, index) => index);
          const find = index => parents[index] === index ? index : (parents[index] = find(parents[index]));
          const join = (left, right) => { parents[find(left)] = find(right); };

          for (let left = 0; left < points.length; left++) {
            for (let right = left + 1; right < points.length; right++) {
              if (points[left].point.distanceTo(points[right].point) < 26) join(left, right);
            }
          }

          const groups = new Map();
          points.forEach((item, index) => {
            const root = find(index);
            if (!groups.has(root)) groups.set(root, []);
            groups.get(root).push(item);
          });

          groups.forEach(group => {
            if (group.length === 1) {
              planningMarkers.get(group[0].location.id).addTo(planningMap);
              return;
            }

            // Fan out overlapping symbols visually while each connector remains anchored to its exact coordinate.
            const center = group.reduce((sum, item) => sum.add(item.point), window.L.point(0, 0)).divideBy(group.length);
            const radius = Math.max(28, group.length * 10);
            group.forEach(({ location }, index) => {
              const angle = (index / group.length) * Math.PI * 2 - Math.PI / 2;
              const displayPoint = center.add(window.L.point(Math.cos(angle) * radius, Math.sin(angle) * radius));
              const displayPosition = planningMap.containerPointToLatLng(displayPoint);
              const originalPosition = window.L.latLng(location.lat, location.lng);
              const leg = window.L.polyline([originalPosition, displayPosition], {
                color: '#69766a',
                weight: 1,
                opacity: 0.75,
                interactive: false
              }).addTo(planningMap);
              const marker = window.L.marker(displayPosition, {
                title: location.name,
                icon: planningMarkerIcon(location),
                riseOnHover: true,
                zIndexOffset: 500
              }).addTo(planningMap);
              marker.on('click', () => selectPlanningLocation(location.id, true));
              planningSpiderLayers.push(leg, marker);
            });
          });
        }

        function updatePlanningDashboard() {
          const summary = planning.getSummary(planningDay);
          const summaryElement = document.getElementById('planning-summary');
          const cardsElement = document.getElementById('temple-planning-cards');
          if (!summaryElement || !cardsElement) return;

          summaryElement.innerHTML = `
            <article><span>Estimated waste · ${esc(planningDayLabels[planningDay])}</span><strong>${formatPlanningKg(summary.wasteKgPerDay)}</strong><small>Across four temples · planning estimate</small></article>
            <article><span>Permanent bins</span><strong>${summary.permanentBins}</strong><small>Planned year-round · not deployed</small></article>
            <article><span>Festival-only extra bins</span><strong>${summary.extraFestivalBins}</strong><small>Temporary planning total across four temples</small></article>
            <article><span>Bins planned · ${esc(planningDayLabels[planningDay])}</span><strong>${summary.plannedBins}</strong><small>${planningDay === 'festival' ? `${summary.permanentBins} permanent + ${summary.extraFestivalBins} temporary` : 'Permanent bins only for regular operations'}</small></article>`;

          cardsElement.innerHTML = summary.plans.map(plan => `
            <article class="temple-plan-card${selectedTempleId === plan.temple.id ? ' is-selected' : ''}">
              <div class="temple-plan-title"><div><span class="mini-label">${plan.temple.id === 'raghunath' ? 'MAP: SHRI RAGHUNATH TEMPLE' : 'TEMPLE BIN PLAN'}</span><h4>${esc(plan.temple.name)}</h4></div><button type="button" class="text-link" data-action="select-planning-temple" data-id="${esc(plan.temple.id)}" aria-pressed="${selectedTempleId === plan.temple.id}">View on map <span aria-hidden="true">↗</span></button></div>
              <div class="temple-plan-primary"><div><small>Estimated daily floral waste</small><strong>${formatPlanningKg(plan.wasteKgPerDay)}</strong></div><div><small>Estimated visitors</small><strong>${formatPlanningNumber(plan.footfall)}</strong></div></div>
              <div class="temple-plan-stats">
                <div><span>Accumulation rate</span><strong>${formatPlanningRate(plan.accumulationKgPerHour)} kg/h</strong></div>
                <div><span>One bin may fill in</span><strong>${formatPlanningHours(plan.hoursToFillOneBin)}</strong></div>
                <div><span>Bins for modelled ${planning.parameters.modelledPickupGapHours} h gap</span><strong>${plan.binsNeededPerPickup}</strong></div>
                <div><span>Time until all planned bins may fill</span><strong>${formatPlanningHours(plan.hoursUntilAllBinsFull)}</strong></div>
              </div>
              <div class="temple-bin-count"><span>Permanent bins <strong>${plan.permanentBins}</strong></span>${plan.temporaryFestivalBins ? `<span>Festival-only extra <strong>${plan.temporaryFestivalBins}</strong></span>` : ''}<span>Planned on site <strong>${plan.plannedBins}</strong></span></div>
              <div class="temple-pickup-schedule"><span>Planned pickups · ${planning.parameters.pickupsPerDay}/day</span><strong>${formatPickupTime(planning.parameters.morningPickup)} <i>·</i> ${formatPickupTime(planning.parameters.eveningPickup)}</strong></div>
              <details class="temple-source-notes"><summary>Workbook basis and source notes</summary><p><strong>Footfall:</strong> ${esc(plan.temple.footfallBasis)}</p><p><strong>Waste per visitor:</strong> ${esc(plan.temple.wasteBasis)}</p><p><strong>Festival extra bins:</strong> ${plan.temple.extraFestivalBins} temporary bins; a team decision recorded in the workbook, not a permanent-bin count.</p></details>
            </article>`).join('');

          document.querySelectorAll('[data-planning-day]').forEach(button => {
            const active = button.dataset.planningDay === planningDay;
            button.setAttribute('aria-pressed', String(active));
          });
          updateLocationDetails();
          if (planningMap) {
            refreshPlanningMarkers();
            const location = planning.locations.find(item => item.id === selectedLocationId);
            if (activePlanningPopup && location) activePlanningPopup.setContent(locationPopup(location));
          }
        }

        function updatePlanningExperience() {
          renderLocationList();
          updateLocationDetails();
          updatePlanningDashboard();
        }

        function selectPlanningLocation(locationId, moveMap) {
          const location = planning.locations.find(item => item.id === locationId);
          if (!location) return;
          selectedLocationId = location.id;
          selectedTempleId = location.templeId || null;
          updatePlanningExperience();
          if (planningMap && moveMap) {
            activePlanningPopup = window.L.popup({ maxWidth: 280 })
              .setLatLng([location.lat, location.lng])
              .setContent(locationPopup(location))
              .openOn(planningMap);
            planningMap.flyTo([location.lat, location.lng], Math.max(planningMap.getZoom(), 14));
          }
        }

        function setPlanningDay(dayType) {
          if (!Object.prototype.hasOwnProperty.call(planningDayLabels, dayType)) return;
          planningDay = dayType;
          updatePlanningDashboard();
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
    destroyPlanningMap();
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
    const target = event.target.closest('[data-action], [data-view], [data-role], [data-planning-day]');
    if (!target) return;
    if (target.dataset.planningDay) { setPlanningDay(target.dataset.planningDay); return; }
    if (target.dataset.role) { role = target.dataset.role; view = role === 'vendor' ? 'today' : 'overview'; render(); return; }
    if (target.dataset.view) { view = target.dataset.view; render(); return; }
    const action = target.dataset.action;
    if (action === 'select-planning-location') return selectPlanningLocation(target.dataset.id, true);
    if (action === 'select-planning-temple') {
      const temple = planning.temples.find(item => item.id === target.dataset.id);
      if (temple) selectPlanningLocation(temple.locationId, true);
      return;
    }
    if (action === 'login' || action === 'switch-role') return openRoles();
    if (action === 'contact') return openContact();
    if (action === 'logout' || action === 'home') { role = null; window.scrollTo(0, 0); render(); return; }
    if (action === 'mobile-menu') return document.querySelector('.public-nav')?.classList.toggle('nav-open');
    if (action === 'sidebar-toggle') return document.querySelector('.sidebar')?.classList.toggle('sidebar-open');
    if (action === 'close-modal') { if (target === event.target || target.closest('.modal')) dialogRoot.innerHTML = ''; return; }
    if (action === 'about-demo') return openDialog('About this demonstration', 'Floral Circular is a demonstration product with a proposed temple collection and bin-planning model.', '<p class="modal-copy">The public map uses the supplied static coordinates and OpenStreetMap tiles; it does not show live GPS, operational routes or verified agreements. Bin, footfall and waste values are workbook-based planning estimates, not measured operating results. The role-based prototype still stores its sample workflow data in this browser only. Never enter personal or confidential information.</p><p class="modal-copy">Real operations require a backend, a relational database, authenticated organisations, role permissions, audit history and configured integrations.</p>', 'Close', 'info');
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

  document.addEventListener('input', event => {
    if (event.target.id === 'location-search') renderLocationList();
  });

  document.addEventListener('change', event => {
    if (event.target.matches('.category-filter')) {
      renderLocationList();
      updateCategoryMarkers();
    }
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