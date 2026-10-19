# Floral Circular

A responsive demonstration of a floral-waste supply-chain coordination platform for Jammu. The public site and three role-specific demo portals share a browser-persisted sample dataset and connected workflows for pickup, facility intake, processing, quality release, stock allocation, dispatch, partner receipt and feedback.

The role-based workflow portals use fictional demonstration records. Separately, the public Network section shows supplied Jammu location coordinates and planning estimates from the team's workbook; these do not establish verified partnerships, operating facilities, deployed bins, live measurements or project impact. The platform coordinates a proposed material journey; it does not claim to manufacture products.

## Project layout

```text
scm/
├── frontend/
│   ├── app.js
│   ├── data.js
│   ├── planning.js
│   └── styles.css
├── docs/
│   ├── architecture.md
│   └── production-readiness.md
├── .env.example
├── .gitignore
├── vercel.json
└── README.md
```

There is no backend or database in this prototype. Browser `localStorage` is demonstration storage only and is not suitable for confidential data or multiple users. The source workspace itself is the `scm/` project root. The static entry point is `frontend/index.html`.

## Run locally

The frontend is dependency-free. Open `frontend/index.html` in a modern browser, or serve this folder with any static HTTP server. For example, with Python already installed:

```powershell
py -m http.server 8000
```

Then open <http://localhost:8000/frontend/>. No Node.js install, build step, account or cloud service is needed for the demo workflows. The map uses Leaflet and OpenStreetMap tiles with attribution; no paid API key is required. The interactive map, external hero photo and web fonts need an internet connection. If map tiles are unavailable, the location list and workbook-based planning section remain usable.

The public Network section uses static coordinates provided for four temples, three potential processing partners or initiatives, and one proposed Gangyal processing-site location. It also calculates initial bin and pickup plans from the supplied workbook inputs. The operations overview lists pickup records only when their source identifies a temple and provides a selected-temple-to-Gangyal route preview. That route is a straight-line illustration with a simulated marker, not a road route or live GPS track; there is no driver-device feed or backend. Values are estimates and assumptions, not independently verified or operational records. The 10:00 AM and 8:00 PM pickup defaults are retained alongside the workbook's separate six-hour modelled interval; the page calls out that these clock times are ten hours apart.

## Deploy to Vercel

Import the Git repository with the repository root (`.`) as the project root. The root `vercel.json` sets `frontend` as the static output directory. Use the **Other** framework preset and leave build and install commands empty. Vercel will serve `frontend/index.html` and its sibling CSS and JavaScript files without a build step. Do not set the project root to `frontend` while retaining this root config, because the output directory is relative to the project root. The static demo needs no environment variables.

## Try the workflow

1. Choose **Portal login**, then **Internal operations team**.
2. In **Collections**, schedule a pickup or verify a collected sample pickup.
3. In **Facility intake**, register a verified pickup using the facility-measured net weight.
4. In **Processing & QC**, create a batch from one or more intake records, start it, record usable and rejected output, then inspect and release measured output.
5. In **Orders & shipments**, allocate only approved available stock.
6. Switch to **Transport vendor** to record dispatch and delivery evidence.
7. Switch to **Startup partner** to record actual receipt. A discrepancy remains disputed and creates an operations alert.
8. Submit feedback after recording receipt. **Reports** recalculates its sample metrics from the shared browser dataset.

Use **Reset demo data** in the portal sidebar to restore the original sample records. Requests, enquiries and issues are stored locally and labelled as demo interactions; they are not sent to an organisation. The public contribution-enquiry form accepts fictional test details, and the operations **Enquiries** view and **Alerts** feed demonstrate review and status updates within the same browser only.

## Test and verify

There is no compile or test command because this is a plain static frontend. Validate JavaScript in the browser by exercising the workflow above, then submit a fictional contribution enquiry from the public page and review it in the operations portal under **Enquiries** and **Alerts**. Update its status and confirm its new-enquiry alert is resolved. The form has client-side and data-layer validation, but these demo interactions are not secure, shared, or suitable for real personal data. Core guards include duplicate scheduled pickup prevention, operations verification before intake, measured positive intake weights, source traceability across multiple intakes, processing mass balance, no release of estimated output, no negative stock allocation, and separate vendor delivery and partner receipt states.

## Production boundary

The role chooser is not authentication. Interface views are not security boundaries. The contribution form currently writes to browser `localStorage`, where anyone using the browser profile can inspect or change records; there is no server persistence or operations notification delivery. Do not enter real personal or confidential information, or use this prototype to manage people, partner data, shipments or money. See [Production readiness](docs/production-readiness.md) for the backend, database, permissions, integrations, provider setup and deployment work required before real use. No cloud service is required or provisioned for this static demo.