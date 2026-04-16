# Toronto Green Map

An interactive web map of Toronto that visualises green infrastructure, urban tree canopy, impermeable surfaces, stormwater systems, parking, population density, and more. The map is built with React + Mapbox GL JS on the frontend and served by a Node.js/Express API on the backend.

Live: [https://edmund-tang.us](https://edmund-tang.us)

---

## Architecture

```
Toronto-green-map/
├── frontend/          # Vite + React app (Mapbox GL JS)
├── backend/           # Node.js + Express API server (port 3001)
├── data/              # GeoJSON data layers
│   ├── contours/
│   ├── flood/
│   ├── green/
│   ├── impermeable/
│   ├── parking/
│   ├── sewer/
│   ├── land_cover.geojson
│   ├── liberty_village.geojson
│   ├── population.geojson
│   └── rain_gauges.geojson
├── tiles/
│   └── trees_tiles/   # Pre-tiled tree canopy GeoJSON files
├── .github/
│   └── workflows/     # GitHub Actions CI/CD
├── Dockerfile
└── .dockerignore
```

The frontend is a Vite + React single-page application. In development it proxies API requests to the backend at `http://localhost:3001`. In production the frontend static files are served via Nginx (or the backend itself) alongside the Express API.

---

## API Contract

The backend exposes the following endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/data/:layer` | GeoJSON for a named layer (`boundary`, `parking`, `greenp`, `population`, `rain`, `impermeable`, `contours`, `flood`, `greenstreets`, `greenspaces`, `landcover`, `sewer`) |
| GET | `/api/tiles/trees/:key` | Single tree-tile GeoJSON (e.g. key `-7913_4378`) |
| GET | `/api/parking/all` | Full city parking lot dataset |
| GET | `/api/green/all` | Full city Green P parking dataset |

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 9+

### 1. Clone the repository

```bash
git clone https://github.com/edmundTang21/Toronto-green-map.git
cd Toronto-green-map
```

### 2. Start the backend

```bash
cd backend
npm install
npm start          # starts Express on http://localhost:3001
```

### 3. Start the frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev        # starts Vite dev server on http://localhost:5173
```

The Vite dev server is configured to proxy `/api` requests to `http://localhost:3001`.

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Building for Production

```bash
cd frontend
npm run build      # outputs to frontend/dist/
```

The compiled `frontend/dist/` directory is what Nginx serves in production.

---

## Deployment

The application is deployed to a DigitalOcean droplet at `167.172.139.126`.

- **Frontend:** Nginx serves the compiled `frontend/dist/` at `https://edmund-tang.us`
- **Backend:** Managed by PM2 under the process name `green-map-backend`, listening on port 3001
- **Deploy path:** `/var/www/green-map/`

Deployments are triggered automatically by pushing to `main` via the GitHub Actions `deploy.yml` workflow. The workflow SSHs into the server, pulls the latest code, rebuilds the frontend, and restarts the backend with PM2.

To deploy manually:

```bash
ssh root@167.172.139.126
cd /var/www/green-map
git pull origin main
cd frontend && npm ci && npm run build && cd ..
pm2 restart green-map-backend
```

### GitHub Secrets required

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Private key for SSH access to `root@167.172.139.126` |

---

## Data Sources

| Layer | Source |
|-------|--------|
| Tree canopy | City of Toronto Open Data — Street Tree data |
| Green spaces | City of Toronto Open Data — Green Spaces |
| Green Streets | City of Toronto Open Data — Green Streets |
| Parking lots | City of Toronto Open Data — Parking Lots |
| Green P parking | Green P (Toronto Parking Authority) |
| Sewer inlets | City of Toronto Open Data — Sewer Inlets |
| Population density | Statistics Canada — Census 2021 |
| Rain gauges | Toronto and Region Conservation Authority (TRCA) |
| Flood risk areas | City of Toronto Open Data — Flood Susceptibility |
| Impermeable surfaces | Derived raster analysis (NDVI / land cover classification) |
| Elevation contours | Natural Resources Canada — CDEM |
| Land cover | City of Toronto Open Data — Land Cover |
| Boundary | City of Toronto Open Data — Municipal Boundary |

---

## CI/CD

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `frontend-ci.yml` | Push/PR to `main`/`develop` touching `frontend/**` | Build + lint the React app |
| `backend-ci.yml` | Push/PR to `main`/`develop` touching `backend/**` | Test + lint the Express API |
| `deploy.yml` | Push to `main` | SSH deploy to production server |
| `pr-checks.yml` | Pull request to `main` | Full build + test + security checks + auto-posts PR checklist |

---

## License

MIT
