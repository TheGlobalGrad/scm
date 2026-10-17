# Floral Circular

A responsive demonstration of a floral-waste supply-chain coordination platform for Jammu. The public site and three role-specific demo portals share a browser-persisted sample dataset and connected workflows for pickup, facility intake, processing, quality release, stock allocation, dispatch, partner receipt and feedback.

All organisations, locations, events, quantities and performance values in the demonstration are fictional. The platform coordinates a material journey; it does not claim to manufacture products or to represent verified project impact.

## Project layout

```text
scm/
├── frontend/
│   ├── app.js
│   ├── data.js
│   └── styles.css
├── docs/
│   ├── architecture.md
│   └── production-readiness.md
├── .env.example
├── .gitignore
├── index.html
└── README.md
```

There is no backend or database in this prototype. Browser `localStorage` is demonstration storage only and is not suitable for confidential data or multiple users. The source workspace itself is the `scm/` project root.

## Run locally

The frontend is dependency-free. Open `index.html` in a modern browser, or serve this folder with any static HTTP server. For example, with Python already installed:

```powershell
py -m http.server 8000
```

Then open <http://localhost:8000>. No Node.js install, build step, account, API key or cloud service is needed for this demo. The external hero photo and web fonts need an internet connection; the layout and workflows remain usable if those assets cannot load.

## Try the workflow

1. Choose **Portal login**, then **Internal operations team**.
2. In **Collections**, schedule a pickup or verify a collected sample pickup.
3. In **Facility intake**, register a verified pickup using the facility-measured net weight.
4. In **Processing & QC**, create a batch from one or more intake records, start it, record usable and rejected output, then inspect and release measured output.
5. In **Orders & shipments**, allocate only approved available stock.
6. Switch to **Transport vendor** to record dispatch and delivery evidence.
7. Switch to **Startup partner** to record actual receipt. A discrepancy remains disputed and creates an operations alert.
8. Submit feedback after recording receipt. **Reports** recalculates its sample metrics from the shared browser dataset.

Use **Reset demo data** in the portal sidebar to restore the original sample records. Requests, enquiries and issues are stored locally and labelled as demo interactions; they are not sent to an organisation.

## Test and verify

There is no compile or test command because this is a plain static frontend. Validate JavaScript in the browser by exercising the workflow above. Core guards include duplicate scheduled pickup prevention, operations verification before intake, measured positive intake weights, source traceability across multiple intakes, processing mass balance, no release of estimated output, no negative stock allocation, and separate vendor delivery and partner receipt states.

## Production boundary

The role chooser is not authentication. Interface views are not security boundaries. Do not use this prototype to manage real people, partner data, shipments or money. See [Production readiness](docs/production-readiness.md) for the backend, database, permissions, integrations, provider setup and deployment work required before real use. No cloud service is required or provisioned for this static demo.