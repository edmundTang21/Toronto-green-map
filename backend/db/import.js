/**
 * Toronto Green Map — GeoJSON → PostGIS importer
 *
 * Usage:
 *   DB_PASSWORD=<secret> node backend/db/import.js
 *
 * Reads GeoJSON files relative to the project root (one level above backend/).
 * Each dataset is truncated (RESTART IDENTITY) then re-inserted, making the
 * script fully idempotent.
 *
 * Trees are NOT imported here — they are served from pre-built tile files.
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs   = require('fs');
const path = require('path');
const { pool } = require('./index');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a path relative to the project root (parent of backend/). */
const DATA_ROOT = path.join(__dirname, '..', '..', 'data');

function dataPath(...parts) {
  return path.join(DATA_ROOT, ...parts);
}

/** Read and parse a GeoJSON file. Returns the FeatureCollection object. */
function readGeoJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

/** Null-safe integer parse. */
function toInt(val) {
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? null : n;
}

/** Null-safe float parse. */
function toFloat(val) {
  const n = parseFloat(val);
  return Number.isNaN(n) ? null : n;
}

/** Return null if val is undefined / empty string. */
function str(val) {
  if (val === undefined || val === null || val === '') return null;
  return String(val);
}

/**
 * Bulk-insert features into a table.
 *
 * @param {import('pg').PoolClient} client
 * @param {string}   table     Fully-qualified table name, e.g. 'green_map.greenp'
 * @param {string[]} columns   Non-geometry column names in the same order as rowMapper output
 * @param {object[]} features  GeoJSON features array
 * @param {Function} rowMapper (properties) => array of values matching `columns`
 */
