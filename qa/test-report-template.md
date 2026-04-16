# Test Report — Toronto Green Map

**PR #:** <!-- e.g. #42 -->
**Branch:** <!-- e.g. feature/layer-control -->
**Author:** <!-- GitHub handle -->
**Reviewer:** <!-- GitHub handle -->
**Date:** <!-- YYYY-MM-DD -->
**Commit SHA:** <!-- short SHA -->

---

## Summary

| Suite | Total | Passed | Failed | Skipped | Coverage |
|-------|-------|--------|--------|---------|----------|
| Backend (Jest) | — | — | — | — | —% |
| Frontend (Vitest) | — | — | — | — | —% |
| E2E Manual | — | — | — | — | N/A |
| **Total** | — | — | — | — | —% |

**Overall result:** PASS / FAIL / BLOCKED

**Blockers for merge:** <!-- "None" or list them -->

---

## Backend Tests (`backend/tests/`)

**Run command:** `npm test` (inside `backend/`)
**Framework:** Jest + Supertest
**Test file:** `backend/tests/api.test.js`

### Results

| Test | Result | Notes |
|------|--------|-------|
| GET /health returns 200 | | |
| GET /health body has status: ok | | |
| GET /health content-type is JSON | | |
| GET /api/data/boundary — 200 GeoJSON | | |
| GET /api/data/parking — 200 GeoJSON | | |
| GET /api/data/greenp — 200 GeoJSON | | |
| GET /api/data/population — 200 GeoJSON | | |
| GET /api/data/rain — 200 GeoJSON | | |
| GET /api/data/impermeable — 200 GeoJSON | | |
| GET /api/data/contours — 200 GeoJSON | | |
| GET /api/data/flood — 200 GeoJSON | | |
| GET /api/data/greenstreets — 200 GeoJSON | | |
| GET /api/data/greenspaces — 200 GeoJSON | | |
| GET /api/data/landcover — 200 GeoJSON | | |
| GET /api/data/sewer — 200 GeoJSON | | |
| GET /api/data/unknownlayer — 404 | | |
| Path traversal attempts — all rejected | | |
| GET /api/tiles/trees/-7913_4378 — 200 or 404 | | |
| GET /api/tiles/trees/badkey!! — 404 | | |
| GET /api/parking/all — GeoJSON | | |
| GET /api/green/all — GeoJSON | | |
| Cache-Control headers set on 200 responses | | |

**Coverage:**

```
File              | Stmts | Branch | Funcs | Lines
------------------|-------|--------|-------|------
index.js          |    %  |     %  |    %  |    %
routes/data.js    |    %  |     %  |    %  |    %
routes/tiles.js   |    %  |     %  |    %  |    %
middleware/cache.js |   %  |     %  |    %  |    %
```

**Notes / Failures:**

<!-- Paste any failing test output here -->

---

## Frontend Tests (`frontend/src/__tests__/`)

**Run command:** `npm test` (inside `frontend/`)
**Framework:** Vitest + React Testing Library
**Environment:** jsdom (mapbox-gl mocked in `src/test-setup.js`)

### Results

| Component | Test | Result | Notes |
|-----------|------|--------|-------|
| Header | Renders without crashing | | |
| Header | Contains "Toronto" text | | |
| Header | Contains "Green Map" text | | |
| Header | Renders header landmark | | |
| Footer | Renders without crashing | | |
| Footer | Has link to open.toronto.ca | | |
| Footer | Link text includes "Toronto Open Data" | | |
| LayerControl | Renders without crashing | | |
| LayerControl | Renders checkbox per layer | | |
| LayerControl | Toggling "Parking Lots" fires onToggle | | |
| LayerControl | Toggling "Trees" fires onToggle with id "trees" | | |
| LayerControl | Visible layers are checked | | |
| LayerControl | Non-visible layers are unchecked | | |
| WalkPanel | Renders without crashing | | |
| WalkPanel | "Place Point" button present | | |
| WalkPanel | Walk time number input present | | |
| WalkPanel | Default walk time is 5 | | |
| WalkPanel | Clicking "Place Point" fires onPlacePoint | | |
| WalkPanel | Changing walk time fires onWalkTimeChange | | |
| InfoPanel | Renders without crashing | | |
| InfoPanel | Renders "Parking Lots" row | | |
| InfoPanel | Renders "Est. Spaces" row | | |
| InfoPanel | Renders "Green P" row | | |
| InfoPanel | Renders "Green P Spaces" row | | |
| InfoPanel | All 4 stat rows present | | |
| InfoPanel | Renders with zero stats | | |
| InfoPanel | Renders with undefined stats | | |

**Notes / Failures:**

<!-- Paste any failing test output here -->

---

## E2E Manual Tests

**Tool:** Playwright (automated) / Manual browser (where noted)
**Environment tested:** <!-- e.g. Chrome 124, macOS 14 -->
**Frontend URL:** <!-- e.g. http://localhost:5173 -->
**Backend URL:** <!-- e.g. http://localhost:3001 -->

| # | Scenario | Steps Followed | Result | Evidence (screenshot/video) |
|---|----------|----------------|--------|-----------------------------|
| 1 | Map loads and renders correctly | See e2e-plan.md §1 | | |
| 2 | Layer toggle shows/hides map layers | See e2e-plan.md §2 | | |
| 3 | Walk isochrone — place point, results panel appears | See e2e-plan.md §3 | | |
| 4 | Basemap style switcher changes map style | See e2e-plan.md §4 | | |
| 5 | Legend collapses and expands | See e2e-plan.md §5 | | |
| 6 | Parking stats panel shows non-zero numbers | See e2e-plan.md §6 | | |
| 7 | Tree tiles load when zoomed past level 13 | See e2e-plan.md §7 | | |

**Notes / Failures:**

<!-- Describe any scenario that did not pass, including steps to reproduce -->

---

## Issues Found

<!-- One row per issue. Copy rows as needed. -->

| # | Severity | Component | Description | Linked Issue / PR |
|---|----------|-----------|-------------|-------------------|
| 1 | — | — | — | — |

**Severity scale:**
- **P0 — Blocker:** Prevents merge. Data loss, security vulnerability, or complete feature failure.
- **P1 — Critical:** Major feature broken; workaround exists but is unacceptable in production.
- **P2 — Major:** Feature partially broken; workaround available.
- **P3 — Minor:** Cosmetic or edge-case issue; does not block merge.

---

## Sign-Off

| Role | Name | Date | Decision |
|------|------|------|----------|
| QA Engineer | | | Approve / Request changes |
| Engineering Manager | | | Approve / Request changes |

**Merge decision:** APPROVED / BLOCKED

**Conditions for merge (if blocked):**

<!-- List required fixes before this PR can be merged -->
