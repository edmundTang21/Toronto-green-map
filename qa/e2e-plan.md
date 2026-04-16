# E2E Test Plan — Toronto Green Map

## Tool Recommendation: Playwright

Playwright is the recommended E2E framework for this project for the following reasons:

- First-class support for Chromium, Firefox, and WebKit in one runner
- Built-in network interception — useful for mocking slow tile/GeoJSON requests
- `page.waitForResponse()` and `page.waitForSelector()` handle async map rendering cleanly
- Screenshot and video capture on failure for debugging
- CLI and CI integration via `@playwright/test`

### Setup

```bash
# Install Playwright (run from project root)
npm init playwright@latest

# Or add to an existing package.json:
npm install --save-dev @playwright/test
npx playwright install chromium
```

Create `playwright.config.ts` at the project root:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './qa/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173', // Vite dev server
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

Run tests:

```bash
npx playwright test              # headless
npx playwright test --headed     # watch mode
npx playwright show-report       # open HTML report after a run
```

---

## Test Scenarios

---

### Scenario 1 — Map Loads and Renders Correctly

**Goal:** Confirm the Mapbox GL map mounts, tiles load, and the Liberty Village boundary is visible.

**Preconditions:** Backend running on port 3001; frontend dev server running on port 5173.

**Steps:**
1. Navigate to `http://localhost:5173`.
2. Wait for the map canvas element (`canvas.mapboxgl-canvas`) to be visible.
3. Wait for the network request to `/api/data/boundary` to complete with status 200.
4. Confirm the `<canvas>` has non-zero width and height.
5. Confirm the page title is "Toronto Green Map".

**Expected result:** Map canvas renders. Boundary request succeeds. No console errors of level `error`.

**Playwright snippet:**

```typescript
test('map loads and renders correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas.mapboxgl-canvas', { state: 'visible' });
  await page.waitForResponse(resp =>
    resp.url().includes('/api/data/boundary') && resp.status() === 200
  );
  const canvas = page.locator('canvas.mapboxgl-canvas');
  const box = await canvas.boundingBox();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);
  await expect(page).toHaveTitle(/Toronto Green Map/i);
});
```

---

### Scenario 2 — Layer Toggle Shows/Hides Map Layers

**Goal:** Toggling a layer checkbox in the LayerControl panel causes the corresponding GeoJSON layer to be added or removed from the map.

**Preconditions:** Map has loaded (canvas visible).

**Steps:**
1. Navigate to `/`.
2. Wait for map canvas to be visible.
3. Locate the "Parking Lots" checkbox in the layer control panel.
4. Confirm it is checked (parking layer is on by default).
5. Click the checkbox to uncheck it.
6. Confirm the Mapbox layer `parking` is no longer visible (verify via DOM: the checkbox is unchecked, or listen for a `removeLayer` event via page function injection).
7. Click the checkbox again to re-enable it.
8. Confirm the checkbox is checked again.

**Expected result:** Layer visibility toggles in sync with the checkbox state.

---

### Scenario 3 — Walk Isochrone: Place a Point, Verify Results Panel Appears

**Goal:** Clicking "Place Point", then clicking on the map, triggers an isochrone calculation and shows a results panel.

**Preconditions:** Map is loaded and idle.

**Steps:**
1. Navigate to `/`.
2. Wait for map canvas.
3. Locate the "Place Point" button in the WalkPanel.
4. Click "Place Point" — the cursor should change to crosshair mode.
5. Click somewhere on the map canvas (e.g. centre of the canvas).
6. Wait for the network response from the walking isochrone API (e.g. `/api/walk` or the Mapbox Isochrone API).
7. Wait for a results panel or isochrone polygon to appear in the DOM (e.g. an element with text matching `/\d+ min walk/i` or a filled polygon on the map).

**Expected result:** After clicking the map, the isochrone polygon renders and a panel shows the walk time result.

---

### Scenario 4 — Basemap Style Switcher Changes the Map Style

**Goal:** Selecting a different basemap style from the style switcher updates the Mapbox map style.

**Preconditions:** Map is loaded.

