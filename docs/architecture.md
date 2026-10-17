# Architecture and workflow

## Current demonstration

`index.html` loads three small browser scripts: `frontend/styles.css` for the public site and responsive portal layouts, `frontend/data.js` for the shared in-browser data store and workflow guards, and `frontend/app.js` for rendering, navigation, dialogs and form actions. The store persists in localStorage and notifies the UI on changes. **This is a single-browser demo store, not a multi-user data service.** Reset clears all local changes and restores the fictional seed dataset.

## Workflow state transitions

- Collection: `Scheduled` to `Collected`, `Partial` or `Exception`; operations separately verifies completed collection records.
- Facility: only a verified pickup can be received. Net weight is recorded at the facility and is not silently replaced with driver-reported weight.
- Processing: `Awaiting Processing` to `Processing` to `Awaiting Quality Inspection` to `Available`. Input is derived from linked measured intakes; output is divided into usable, rejected and process loss. Estimated output cannot be released.
- Inventory: shipment creation reserves a positive quantity no greater than unreserved stock in an approved batch. Successful receipt consumes stock. A discrepancy creates a `Disputed` shipment and open alert instead of confirming acceptance.
- Delivery: vendor actions move `Assigned` to `In Transit` to `Delivered Awaiting Confirmation`; a startup separately records actual received weight and outcome.

The dashboard yield uses recorded accepted output divided by recorded input. Pickup verification is count-based in the sample report. These demo calculations are not a verified reporting period or project result.

## Production data design

Use a relational database such as PostgreSQL with organisation membership and explicit tenant ownership. Core tables should cover users/roles/memberships, organisations, sources and bins, vendors/drivers/vehicles, schedules and pickup events, intake records, processing batches and batch-source joins, inspections, inventory ledger transactions and reservations, material requirements, orders and order-batch allocations, shipments and events, receipt confirmations, quality feedback/disputes, notifications, cost records and append-only audit events.

Keep quantity movements in a protected ledger and derive balances transactionally. Use database constraints and server transactions to prevent negative reservations and to ensure only released inventory can be allocated. Preserve both sides of intake discrepancies. Keep estimates, measurements and actual financial transactions distinguishable in the schema. Store evidence in private object storage with short-lived signed access and retention rules, not in browser localStorage.