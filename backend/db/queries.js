'use strict';

/**
 * Toronto Green Map — reusable PostGIS query helpers.
 *
 * Every public function returns a GeoJSON FeatureCollection object (plain JS),
 * ready to be sent directly to the client.
 *
 * All geometry is stored in SRID 4326 and returned as-is; no reprojection.
 */

const { query } = require('./index');

// ---------------------------------------------------------------------------
// Layer name → fully-qualified table name
// ---------------------------------------------------------------------------

const LAYER_TABLE_MAP = {
  boundary:            'green_map.boundary',
  parking:             'green_map.parking_lots',
  greenp:              'green_map.greenp',
  population:          'green_map.population',
  rain_gauges:         'green_map.rain_gauges',
  impermeable_surface: 'green_map.impermeable_surface',
  contours:            'green_map.contours',
  flood_reports:       'green_map.flood_reports',
  green_streets:       'green_map.green_streets',
  green_spaces:        'green_map.green_spaces',
  land_cover:          'green_map.land_cover',
  sewer_inlets:        'green_map.sewer_inlets',
  trees:               'green_map.trees',
};

// ---------------------------------------------------------------------------
// Generic layer query
// ---------------------------------------------------------------------------

// Average area (m²) taken up by one parked vehicle, including drive aisle
// share — used to estimate space counts for lots that have no capacity data.
// 325 sq ft (midpoint of the typical 300–350 sq ft/space range) = 30.19 m².
const AVG_PARKING_SPACE_M2 = 30.19;

// Some source polygons are degenerate slivers (near-collinear points forming
// needle-thin triangles/spikes) left over from an upstream simplify/dissolve
// step — not real lots, but they render as sharp spikes shooting off the map.
// Filtered out by a minimum area and a perimeter²/area compactness check
// (circle = ~12.6, square = 16; real elongated lots rarely exceed ~100).
const PARKING_GEOM_FILTER = `
  ST_Area(geom::geography) >= 15
  AND (ST_Perimeter(geom::geography) ^ 2 / NULLIF(ST_Area(geom::geography), 0)) <= 150
`;

// Some layers need a computed column instead of the raw stored value — e.g.
// parking_lots.estimated_spaces/area_m2 are always NULL (not present in the
// source dataset), but area can be derived from the lot's own polygon
// geometry, and spaces can then be estimated from that area.
const LAYER_SQL_OVERRIDES = {
  parking: `
    SELECT id,
           GREATEST(ROUND(ST_Area(geom::geography) / ${AVG_PARKING_SPACE_M2}), 1) AS estimated_spaces,
           ST_Area(geom::geography) AS area_m2,
           geom
    FROM green_map.parking_lots
    WHERE ${PARKING_GEOM_FILTER}
  `,
};

/**
 * Return all features for a named layer as a GeoJSON FeatureCollection.
 *
 * @param {string} layerName  One of the keys in LAYER_TABLE_MAP.
 * @returns {Promise<{type: 'FeatureCollection', features: object[]}>}
 */
async function getLayer(layerName) {
  const table = LAYER_TABLE_MAP[layerName];
  if (!table) {
    throw new Error(`Unknown layer: "${layerName}". Valid layers: ${Object.keys(LAYER_TABLE_MAP).join(', ')}`);
  }

  const from = LAYER_SQL_OVERRIDES[layerName] ? `(${LAYER_SQL_OVERRIDES[layerName]}) t` : `${table} t`;

  const sql = `
    SELECT json_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)
    ) AS geojson
    FROM ${from}
  `;

  const result = await query(sql);
  return result.rows[0].geojson;
}

// ---------------------------------------------------------------------------
// Specialised queries with optional spatial filtering
// ---------------------------------------------------------------------------