**Steps:**
1. Navigate to `/`.
2. Wait for map canvas.
3. Locate the basemap style switcher control (e.g. buttons labelled "Satellite", "Streets", "Dark").
4. Note the current active style label.
5. Click a different style (e.g. "Satellite").
6. Wait for a `style.load` map event (or for the canvas to re-render — check via a short pause and screenshot comparison if needed).
7. Confirm the active style label has updated in the UI.

**Expected result:** Map re-renders with the selected basemap. The previously active style button is no longer marked active.

---

### Scenario 5 — Legend Collapses and Expands

**Goal:** The Legend panel can be collapsed and re-expanded, toggling its content visibility.

**Preconditions:** Map is loaded. Legend is visible in the expanded state.

**Steps:**
1. Navigate to `/`.
2. Wait for map canvas.
3. Locate the legend toggle button (e.g. a `<button>` inside the `<Legend />` component).
4. Confirm legend content (colour swatches / labels) is visible.
5. Click the toggle button.
6. Confirm legend content is hidden (e.g. `display: none` or removed from DOM).
7. Click the toggle button again.
8. Confirm legend content is visible again.

**Expected result:** Legend content toggles correctly. No layout shift on the map canvas.

---

### Scenario 6 — Parking Stats Panel Shows Non-Zero Numbers

**Goal:** The InfoPanel shows meaningful parking statistics loaded from the backend, not placeholder zeros.

**Preconditions:** Backend is running with data files present.

**Steps:**
1. Navigate to `/`.
2. Wait for the request to `/api/data/parking` (or `/api/parking/all`) to complete.
3. Locate the InfoPanel in the DOM.
4. Read the text values for "Parking Lots" and "Est. Spaces".
5. Parse the numeric values.

**Expected result:** "Parking Lots" count is greater than 0. "Est. Spaces" count is greater than 0.

**Playwright snippet:**

```typescript
test('parking stats panel shows non-zero numbers', async ({ page }) => {
  await page.goto('/');
  await page.waitForResponse(resp =>
    resp.url().includes('/api/data/parking') && resp.status() === 200
  );
  const lotsText = await page.locator('[data-testid="stat-parking-lots"]').textContent();
  expect(Number(lotsText?.replace(/,/g, ''))).toBeGreaterThan(0);
});
```

---

### Scenario 7 — Tree Tiles Load When Zoomed Past Level 13

**Goal:** When the map is zoomed in to level 14 or above, tree tile requests are made and data appears on the map.

**Preconditions:** Map is loaded. Trees layer is enabled.

**Steps:**
1. Navigate to `/`.
2. Wait for map canvas.
3. Enable the "Trees" layer checkbox if it is off by default.
4. Programmatically zoom the map to level 14 centred on Liberty Village (`[-79.42, 43.64]`).
5. Wait for at least one network request matching `/api/tiles/trees/` to complete with status 200 or 404.
6. Confirm no request to `/api/tiles/trees/` returns status 500.

**Expected result:** Tree tile requests are made. All respond with 200 (data present) or 404 (tile legitimately absent). No 500 errors.

**Playwright snippet:**

```typescript
test('tree tiles load when zoomed past level 13', async ({ page }) => {
  const tileErrors: number[] = [];
  page.on('response', resp => {
    if (resp.url().includes('/api/tiles/trees/') && resp.status() >= 500) {
      tileErrors.push(resp.status());
    }
  });

  await page.goto('/');
  await page.waitForSelector('canvas.mapboxgl-canvas', { state: 'visible' });

  // Enable Trees layer if needed
  const treesCheckbox = page.getByLabel(/Trees/i);
  if (!(await treesCheckbox.isChecked())) {
    await treesCheckbox.click();
  }

  // Zoom the map programmatically via the Mapbox instance exposed on window
  await page.evaluate(() => {
    (window as any).map?.flyTo({ center: [-79.42, 43.64], zoom: 14 });
  });

  // Wait for any tile request
  await page.waitForResponse(
    resp => resp.url().includes('/api/tiles/trees/'),
    { timeout: 10_000 }
  ).catch(() => { /* no tiles in view is also acceptable */ });

  expect(tileErrors).toHaveLength(0);
});
```

---

## Running E2E Tests in CI (GitHub Actions)

Add `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install backend deps
        run: npm ci
        working-directory: backend

      - name: Install frontend deps
        run: npm ci
        working-directory: frontend

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Start backend
        run: node index.js &
        working-directory: backend
        env:
          PORT: 3001

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```