async function bulkInsert(client, table, columns, features, rowMapper) {
  let inserted = 0;
  for (const feature of features) {
    if (!feature.geometry) continue;
    const props  = feature.properties || {};
    const values = rowMapper(props);
    const geomJson = JSON.stringify(feature.geometry);

    // Build positional placeholders: $1 … $N for data cols, last one for geom
    const placeholders = columns
      .map((_, i) => `$${i + 1}`)
      .concat(`ST_SetSRID(ST_GeomFromGeoJSON($${columns.length + 1}), 4326)`)
      .join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}, geom)
                 VALUES (${placeholders})`;

    await client.query(sql, [...values, geomJson]);
    inserted++;
  }
  return inserted;
}

/** Truncate a table and restart its identity sequence. */
async function truncate(client, table) {
  await client.query(`TRUNCATE ${table} RESTART IDENTITY CASCADE`);
}

// ---------------------------------------------------------------------------
// Per-dataset importers
// ---------------------------------------------------------------------------

async function importBoundary(client) {
  const fc = readGeoJSON(dataPath('liberty_village.geojson'));
  await truncate(client, 'green_map.boundary');
  const n = await bulkInsert(
    client,
    'green_map.boundary',
    ['name'],
    fc.features,
    (p) => [str(p.name)],
  );
  console.log(`  boundary: ${n} rows`);
}

async function importParkingLots(client) {
  const fc = readGeoJSON(dataPath('parking', 'parking_lots_simplified.geojson'));
  await truncate(client, 'green_map.parking_lots');
  // Source properties: id, desc  (no estimated_spaces or area_m2 in source data)
  const n = await bulkInsert(
    client,
    'green_map.parking_lots',
    ['estimated_spaces', 'area_m2'],
    fc.features,
    (p) => [
      toInt(p.estimated_spaces),   // null if absent — field not in source
      toFloat(p.area_m2),          // null if absent — field not in source
    ],
  );
  console.log(`  parking_lots: ${n} rows`);
}

async function importGreenP(client) {
  // Use the full city dataset; liberty subset is a subset of the same data.
  const fc = readGeoJSON(dataPath('green', 'greenp_all.geojson'));
  await truncate(client, 'green_map.greenp');
  const n = await bulkInsert(
    client,
    'green_map.greenp',
    ['address', 'carpark_type_str', 'capacity', 'rate_half_hour'],
    fc.features,
    (p) => [
      str(p.address),
      str(p.carpark_type_str),
      toInt(p.capacity),
      str(p.rate_half_hour),
    ],
  );
  console.log(`  greenp: ${n} rows`);
}

async function importPopulation(client) {
  const fc = readGeoJSON(dataPath('population.geojson'));
  await truncate(client, 'green_map.population');
  const n = await bulkInsert(
    client,
    'green_map.population',
    ['area_name', 'population', 'pop_density'],
    fc.features,
    (p) => [
      str(p.AREA_NAME),
      toInt(p.population),
      toFloat(p.pop_density),
    ],
  );
  console.log(`  population: ${n} rows`);
}

async function importRainGauges(client) {
  const fc = readGeoJSON(dataPath('rain_gauges.geojson'));
  await truncate(client, 'green_map.rain_gauges');
  const n = await bulkInsert(
    client,
    'green_map.rain_gauges',
    ['name', 'location', 'volume', 'return_period'],
    fc.features,
    (p) => [
      str(p.NAME),
      str(p.LOCATION),
      toFloat(p.Volume),
      str(p.Return),
    ],
  );
  console.log(`  rain_gauges: ${n} rows`);
}

async function importImpermeableSurface(client) {
  const fc = readGeoJSON(dataPath('impermeable', 'impermeable.geojson'));
  await truncate(client, 'green_map.impermeable_surface');
  const n = await bulkInsert(
    client,
    'green_map.impermeable_surface',
    ['type'],
    fc.features,
    (p) => [str(p.type)],
  );
  console.log(`  impermeable_surface: ${n} rows`);
}

async function importContours(client) {
  const fc = readGeoJSON(dataPath('contours', 'contours.geojson'));
  await truncate(client, 'green_map.contours');
  const n = await bulkInsert(
    client,
    'green_map.contours',
    ['elevation'],
    fc.features,
    (p) => [toFloat(p.CONTOUR)],
  );
  console.log(`  contours: ${n} rows`);
}

async function importFloodReports(client) {
  const fc = readGeoJSON(dataPath('flood', 'flood_reporting.geojson'));
  await truncate(client, 'green_map.flood_reports');
  const n = await bulkInsert(
    client,
    'green_map.flood_reports',
    ['area_name', 'total_floods', 'y2013', 'y2014', 'y2015', 'y2016', 'y2017'],
    fc.features,
    (p) => [
      str(p.AREA_NAME),
      toInt(p.total_floods),
      toInt(p['2013']),
      toInt(p['2014']),
      toInt(p['2015']),
      toInt(p['2016']),
      toInt(p['2017']),
    ],
  );
  console.log(`  flood_reports: ${n} rows`);
}

async function importGreenStreets(client) {
  const fc = readGeoJSON(dataPath('green', 'green_streets.geojson'));
  await truncate(client, 'green_map.green_streets');
  const n = await bulkInsert(
    client,
    'green_map.green_streets',
    ['common_name', 'project_type', 'infrastructure_type', 'description'],
    fc.features,
    (p) => [
      str(p['Common Name']),
      str(p['Project Type']),
      str(p['Green Infrastructure Type']),
      str(p['Description']),
    ],
  );
  console.log(`  green_streets: ${n} rows`);
}

async function importGreenSpaces(client) {
  const fc = readGeoJSON(dataPath('green', 'green_spaces.geojson'));
  await truncate(client, 'green_map.green_spaces');
  const n = await bulkInsert(
    client,
    'green_map.green_spaces',
    ['area_name', 'area_class'],
    fc.features,
    (p) => [
      str(p.AREA_NAME),
      str(p.AREA_CLASS),
    ],
  );
  console.log(`  green_spaces: ${n} rows`);
}

async function importLandCover(client) {
  const fc = readGeoJSON(dataPath('land_cover.geojson'));
  await truncate(client, 'green_map.land_cover');
  const n = await bulkInsert(
    client,
    'green_map.land_cover',
    ['description'],
    fc.features,
    (p) => [str(p.Desc)],
  );
  console.log(`  land_cover: ${n} rows`);
}

async function importSewerInlets(client) {
  const fc = readGeoJSON(dataPath('sewer', 'sewer_inlets.geojson'));
  await truncate(client, 'green_map.sewer_inlets');
  const n = await bulkInsert(
    client,
    'green_map.sewer_inlets',
    ['asset_id', 'install_date'],
    fc.features,
    (p) => [
      str(p['Asset Identification']),
      str(p['Sewer Inlet Install Date']) || null,
    ],
  );
  console.log(`  sewer_inlets: ${n} rows`);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main() {
  const client = await pool.connect();
  try {
    console.log('Starting import…');

    // Apply schema before importing (idempotent IF NOT EXISTS DDL)
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('Schema applied.');

    await importBoundary(client);
    await importParkingLots(client);
    await importGreenP(client);
    await importPopulation(client);
    await importRainGauges(client);
    await importImpermeableSurface(client);
    await importContours(client);
    await importFloodReports(client);
    await importGreenStreets(client);
    await importGreenSpaces(client);
    await importLandCover(client);
    await importSewerInlets(client);

    console.log('Import complete.');
  } catch (err) {
    console.error('Import failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
