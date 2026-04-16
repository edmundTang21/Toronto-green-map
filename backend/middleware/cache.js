'use strict';

const store = new Map();

/**
 * Get a cached value by key. Returns undefined if not present.
 */
function get(key) {
  return store.get(key);
}

/**
 * Store a value under key.
 */
function set(key, value) {
  store.set(key, value);
}

/**
 * Check whether a key exists in the cache.
 */
function has(key) {
  return store.has(key);
}

/**
 * Remove a single entry from the cache.
 */
function invalidate(key) {
  store.delete(key);
}

/**
 * Flush the entire cache.
 */
function flush() {
  store.clear();
}

/**
 * Return the number of cached entries.
 */
function size() {
  return store.size;
}

module.exports = { get, set, has, invalidate, flush, size };