/**
 * Return all GreenP facilities, optionally limited to those within a bounding
 * box expressed as [minLng, minLat, maxLng, maxLat].
 *
 * @param {[number,number,number,number]|null} bbox
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
async function getGreenP(bbox) {
  if (!bbox) return getLayer('greenp');

  const [minLng, minLat, maxLng, maxLat] = bbox;
  const sql = `
    SELECT json_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)
    ) AS geojson
    FROM green_map.greenp t
    WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
  `;
  const result = await query(sql, [minLng, minLat, maxLng, maxLat]);
  return result.rows[0].geojson;
}

/**
 * Return parking lots, optionally filtered by bbox.
 *
 * @param {[number,number,number,number]|null} bbox
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
async function getParkingLots(bbox) {
  if (!bbox) return getLayer('parking');

  const [minLng, minLat, maxLng, maxLat] = bbox;
  const sql = `
    SELECT json_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)
    ) AS geojson
    FROM (
      SELECT id,
             GREATEST(ROUND(ST_Area(geom::geography) / ${AVG_PARKING_SPACE_M2}), 1) AS estimated_spaces,
             ST_Area(geom::geography) AS area_m2,
             geom
      FROM green_map.parking_lots
      WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        AND ${PARKING_GEOM_FILTER}
    ) t
  `;
  const result = await query(sql, [minLng, minLat, maxLng, maxLat]);
  return result.rows[0].geojson;
}

/**
 * Return flood report polygons for a specific year or all years.
 *
 * @param {number|null} year  Optional year filter (2013–2017).
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
async function getFloodReports(year) {
  if (!year) return getLayer('flood_reports');

  const colMap = { 2013: 'y2013', 2014: 'y2014', 2015: 'y2015', 2016: 'y2016', 2017: 'y2017' };
  const col = colMap[year];
  if (!col) throw new Error(`Year must be one of: ${Object.keys(colMap).join(', ')}`);

  const sql = `
    SELECT json_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)
    ) AS geojson
    FROM green_map.flood_reports t
    WHERE ${col} IS NOT NULL AND ${col} > 0
  `;
  const result = await query(sql);
  return result.rows[0].geojson;
}

/**
 * Return contour lines within an optional elevation range.
 *
 * @param {number|null} minElevation
 * @param {number|null} maxElevation
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
async function getContours(minElevation, maxElevation) {
  if (minElevation == null && maxElevation == null) return getLayer('contours');

  const params = [];
  const conditions = [];

  if (minElevation != null) {
    params.push(minElevation);
    conditions.push(`elevation >= $${params.length}`);
  }
  if (maxElevation != null) {
    params.push(maxElevation);
    conditions.push(`elevation <= $${params.length}`);
  }

  const sql = `
    SELECT json_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)
    ) AS geojson
    FROM green_map.contours t
    WHERE ${conditions.join(' AND ')}
  `;
  const result = await query(sql, params);
  return result.rows[0].geojson;
}

/**
 * Return population polygons with an optional minimum population filter.
 *
 * @param {number|null} minPopulation
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
async function getPopulation(minPopulation) {
  if (!minPopulation) return getLayer('population');

  const sql = `
    SELECT json_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)
    ) AS geojson
    FROM green_map.population t
    WHERE population >= $1
  `;
  const result = await query(sql, [minPopulation]);
  return result.rows[0].geojson;
}

/**
 * Return green spaces, optionally filtered by area class.
 *
 * @param {string|null} areaClass  e.g. 'PARK', 'NATURAL_AREA'
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
async function getGreenSpaces(areaClass) {
  if (!areaClass) return getLayer('green_spaces');

  const sql = `
    SELECT json_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)
    ) AS geojson
    FROM green_map.green_spaces t
    WHERE area_class = $1
  `;
  const result = await query(sql, [areaClass]);
  return result.rows[0].geojson;
}

/**
 * Return FSI classification raster as vectorised GeoJSON polygons.
 * Uses ST_DumpAsPolygons to convert the raster to vector features.
 * Each feature has a `val` property containing the class value (1–5).
 *
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
async function getFsiClass() {
  const sql = `
    SELECT json_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(json_agg(
        json_build_object(
          'type',       'Feature',
          'geometry',   ST_AsGeoJSON(geom)::json,
          'properties', json_build_object('val', val)
        )
      ), '[]'::json)
    ) AS geojson
    FROM (
      SELECT (ST_DumpAsPolygons(rast)).geom,
             (ST_DumpAsPolygons(rast)).val
      FROM green_map.fsi_class
    ) t
  `;
  const result = await query(sql);
  return result.rows[0].geojson;
}

/**
 * Return FSI index raster as vectorised GeoJSON polygons.
 * Uses ST_DumpAsPolygons to convert the raster to vector features.
 * Each feature has a `val` property containing the continuous index value.
 *
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
async function getFsiIndex() {
  const sql = `
    SELECT json_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(json_agg(
        json_build_object(
          'type',       'Feature',
          'geometry',   ST_AsGeoJSON(geom)::json,
          'properties', json_build_object('val', val)
        )
      ), '[]'::json)
    ) AS geojson
    FROM (
      SELECT (ST_DumpAsPolygons(rast)).geom,
             (ST_DumpAsPolygons(rast)).val
      FROM green_map.fsi_index
    ) t
  `;
  const result = await query(sql);
  return result.rows[0].geojson;
}

/**
 * Return sewer inlets, optionally filtered by bbox.
 *
 * @param {[number,number,number,number]|null} bbox
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
async function getSewerInlets(bbox) {
  if (!bbox) return getLayer('sewer_inlets');

  const [minLng, minLat, maxLng, maxLat] = bbox;
  const sql = `
    SELECT json_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(json_agg(ST_AsGeoJSON(t.*)::json), '[]'::json)
    ) AS geojson
    FROM green_map.sewer_inlets t
    WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
  `;
  const result = await query(sql, [minLng, minLat, maxLng, maxLat]);
  return result.rows[0].geojson;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Generic — works for any layer
  getLayer,

  // Specialised with optional filters
  getGreenP,
  getParkingLots,
  getFloodReports,
  getContours,
  getPopulation,
  getGreenSpaces,
  getSewerInlets,

  // FSI raster layers (vectorised via ST_DumpAsPolygons)
  getFsiClass,
  getFsiIndex,

  // Convenience re-exports of simple single-table queries
  getBoundary:           () => getLayer('boundary'),
  getRainGauges:         () => getLayer('rain_gauges'),
  getImpermeableSurface: () => getLayer('impermeable_surface'),
  getGreenStreets:       () => getLayer('green_streets'),
  getLandCover:          () => getLayer('land_cover'),
  getTrees:              () => getLayer('trees'),
};
