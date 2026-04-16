-- Toronto Green Map — PostGIS schema
-- Run once against the target database to bootstrap all tables and indexes.
-- Safe to re-run: uses IF NOT EXISTS throughout.

CREATE SCHEMA IF NOT EXISTS green_map;

-- ---------------------------------------------------------------------------
-- Boundary (liberty_village.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.boundary (
  id   SERIAL PRIMARY KEY,
  name TEXT,
  geom GEOMETRY(POLYGON, 4326)
);

-- ---------------------------------------------------------------------------
-- Parking lots (parking/parking_lots_simplified.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.parking_lots (
  id               SERIAL PRIMARY KEY,
  estimated_spaces INT,
  area_m2          FLOAT,
  geom             GEOMETRY(POLYGON, 4326)
);

-- ---------------------------------------------------------------------------
-- GreenP parking garages (green/greenp_all.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.greenp (
  id               SERIAL PRIMARY KEY,
  address          TEXT,
  carpark_type_str TEXT,
  capacity         INT,
  rate_half_hour   TEXT,
  geom             GEOMETRY(POINT, 4326)
);

-- ---------------------------------------------------------------------------
-- Population (population.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.population (
  id          SERIAL PRIMARY KEY,
  area_name   TEXT,
  population  INT,
  pop_density FLOAT,
  geom        GEOMETRY(MULTIPOLYGON, 4326)
);

-- ---------------------------------------------------------------------------
-- Rain gauges (rain_gauges.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.rain_gauges (
  id            SERIAL PRIMARY KEY,
  name          TEXT,
  location      TEXT,
  volume        FLOAT,
  return_period TEXT,
  geom          GEOMETRY(POINT, 4326)
);

-- ---------------------------------------------------------------------------
-- Impermeable / permeable surface (impermeable/impermeable.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.impermeable_surface (
  id   SERIAL PRIMARY KEY,
  type TEXT CHECK (type IN ('impermeable', 'permeable')),
  geom GEOMETRY(MULTIPOLYGON, 4326)
);

-- ---------------------------------------------------------------------------
-- Contour lines (contours/contours.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.contours (
  id        SERIAL PRIMARY KEY,
  elevation FLOAT,
  geom      GEOMETRY(LINESTRING, 4326)
);

-- ---------------------------------------------------------------------------
-- Flood reports (flood/flood_reporting.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.flood_reports (
  id           SERIAL PRIMARY KEY,
  area_name    TEXT,
  total_floods INT,
  y2013        INT,
  y2014        INT,
  y2015        INT,
  y2016        INT,
  y2017        INT,
  geom         GEOMETRY(MULTIPOLYGON, 4326)
);

-- ---------------------------------------------------------------------------
-- Green streets (green/green_streets.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.green_streets (
  id                  SERIAL PRIMARY KEY,
  common_name         TEXT,
  project_type        TEXT,
  infrastructure_type TEXT,
  description         TEXT,
  geom                GEOMETRY(POINT, 4326)
);

-- ---------------------------------------------------------------------------
-- Green spaces (green/green_spaces.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.green_spaces (
  id         SERIAL PRIMARY KEY,
  area_name  TEXT,
  area_class TEXT,
  geom       GEOMETRY(MULTIPOLYGON, 4326)
);

-- ---------------------------------------------------------------------------
-- Land cover (land_cover.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.land_cover (
  id          SERIAL PRIMARY KEY,
  description TEXT,
  geom        GEOMETRY(MULTIPOLYGON, 4326)
);

-- ---------------------------------------------------------------------------
-- Sewer inlets (sewer/sewer_inlets.geojson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.sewer_inlets (
  id           SERIAL PRIMARY KEY,
  asset_id     TEXT,
  install_date DATE,
  geom         GEOMETRY(POINT, 4326)
);

-- ---------------------------------------------------------------------------
-- Trees — schema only; data served from tile files, not imported here
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_map.trees (
  id            SERIAL PRIMARY KEY,
  common_name   TEXT,
  botanical_name TEXT,
  dbh           FLOAT,
  address       TEXT,
  geom          GEOMETRY(POINT, 4326)
);

-- ---------------------------------------------------------------------------
-- Spatial indexes (GIST) on all geometry columns
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_boundary_geom
  ON green_map.boundary USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_parking_lots_geom
  ON green_map.parking_lots USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_greenp_geom
  ON green_map.greenp USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_population_geom
  ON green_map.population USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_rain_gauges_geom
  ON green_map.rain_gauges USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_impermeable_surface_geom
  ON green_map.impermeable_surface USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_contours_geom
  ON green_map.contours USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_flood_reports_geom
  ON green_map.flood_reports USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_green_streets_geom
  ON green_map.green_streets USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_green_spaces_geom
  ON green_map.green_spaces USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_land_cover_geom
  ON green_map.land_cover USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_sewer_inlets_geom
  ON green_map.sewer_inlets USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_trees_geom
  ON green_map.trees USING GIST(geom);
