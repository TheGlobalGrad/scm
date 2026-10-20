# Architecture and workflow

## Current demonstration

`index.html` loads `frontend/styles.css` for the public site and responsive portal layouts, `frontend/data.js` for the shared in-browser demo data store and workflow guards, `frontend/planning.js` for the supplied Jammu locations and workbook-based bin calculations, and `frontend/app.js` for rendering, navigation, dialogs and form actions. The public map uses Leaflet and OpenStreetMap; its static coordinates are not live tracking or proof of confirmed partners. The public bin plan is estimated planning data, separate from the fictional portal workflow dataset. The contribution-enquiry form validates and stores fictional submissions in localStorage; operations can review them, update their status and see a related item in the existing alerts feed. **This is a single-browser demo store, not a secure or shared data service, and it must not be used for real personal information.** Reset clears all local changes and restores the fictional seed dataset.

The operations overview also lists the latest pickup record explicitly linked by temple name and previews a selected temple-to-Gangyal straight-line pathway. GPS tracking is off; the app does not request or collect browser/device location and shows no vehicle marker. Existing generic collection-point records are not silently attributed to temples. Any later live tracking feature requires explicit driver consent, an authorized device feed and a secured backend.

## Workflow state transitions

- Collection: `Scheduled` to `Collected`, `Partial` or `Exception`; operations separately verifies completed collection records.
- Facility: only a verified pickup can be received. Net weight is recorded at the facility and is not silently replaced with driver-reported weight.
- Processing: `Awaiting Processing` to `Processing` to `Awaiting Quality Inspection` to `Available`. Input is derived from linked measured intakes; output is divided into usable, rejected and process loss. Estimated output cannot be released.
- Inventory: shipment creation reserves a positive quantity no greater than unreserved stock in an approved batch. Successful receipt consumes stock. A discrepancy creates a `Disputed` shipment and open alert instead of confirming acceptance.
- Delivery: vendor actions move `Assigned` to `In Transit` to `Delivered Awaiting Confirmation`; a startup separately records actual received weight and outcome.

The dashboard yield uses recorded accepted output divided by recorded input. Pickup verification is count-based in the sample report. These demo calculations are not a verified reporting period or project result.

## Enquiry demo workflow

The public contact section accepts a name, mobile number, email, optional organisation, stakeholder type, enquiry purpose, optional floral-waste details and optional message. New records start as `New`; operations can set `In Review`, `Contacted` or `Closed`. Each submission adds an open operations alert, resolved when the enquiry moves out of `New`. These records and alerts exist only in that browser's localStorage. A production implementation must instead persist them through an authenticated API in the configured database, enforce server-side validation and access control, and deliver an in-app notification through the selected shared notification mechanism.

## Production data design

Use a relational database such as PostgreSQL with organisation membership and explicit tenant ownership. Core tables should cover users/roles/memberships, organisations, sources and bins, vendors/drivers/vehicles, schedules and pickup events, intake records, processing batches and batch-source joins, inspections, inventory ledger transactions and reservations, material requirements, orders and order-batch allocations, shipments and events, receipt confirmations, quality feedback/disputes, notifications, cost records and append-only audit events.

Keep quantity movements in a protected ledger and derive balances transactionally. Use database constraints and server transactions to prevent negative reservations and to ensure only released inventory can be allocated. Preserve both sides of intake discrepancies. Keep estimates, measurements and actual financial transactions distinguishable in the schema. Store evidence in private object storage with short-lived signed access and retention rules, not in browser localStorage.