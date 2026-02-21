# Urban3D Navigator

A lightweight **3D spatial awareness tool** for complex urban environments. Visualises building volumes, road networks, and points of interest as clean LoD1 geometry — giving users the spatial comprehension that 2D maps can't.

> Current focus city: **Bolzano, Italy** (Phase 1 PoC)

---

## The Problem

Google Maps and Apple Maps optimise for routing but fail at **spatial comprehension**. In dense urban areas — Milan's Navigli, Tokyo's Shinjuku, Manhattan — 2D maps flatten the vertical cues humans naturally use for orientation:

- The tall corner building that marks a junction
- Narrow passages between towers
- Low arcade roofs vs. high-rise facades

Urban3D Navigator fills this gap with clean, lightweight 3D geometry you can orbit freely.

---

## Features

| | |
|---|---|
| 🏢 **3D Buildings** | Extruded footprints coloured by height (LoD1) |
| 🛣️ **Road Network** | Classified roads with width-scaled rendering |
| 🎮 **Free Camera** | Full orbit, tilt, and zoom via mouse or touch |
| 🔍 **Hover Tooltips** | Building height, data source, type on hover |
| 🗂️ **Layer Toggles** | Show/hide buildings, wireframe, roads |
| 📊 **Data Transparency** | Height source shown per building (OSM / Overture / levels / default) |
| 🏔️ **Terrain DEM** | MapTiler RGB terrain for Alpine relief *(in progress)* |

---

## Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| 3D Rendering | deck.gl 9 (WebGL2) |
| Base Map | MapLibre GL JS + react-map-gl |
| State | Zustand |
| Data Fetching | TanStack Query |
| Testing | Vitest + Testing Library |

### Data Pipeline (Python)
| Layer | Technology |
|-------|-----------|
| Geospatial | GeoPandas, Shapely, osmnx |
| OSM Fetch | osmnx 1.9.x |
| Overture Gap-fill | DuckDB + Parquet (S3) |
| Output | GeoJSON (compact, rounded coordinates) |
| Testing | pytest |

---

## Project Structure

```
urban3d-navigator/
├── pipeline/                  # Python ETL pipeline
│   ├── stages/                # Individual ETL stages
│   │   ├── fetch_aoi.py       # Stage 1: AOI definition
│   │   ├── fetch_buildings.py # Stage 2: OSM building fetch
│   │   ├── fetch_overture.py  # Stage 3: Overture gap-fill
│   │   ├── process_heights.py # Stage 4: Height fallback hierarchy
│   │   ├── fetch_roads.py     # Stage 5: Road network
│   │   ├── clean_geometry.py  # Stage 6: Geometry validation
│   │   ├── export_geojson.py  # Stage 7: GeoJSON export
│   │   └── generate_metadata.py # Stage 8: Quality metadata
│   ├── tests/                 # pytest test suite
│   ├── config.py              # Centralised constants
│   ├── run.py                 # CLI orchestrator
│   └── requirements.txt       # Pinned dependencies
│
├── frontend/                  # React + deck.gl app
│   └── src/
│       ├── components/        # Map3D, Controls, Tooltip
│       ├── layers/            # buildingLayer, roadLayer
│       ├── hooks/             # useMapData, useViewState
│       ├── store/             # Zustand mapStore
│       ├── types/             # TypeScript interfaces
│       └── utils/             # constants, colour scales
│
└── public/data/               # Served GeoJSON output
    └── bolzano_italy/
        ├── buildings.geojson
        ├── roads.geojson
        └── metadata.json
```

---

## Setup

### Prerequisites
- Python 3.12+
- Node.js 20.19+ (or 22+)
- A free [MapTiler API key](https://cloud.maptiler.com/account/keys)

---

### 1. Clone the repo

```bash
git clone https://github.com/Yuvraj198920/urban3d-navigator.git
cd urban3d-navigator
```

### 2. Run the ETL pipeline

```bash
cd pipeline

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the pipeline for Bolzano
python run.py --city "Bolzano, Italy" --output-dir ../public/data/bolzano_italy
```

This fetches OSM data, fills height gaps via Overture, and writes GeoJSON to `public/data/bolzano_italy/`.

Optional flags:
```bash
python run.py --help

# Use Overture Maps for better height coverage (requires internet + AWS access)
python run.py --city "Bolzano, Italy" --use-overture
```

### 3. Set up the frontend

```bash
cd frontend

# Copy environment file and add your MapTiler key
cp .env.example .env
# Edit .env: VITE_MAPTILER_API_KEY=your_key_here

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Running Tests

### Python (pipeline)
```bash
cd pipeline
source .venv/bin/activate
pytest
```

### TypeScript (frontend)
```bash
cd frontend
npm run test
```

Current coverage: **12 Python tests · 4 TypeScript tests** — all passing.

---

## Height Data Sources

Each building's height is resolved via a 4-level fallback hierarchy, tracked in the `height_source` field:

| Source | Description |
|--------|-------------|
| `osm` | Explicit `height=` tag from OpenStreetMap |
| `overture` | Height data from Overture Maps (gap-fill) |
| `levels` | Derived from `building:levels` × 3m floor height |
| `default` | Fallback default of 9m (3 floors) |

Buildings with a `default` source render with a **wireframe outline** instead of a solid fill, making data confidence immediately visible.

---

## Roadmap

| Milestone | Status |
|-----------|--------|
| M1: PoC — Bolzano 3D scene running locally | 🔄 In Progress |
| M2: Feature complete — filters, POIs, selection panel | ⬜ Planned |
| M3: Scale — Milan Brera district (10k+ buildings) | ⬜ Planned |
| M4: Production — CI/CD, hosting, performance budget | ⬜ Planned |

See [GitHub Issues](https://github.com/Yuvraj198920/urban3d-navigator/issues) and the [Project Board](https://github.com/users/Yuvraj198920/projects/5) for detailed sprint tasks.

---

## Contributing

This is a solo learning project. Issues and suggestions are welcome via [GitHub Issues](https://github.com/Yuvraj198920/urban3d-navigator/issues).

---

## License

MIT © Yuvraj Adagale
