# Technical Architecture & Stack

## Architecture Overview

### System Architecture Pattern
**Client-Heavy, Data-Light**
- Frontend handles all rendering and interaction
- Backend serves pre-processed static GeoJSON/Parquet tiles
- No real-time server-side computation (Phase 1-2)

```
┌─────────────────────────────────────────────────────────┐
│                     User Browser                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React App + deck.gl Visualization Engine        │  │
│  │  - Camera Controls                               │  │
│  │  - Layer Management                              │  │
│  │  - User Interaction Handlers                     │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓ ↑                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Data Layer (IndexedDB cache)                    │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTPS
                           ↓
┌─────────────────────────────────────────────────────────┐
│               Static File Server / CDN                   │
│  - Pre-processed GeoJSON tiles (buildings, roads)       │
│  - Metadata JSON (bounding boxes, data availability)    │
│  - No computation, just file serving                    │
└─────────────────────────────────────────────────────────┘
                           ↑
                           │ Nightly batch process
┌─────────────────────────────────────────────────────────┐
│              ETL Pipeline (Python)                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │  1. Fetch: OSM/Overture API                       │ │
│  │  2. Transform: Height fallback, geom cleaning     │ │
│  │  3. Tile: Generate spatial tiles (GeoJSON)        │ │
│  │  4. Deploy: Upload to CDN/static storage          │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend Stack

| Layer | Technology | Why | Alternatives Considered |
|-------|-----------|-----|------------------------|
| **UI Framework** | React 18 + TypeScript | Industry standard, deck.gl native support, type safety | Vue.js (less deck.gl integration) |
| **Build Tool** | Vite | Fast HMR, modern ESM support | Create React App (slower), Next.js (overkill for Phase 1) |
| **3D Rendering** | deck.gl 9.x | GPU-accelerated WebGL, purpose-built for geospatial, excellent layer system | Three.js (too low-level), CesiumJS (heavy) |
| **Base Map** | MapLibre GL JS | Open-source Mapbox alternative, vector tile support | Mapbox GL (paid tiers), Leaflet (no native WebGL) |
| **State Management** | Zustand | Lightweight, minimal boilerplate | Redux (overkill), Context API (performance issues) |
| **Styling** | Tailwind CSS | Utility-first, fast prototyping | Styled-components (bundle size), plain CSS (maintenance) |
| **Data Fetching** | TanStack Query | Cache management, retry logic, React hooks | SWR (less features), plain fetch (manual caching) |

### Backend/Data Stack

| Layer | Technology | Why | Notes |
|-------|-----------|-----|-------|
| **ETL Language** | Python 3.11+ | Geospatial ecosystem (GDAL, osmnx, geopandas) | Your native environment |
| **Geo Processing** | GeoPandas + GDAL | Industry standard for vector operations | |
| **OSM Data Fetch** | osmnx / Overpass API | Direct OSM access, building-aware queries | |
| **Overture Access** | DuckDB + Parquet | Fast local queries on Overture cloud data | Alternative: AWS Athena |
| **Data Format** | GeoJSON (tiled) | Universal browser support, human-readable | Alternative: MVT (more complex) |
| **Tile Generation** | Tippecanoe (optional) | If we need MVT optimization later | |
| **File Serving** | Static hosting (Netlify/Vercel/Cloudflare Pages) | Simple, fast, CDN-backed | Alternative: S3 + CloudFront |

### Development Tools

| Purpose | Tool | Why |
|---------|------|-----|
| **Version Control** | Git + GitHub | Standard, CI/CD integration |
| **Package Manager** | pnpm | Fast, disk-efficient, strict dependency resolution |
| **Python Env** | venv + pip | Standard, lightweight |
| **Notebooks** | Jupyter Lab | Your workflow, data exploration |
| **Linting** | ESLint + Prettier (JS), ruff (Python) | Code quality, consistency |
| **CI/CD** | GitHub Actions | Free for public repos, easy setup |

---

## Data Flow Architecture

### ETL Pipeline (Offline Process)

```python
# Conceptual flow - detailed in data-pipeline.md

1. Define Area of Interest (AOI)
   ├── City name → osmnx geocoding → bounding box
   └── Manual bbox for custom areas

2. Fetch Building Data
   ├── Primary: OSM via osmnx.features_from_bbox(tags={"building": True})
   │   └── Fields: geometry, building:height, building:levels, building:type
   └── Gap Filling: Overture Maps via DuckDB query
       └── Merge on spatial proximity

3. Height Processing
   ├── building:height (meters) → direct use
   ├── building:levels → levels × 3.0m (standard floor height)
   └── No data → default 9m (3 floors)

4. Fetch Road Network
   └── osmnx.graph_from_bbox(network_type="all") → GeoDataFrame

5. Transform
   ├── CRS: Convert all to EPSG:4326 (WGS84)
   ├── Geometry: Validate and fix (buffer(0) trick)
   ├── Height: Ensure numeric, handle nulls
   └── Attributes: Select minimal fields for size

6. Tile Generation (for large areas)
   ├── Split into 1km × 1km tiles
   ├── Each tile = separate GeoJSON
   └── Generate tile index JSON

7. Export
   ├── GeoJSON files (one per layer per tile)
   └── metadata.json (bbox, tile index, data provenance)

8. Deploy
   └── Upload to static hosting / CDN
```

### Frontend Data Loading

```javascript
// Conceptual flow

1. User Opens App
   └── Load metadata.json (available areas)

2. User Selects Area (e.g., Bolzano)
   └── Fetch tile index for Bolzano

