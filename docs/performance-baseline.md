# Performance Baseline — Urban3D Navigator (Bolzano)

> Dataset: 5,794 buildings · 14,256 roads · Bolzano, Italy  
> Renderer: deck.gl 9 / luma.gl 4 / WebGL2 · Basemap: MapLibre GL (OpenFreeMap liberty)

---

## How to Measure

Enable the **Stats overlay** checkbox in the Controls panel (top-left).  
The dark overlay (top-right) shows a 60-frame rolling average of:

| Field | Description |
|-------|-------------|
| FPS | Frames rendered per second (target ≥ 30) |
| Frame | Average frame time in milliseconds (target ≤ 33 ms) |
| Buildings | Total buildings in dataset |
| Roads | Total roads in dataset |

For deeper profiling: Chrome DevTools → **Performance** tab → record a 5-second orbit.

---

## Optimization Checklist

| Item | Status | Notes |
|------|--------|-------|
| `updateTriggers` set on building layer | ✅ | `getFillColor` keyed on `colourMode + HEIGHT_COLOR_SCALE`; `data` keyed on `heightRange` |
| Stable layer IDs | ✅ | All IDs defined in `LAYER_IDS` constant — deck.gl reuses cached buffers |
| `pickable: false` on road layer | ✅ Fixed in PR #69 | 14,256 line features removed from GPU pick buffer |
| Landmark layer off pick buffer | ✅ | `TextLayer` is not pickable |
| React StrictMode disabled | ✅ | Removed (PR #66) — StrictMode double-invoke crashed deck.gl WebGL device |
| JS-side height filter fast-path | ✅ | `filterByHeight()` returns input object unchanged when range is `[0, 300]` |
| `pickable: false` on wireframe layer | ✅ | Wireframe layer has `pickable: false` |

---

## Baseline Results

_Measured on dev machine — record your own results below._

| Scenario | Browser | FPS | Frame (ms) | Notes |
|----------|---------|-----|-----------|-------|
| Static view, height mode | Chrome | | | |
| Static view, type mode | Chrome | | | |
| Pan (drag) | Chrome | | | |
| Orbit (drag-rotate) | Chrome | | | |
| Fly-to animation | Chrome | | | |
| Static view | Firefox | | | |
| Static view | Safari | | | |

### Memory (Chrome DevTools → Memory → Take Heap Snapshot)

| Snapshot | JS Heap |
|----------|---------|
| On load (before data) | — MB |
| After buildings + roads loaded | — MB |
| After 360° orbit | — MB |

---

## Known Bottlenecks & Future Optimisations

| Issue | Priority | Approach |
|-------|----------|---------|
| 5,794 buildings JS-side pre-filter on each height-range change | Low | Use deck.gl `DataFilterExtension` for GPU-side filtering |
| Building GeoJSON loaded as single 1.96 MB file | Low | Switch to MVT tiles for large cities |
| `TextLayer` font atlas re-built on style change | Low | Pre-warm atlas on load |
| Road picking disabled (loss of road tooltips) | Low | Re-enable selectively with `DataFilterExtension` |
