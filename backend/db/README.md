# Database module — Toronto Green Map

PostgreSQL 16 + PostGIS 3.4, running inside a Docker container on the production server.

---

## Connection details

| Parameter | Value |
|-----------|-------|
| Host (server-side) | 127.0.0.1 |
| Port | 5432 |
| User | postgres |
| Database | postgres |
| Schema | green_map |

Connection string format:

```
postgresql://postgres:<password>@<host>:<port>/postgres
```

---

## Local development via SSH tunnel

The database is not exposed publicly. Open a tunnel before connecting locally:

```bash
ssh -i ~/.ssh/id_ed25519_account2 \
    -L 5433:127.0.0.1:5432 \
    -N root@167.172.139.126
```

Then connect on `localhost:5433`:

```bash
psql -h localhost -p 5433 -U postgres -d postgres
```

Or set environment variables for the app:

```bash
export DB_HOST=localhost
export DB_PORT=5433
export DB_PASSWORD=<secret>
node index.js
```

---

## Running the schema migration

The schema DDL is idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
Apply it at any time without data loss:

```bash
psql -h localhost -p 5433 -U postgres -d postgres -f backend/db/schema.sql
```

The importer also applies the schema automatically before inserting rows.

---

## Running the data import

```bash
# From the project root
DB_HOST=localhost DB_PORT=5433 DB_PASSWORD=<secret> node backend/db/import.js
```

Each dataset is truncated (`TRUNCATE … RESTART IDENTITY`) before insertion, so
the script is safe to re-run. Trees are **not** imported — they are served from
pre-built vector tile files in `tiles/trees_tiles/`.

---

## Table reference

| Table | Source file | Geometry | Key columns |
|-------|-------------|----------|-------------|
| `green_map.boundary` | `data/liberty_village.geojson` | Polygon | name |
| `green_map.parking_lots` | `data/parking/parking_lots_simplified.geojson` | Polygon | estimated_spaces, area_m2 |
| `green_map.greenp` | `data/green/greenp_all.geojson` | Point | address, carpark_type_str, capacity, rate_half_hour |
| `green_map.population` | `data/population.geojson` | MultiPolygon | area_name, population, pop_density |
| `green_map.rain_gauges` | `data/rain_gauges.geojson` | Point | name, location, volume, return_period |
| `green_map.impermeable_surface` | `data/impermeable/impermeable.geojson` | MultiPolygon | type ('impermeable'/'permeable') |
| `green_map.contours` | `data/contours/contours.geojson` | LineString | elevation |
| `green_map.flood_reports` | `data/flood/flood_reporting.geojson` | MultiPolygon | area_name, total_floods, y2013–y2017 |
| `green_map.green_streets` | `data/green/green_streets.geojson` | Point | common_name, project_type, infrastructure_type, description |
| `green_map.green_spaces` | `data/green/green_spaces.geojson` | MultiPolygon | area_name, area_class |
| `green_map.land_cover` | `data/land_cover.geojson` | MultiPolygon | description |
| `green_map.sewer_inlets` | `data/sewer/sewer_inlets.geojson` | Point | asset_id, install_date |
| `green_map.trees` | *(tile files only — not imported)* | Point | common_name, botanical_name, dbh, address |

All tables carry a GIST spatial index on `geom`.

---

## Module files

| File | Purpose |
|------|---------|
| `schema.sql` | DDL — creates schema, tables, spatial indexes |
| `import.js` | Reads local GeoJSON files and populates all tables |
| `index.js` | `pg.Pool` singleton — exports `{ pool, query }` |
| `queries.js` | Per-layer helper functions returning GeoJSON FeatureCollections |