3. Camera Viewport Change
   ├── Calculate visible tiles based on viewport bbox
   ├── Fetch only visible tiles (fetch + cache in IndexedDB)
   └── deck.gl renders loaded data

4. Layer Update
   ├── User toggles building types → filter in GPU shader
   └── No re-fetch, just re-render
```

---

## Rendering Architecture

### deck.gl Layer Stack

```javascript
// Phase 1 minimal layers

[
  // Base map layer
  new TileLayer({
    data: 'https://tiles.openstreetmap.org/...',
    renderSubLayers: props => new BitmapLayer(props)
  }),

  // Building extrusion layer
  new GeoJsonLayer({
    id: 'buildings',
    data: buildingsGeoJSON,
    filled: true,
    extruded: true,
    wireframe: false,
    getElevation: d => d.properties.height || 9,
    getFillColor: d => colorByType(d.properties.building_type),
    getLineColor: [80, 80, 80],
    lineWidthMinPixels: 1,
    pickable: true,
    onClick: info => showBuildingInfo(info.object)
  }),

  // Road network layer
  new GeoJsonLayer({
    id: 'roads',
    data: roadsGeoJSON,
    filled: false,
    stroked: true,
    getLineColor: d => colorByRoadType(d.properties.highway),
    getLineWidth: d => widthByRoadType(d.properties.highway),
    lineWidthMinPixels: 1
  }),

  // POI layer (Phase 2)
  new IconLayer({
    id: 'pois',
    data: poisGeoJSON,
    getIcon: d => iconByCategory(d.properties.category),
    getPosition: d => d.geometry.coordinates,
    getSize: 20,
    pickable: true
  })
]
```

### Performance Optimizations

| Issue | Solution | Implementation |
|-------|----------|----------------|
| **Large data updates** | Incremental tile loading | Load only viewport-visible tiles, cache in IndexedDB |
| **Re-render on every pan** | Layer caching | Use consistent layer IDs, deck.gl auto-caches |
| **Heavy CPU filtering** | GPU-side filtering | Use deck.gl's `filterRange` and shader-based filters |
| **Memory pressure** | Tile eviction policy | LRU cache, unload tiles outside viewport + buffer |
| **Slow initial load** | Progressive loading | Load buildings first, roads second, POIs third |
| **GeoJSON limit (~50k features)** | Design tile system in Sprint 4 Week 1 | Milan has 200k+ buildings — architect the tile loader before writing Milan-scale code, not after hitting the wall |

Reference: [deck.gl Performance Guide](https://deck.gl/docs/developer-guide/performance)[web:51]

---

## Deployment Architecture

### Phase 1 (Proof of Concept)
```
Jupyter Notebook (local)
└── Inline PyDeck widget
```

### Phase 2 (Web MVP)
```
Frontend: Netlify / Vercel
├── Build: React app → static files
└── Deploy: Git push → auto-deploy

Data: Cloudflare R2 / S3
└── GeoJSON tiles served via CDN

Offline Layer (Sprint 5 — moved up from Phase 4):
├── Service Worker: cache visited GeoJSON tiles on first load
├── Cache-Control headers: max-age=86400 on GeoJSON responses
└── IndexedDB: persist metadata + tile index across sessions
    (dramatically improves repeat-visit performance — do not defer this to Phase 4)
```

### Phase 3 (Production)
```
Frontend: Cloudflare Pages (or Vercel)
├── Global CDN distribution
└── Free SSL, DDoS protection

Data: Cloudflare R2
├── Low-cost object storage
└── Automatic CDN caching

Backend API (if needed):
├── FastAPI on Cloud Run (serverless)
└── Minimal endpoints: user prefs, saved locations

Database (optional):
└── Supabase (Postgres) for user data
```

---

## Security & Privacy

### Data Privacy
- **No user tracking** in Phase 1-2
- **No location data sent to server** - all processing client-side
- **Optional user accounts** (Phase 3) - minimal PII collection

### API Security (Phase 3)
- JWT tokens for authenticated requests
- Rate limiting on user-specific endpoints
- CORS restrictions on production domains

---

## Scalability Considerations

### Current Limits (Phase 1-2)
- **Single city** per deployment
- **~50k buildings max** per area (Milan city center)
- **Client-side only** (no server load)

### Future Scaling (Phase 3+)
- **Multi-city support** via tile index federation
- **Global coverage** - generate tiles for major cities worldwide
- **CDN caching** - essentially infinite read scale
- **Write scale** - batch ETL can run distributed (Dask/Spark if needed)

---

## Technology Decision Rationale

### Why deck.gl over CesiumJS?
- **Lighter weight** - CesiumJS is 3D globe-focused, we need city-scale
- **Better React integration** - deck.gl is React-first
- **Simpler data model** - GeoJSON native, no 3D Tiles complexity (yet)
- **Your background** - Similar to GDAL ecosystem conceptually

### Why Not Native Mobile App?
- **Web-first** reduces development complexity (one codebase)
- **PWA path** gives 90% of native UX
- **Target user** likely uses mobile browser already for maps
- **Deployment** - instant updates, no app store approval

### Why Static Tiles vs Real-Time API?
- **Cost** - static hosting is nearly free at scale
- **Performance** - CDN-cached responses < 50ms globally
- **Simplicity** - no server management, no rate limits
- **Data freshness** - OSM updates weekly/monthly is sufficient

---

## Next Documents to Review
- `03-data-pipeline.md` - Detailed ETL implementation
- `04-frontend-implementation.md` - React + deck.gl code structure
- `05-sprint-plan.md` - Week-by-week development schedule

---

**Document Version**: 1.0  
**Last Updated**: February 21, 2026  
**Owner**: Technical Architect