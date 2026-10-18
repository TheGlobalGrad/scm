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
├── vercel.json
└── README.md
```

There is no backend or database in this prototype. Browser `localStorage` is demonstration storage only and is not suitable for confidential data or multiple users. The source workspace itself is the `scm/` project root. The static entry point is `frontend/index.html`.

## Run locally

The frontend is dependency-free. Open `frontend/index.html` in a modern browser, or serve this folder with any static HTTP server. For example, with Python already installed:

```powershell
py -m http.server 8000
```

Then open <http://localhost:8000/frontend/>. No Node.js install, build step, account or cloud service is needed for the demo workflows. The interactive Google Map requires a Google Maps JavaScript API key; without one, the page clearly reports that the map is not configured and still links to Google Maps. The external hero photo and web fonts also need an internet connection.

### Enable the Google Map

Create a Google Maps JavaScript API key in Google Cloud, enable billing and the Maps JavaScript API, and restrict the key to the deployed site's HTTP referrers and the Maps JavaScript API. The key is browser-visible by design, so never use an unrestricted key. Provide it as `window.FloralMapsConfig.googleMapsApiKey` before `app.js` loads, for example by adding this configuration before the `data.js` and `app.js` script tags in `frontend/index.html`:

```html
<script>
  window.FloralMapsConfig = { googleMapsApiKey: "YOUR_RESTRICTED_BROWSER_KEY" };
</script>
```

Do not commit a real key. If a key is not set or Google Maps fails to load, the Network section reports that state instead of claiming the map is working. The map pins are fictional demonstration points, not verified partner or collection-centre locations.

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