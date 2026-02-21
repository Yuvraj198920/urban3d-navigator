# Data Pipeline & ETL Implementation

## Pipeline Overview

The ETL pipeline transforms raw OSM/Overture data into optimized GeoJSON tiles ready for web rendering. This runs as an **offline batch process**, not real-time.

---

## Data Sources

### Primary: OpenStreetMap (OSM)

**Access Method**: `osmnx` Python library (wraps Overpass API)

**Advantages**:
- Free, open data
- Community-maintained building heights in many European cities
- Rich attribute tags (building type, levels, material)
- Your EURAC work uses OSM already

**Limitations**:
- Building height coverage varies (10-30% globally, better in Europe)[web:31]
- Data quality depends on local community
- API rate limits (mitigated by osmnx caching)

**Key Tags**:
```python
{
    "building": True,  # All buildings
    "building:height": "numeric value in meters",
    "building:levels": "number of floors",
    "building:type": "residential|commercial|industrial|...",
    "name": "Building name (if notable)"
}
```

### Secondary: Overture Maps Foundation

**Access Method**: DuckDB queries on cloud-hosted Parquet files (AWS S3)[web:52]

**Advantages**:
- ML-estimated heights from USGS LiDAR (6M+ buildings)[web:22]
- Better global coverage than OSM heights
- Standardized schema
- Cloud-native Parquet format

**Limitations**:
- Height estimates less accurate than surveyed OSM data
- Requires DuckDB setup
- Larger download sizes

**Usage Strategy**:
1. Fetch OSM buildings first
2. Identify buildings missing heights
3. Query Overture for same area
4. Spatial join to fill gaps

---

## ETL Pipeline Stages

### Stage 1: Area Definition

**Input**: City name or bounding box  
**Output**: GeoDataFrame with AOI boundary

```python
import osmnx as ox
import geopandas as gpd

def define_aoi(city_name: str) -> gpd.GeoDataFrame:
    """
    Get bounding box for a city.
    
    For Bolzano test case:
    - Old town only: smaller, faster
    - Full city: production dataset
    """
    # Option 1: City boundary polygon
    gdf = ox.geocode_to_gdf(city_name)
    
    # Option 2: Manual bbox (for precise control)
    # bbox = (north, south, east, west)
    # bolzano_bbox = (46.51, 46.48, 11.37, 11.32)
    
    return gdf
```

**Bolzano Specifics**:
- Old town bbox: `(46.503, 46.495, 11.358, 11.345)` (~1 km²)
- Full city: Use `ox.geocode_to_gdf("Bolzano, Italy")`

---

### Stage 2: Fetch OSM Buildings

**Input**: AOI boundary  
**Output**: GeoDataFrame of building polygons with attributes

```python
def fetch_osm_buildings(bbox: tuple) -> gpd.GeoDataFrame:
    """
    Fetch all buildings in bbox from OSM.
    
    Args:
        bbox: (north, south, east, west) in WGS84
    
    Returns:
        GeoDataFrame with columns:
        - geometry (Polygon)
        - building (type)
        - building:height (meters, may be null)
        - building:levels (floors, may be null)
        - name (if available)
    """
    tags = {
        "building": True
    }
    
    gdf = ox.features_from_bbox(
        bbox=bbox,
        tags=tags
    )
    
    # Keep only polygons (some OSM buildings are points/lines - errors)
    gdf = gdf[gdf.geometry.type.isin(['Polygon', 'MultiPolygon'])]
    
    # Rename columns for consistency
    gdf = gdf.rename(columns={
        'building:height': 'height_osm',
        'building:levels': 'levels',
        'building': 'building_type'
    })
    
    return gdf[['geometry', 'building_type', 'height_osm', 'levels', 'name']]
```

**Expected Output for Bolzano Old Town**:
- ~1,500-2,000 buildings
- ~30-50% with `height_osm` data
- ~60-80% with `levels` data

---

### Stage 3: Fetch Overture Buildings (Gap Filling)

**Input**: AOI boundary, OSM buildings GeoDataFrame  
**Output**: Enhanced GeoDataFrame with Overture heights filled in

```python
import duckdb

def fetch_overture_buildings(bbox: tuple) -> gpd.GeoDataFrame:
    """
    Query Overture Maps for buildings in bbox.
    
    Uses DuckDB spatial extension to query cloud Parquet files.
    """
    north, south, east, west = bbox
    
    query = f"""
    INSTALL spatial;
    LOAD spatial;
    INSTALL httpfs;
    LOAD httpfs;
    
    SELECT 
        ST_GeomFromWKB(geometry) as geometry,
        height,
        names.primary as name,
        class as building_type
    FROM read_parquet('s3://overturemaps-us-west-2/release/2024-11-13.0/theme=buildings/type=building/*')
    WHERE bbox.xmin >= {west} 
      AND bbox.xmax <= {east}
      AND bbox.ymin >= {south}
      AND bbox.ymax <= {north};
    """
    
    conn = duckdb.connect()
    result = conn.execute(query).fetchdf()
    
    gdf = gpd.GeoDataFrame(result, geometry='geometry', crs='EPSG:4326')
    return gdf

def merge_osm_overture(osm_gdf: gpd.GeoDataFrame, 
                       overture_gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Merge OSM and Overture data, prioritizing OSM heights.
    
    Strategy:
    1. Keep all OSM buildings
    2. For buildings missing height, find nearest Overture building
    3. If within 5m distance, use Overture height
    """
    # Buildings missing OSM height
    missing_height = osm_gdf[osm_gdf['height_osm'].isna()]
    
    # Spatial join (nearest neighbor)
    joined = gpd.sjoin_nearest(
        missing_height,
        overture_gdf[['geometry', 'height']],
        how='left',
        max_distance=5,  # meters
        distance_col='match_distance'
    )
    
    # Update OSM data with Overture heights
    osm_gdf.loc[joined.index, 'height_overture'] = joined['height']
    
    return osm_gdf
```

**Note**: Overture fetch is optional for Bolzano (OSM coverage is good). Use for Milan/larger cities.

---

### Stage 4: Height Processing & Fallbacks

**Input**: GeoDataFrame with potentially null heights  
**Output**: GeoDataFrame with guaranteed numeric `height` column

```python
def process_heights(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Calculate final building heights using fallback hierarchy.
    
    Priority:
    1. building:height (OSM surveyed)
    2. Overture estimated height
    3. building:levels × 3.0m (standard floor height)
    4. Default 9m (3 floors - typical European urban)
    """
    gdf = gdf.copy()
    
    # Initialize height column
    gdf['height'] = None
    
    # Priority 1: OSM height (convert to numeric)
    gdf['height'] = pd.to_numeric(gdf['height_osm'], errors='coerce')
    
    # Priority 2: Overture height (if available)
    mask = gdf['height'].isna() & gdf['height_overture'].notna()
    gdf.loc[mask, 'height'] = gdf.loc[mask, 'height_overture']
    
    # Priority 3: Levels × 3m
    mask = gdf['height'].isna() & gdf['levels'].notna()
    gdf.loc[mask, 'height'] = pd.to_numeric(gdf.loc[mask, 'levels'], errors='coerce') * 3.0
    
    # Priority 4: Default 9m
    gdf['height'].fillna(9.0, inplace=True)
    
    # Sanity checks
    gdf['height'] = gdf['height'].clip(lower=2.0, upper=300.0)  # Min 2m, max 300m
    
    # Track height source for frontend rendering decisions
    # height_source=default buildings should render as wireframe-only outlines
    # to be visually honest about data gaps (solid default boxes hurt spatial cognition)
    gdf['height_source'] = 'default'
    mask_osm = pd.to_numeric(gdf['height_osm'], errors='coerce').notna()
    mask_overture = gdf.get('height_overture', pd.Series(dtype=float)).notna()
    mask_levels = gdf['levels'].notna() & ~mask_osm
    gdf.loc[mask_osm, 'height_source'] = 'osm'
    gdf.loc[mask_overture & ~mask_osm, 'height_source'] = 'overture'
    gdf.loc[mask_levels & ~mask_osm & ~mask_overture, 'height_source'] = 'levels'
    
    # Drop intermediate columns
    gdf = gdf.drop(columns=['height_osm', 'height_overture', 'levels'], errors='ignore')
    
    return gdf

def add_color_by_height(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Add RGB color based on height for visualization.
    
    Gradient: Low buildings (blue) → High buildings (red)
    """
    from matplotlib import cm
    import numpy as np
    
    heights = gdf['height'].values
    normalized = (heights - heights.min()) / (heights.max() - heights.min())
    colors = cm.viridis(normalized)[:, :3] * 255  # RGB only, scale to 0-255
    
    gdf['fill_color'] = colors.tolist()
    
    return gdf
```

**Validation Checks**:
```python
def validate_building_data(gdf: gpd.GeoDataFrame) -> dict:
    """
    Quality checks on processed building data.
    """
    checks = {
        'total_buildings': len(gdf),
        'height_from_osm': (gdf['height_osm'].notna()).sum(),
        'height_from_overture': (gdf['height_overture'].notna()).sum(),
        'height_from_levels': (gdf['levels'].notna() & gdf['height_osm'].isna()).sum(),
        'height_default': (gdf['height'] == 9.0).sum(),
        'avg_height': gdf['height'].mean(),
        'max_height': gdf['height'].max(),
        'invalid_geometries': (~gdf.geometry.is_valid).sum()
    }
    
    print("Data Quality Report:")
    for key, value in checks.items():
        print(f"  {key}: {value}")
    
    return checks
```

---

### Stage 5: Fetch Road Network

**Input**: AOI boundary  
**Output**: GeoDataFrame of road LineStrings

```python
def fetch_road_network(bbox: tuple) -> gpd.GeoDataFrame:
    """
    Fetch road network from OSM.
    
    Returns roads as LineStrings with hierarchy attributes.
    """
    # Get graph representation
    G = ox.graph_from_bbox(
        bbox=bbox,
        network_type='all',  # Include pedestrian paths, cycle ways
        simplify=True
    )
    
    # Convert to GeoDataFrame (edges)
    gdf_edges = ox.graph_to_gdfs(G, nodes=False, edges=True)
    
    # Keep relevant columns
    gdf_edges = gdf_edges[[
        'geometry',
        'highway',  # road type (primary, residential, footway, ...)
        'name',
        'maxspeed',
        'oneway'
    ]].reset_index(drop=True)
    
    return gdf_edges

def classify_roads(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Classify roads into visual categories.
    
    Categories:
    - Major: motorway, trunk, primary
    - Minor: secondary, tertiary, residential
    - Path: footway, cycleway, path
    """
    road_hierarchy = {
        'motorway': 'major',
        'trunk': 'major',
        'primary': 'major',
        'secondary': 'minor',
        'tertiary': 'minor',
        'residential': 'minor',
        'footway': 'path',
        'cycleway': 'path',
        'path': 'path',
        'pedestrian': 'path'
    }
    
    gdf['road_class'] = gdf['highway'].map(road_hierarchy).fillna('other')
    
    # Width and color by class (for rendering)
    width_map = {'major': 3, 'minor': 2, 'path': 1, 'other': 1}
    gdf['line_width'] = gdf['road_class'].map(width_map)
    
    return gdf
```

---

### Stage 6: Geometry Validation & CRS

**Input**: GeoDataFrames with potential geometry issues  
**Output**: Clean, valid geometries in EPSG:4326

```python
def clean_geometries(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Fix invalid geometries and ensure correct CRS.
    """
    # Ensure WGS84 (deck.gl expects EPSG:4326)
    if gdf.crs != 'EPSG:4326':
        gdf = gdf.to_crs('EPSG:4326')
    
    # Fix invalid geometries (common OSM issue)
    invalid_mask = ~gdf.geometry.is_valid
    if invalid_mask.any():
        print(f"Fixing {invalid_mask.sum()} invalid geometries")
        gdf.loc[invalid_mask, 'geometry'] = gdf.loc[invalid_mask, 'geometry'].buffer(0)
    
    # Remove any remaining invalids
    gdf = gdf[gdf.geometry.is_valid]
    
    # Remove empty geometries
    gdf = gdf[~gdf.geometry.is_empty]
    
    return gdf
```

---

### Stage 7: Export to GeoJSON

**Input**: Processed GeoDataFrames  
**Output**: GeoJSON files ready for web serving

```python
import json
from pathlib import Path

def export_geojson(gdf: gpd.GeoDataFrame, 
                   output_path: Path,
                   layer_name: str) -> None:
    """
    Export GeoDataFrame to GeoJSON with optimizations.
    
    Optimizations:
    - Precision reduced to 6 decimal places (~10cm accuracy)
    - Only necessary properties included
    """
    # Select minimal columns
    if layer_name == 'buildings':
        keep_cols = ['geometry', 'height', 'height_source', 'building_type', 'name']
    elif layer_name == 'roads':
        keep_cols = ['geometry', 'highway', 'road_class', 'name', 'line_width']
    
    gdf_export = gdf[keep_cols].copy()
    
    # Drop null names (reduce file size)
    if 'name' in gdf_export.columns:
        gdf_export['name'] = gdf_export['name'].fillna('')
    
    # Export with precision limit
    geojson_str = gdf_export.to_json(drop_id=True)
    geojson_data = json.loads(geojson_str)
    
    # Round coordinates to 6 decimals
    def round_coords(coords):
        if isinstance(coords[0], list):
            return [round_coords(c) for c in coords]
        else:
            return [round(c, 6) for c in coords]
    
    for feature in geojson_data['features']:
        geom = feature['geometry']
        geom['coordinates'] = round_coords(geom['coordinates'])
    
    # Write to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(geojson_data, f, separators=(',', ':'))  # Compact format
    
    file_size_mb = output_path.stat().st_size / 1_000_000
    print(f"Exported {layer_name}: {len(gdf)} features, {file_size_mb:.2f} MB")
```

---

### Stage 8: Metadata Generation

**Input**: Processed datasets  
**Output**: `metadata.json` with dataset information

```python
def generate_metadata(city_name: str,
                      buildings_gdf: gpd.GeoDataFrame,
                      roads_gdf: gpd.GeoDataFrame,
                      output_path: Path) -> None:
    """
    Generate metadata JSON for frontend consumption.
    """
    bounds = buildings_gdf.total_bounds  # [minx, miny, maxx, maxy]
    
    metadata = {
        'city': city_name,
        'generated_at': datetime.now().isoformat(),
        'bounds': {
            'west': float(bounds[0]),
            'south': float(bounds[1]),
            'east': float(bounds[2]),
            'north': float(bounds[3])
        },
        'center': {
            'lon': float((bounds[0] + bounds[2]) / 2),
            'lat': float((bounds[1] + bounds[3]) / 2)
        },
        'stats': {
            'buildings_count': len(buildings_gdf),
            'roads_count': len(roads_gdf),
            'avg_building_height': float(buildings_gdf['height'].mean()),
            'max_building_height': float(buildings_gdf['height'].max())
        },
        'data_sources': {
            'osm': 'OpenStreetMap via osmnx',
            'overture': 'Overture Maps Foundation (if used)'
        },
        'files': {
            'buildings': 'buildings.geojson',
            'roads': 'roads.geojson'
        }
    }
    
    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2)
```

---

## Complete Pipeline Script

```python
# pipeline.py - Full ETL orchestration

from pathlib import Path
from datetime import datetime
import osmnx as ox
import geopandas as gpd

# Configuration
OUTPUT_DIR = Path('data/processed')
CITY = 'Bolzano, Italy'
BBOX = (46.503, 46.495, 11.358, 11.345)  # Old town

def run_pipeline(city: str, bbox: tuple, output_dir: Path):
    """
    Run complete ETL pipeline for a city.
    """
    print(f"Starting pipeline for {city}")
    print(f"Bbox: {bbox}")
    
    # Stage 2: Fetch buildings
    print("\n[1/6] Fetching OSM buildings...")
    buildings = fetch_osm_buildings(bbox)
    print(f"  Fetched {len(buildings)} buildings")
    
    # Stage 4: Process heights
    print("\n[2/6] Processing building heights...")
    buildings = process_heights(buildings)
    buildings = add_color_by_height(buildings)
    validate_building_data(buildings)
    
    # Stage 5: Fetch roads
    print("\n[3/6] Fetching road network...")
    roads = fetch_road_network(bbox)
    roads = classify_roads(roads)
    print(f"  Fetched {len(roads)} road segments")
    
    # Stage 6: Clean geometries
    print("\n[4/6] Cleaning geometries...")
    buildings = clean_geometries(buildings)
    roads = clean_geometries(roads)
    
    # Stage 7: Export
    print("\n[5/6] Exporting GeoJSON files...")
    city_slug = city.lower().replace(' ', '_').replace(',', '')
    city_dir = output_dir / city_slug
    
    export_geojson(buildings, city_dir / 'buildings.geojson', 'buildings')
    export_geojson(roads, city_dir / 'roads.geojson', 'roads')
    
    # Stage 8: Metadata
    print("\n[6/6] Generating metadata...")
    generate_metadata(city, buildings, roads, city_dir / 'metadata.json')
    
    print(f"\n✅ Pipeline complete! Output: {city_dir}")
    return city_dir

if __name__ == '__main__':
    output = run_pipeline(CITY, BBOX, OUTPUT_DIR)
```

---

## Expected Output Structure

```
data/processed/bolzano_italy/
├── buildings.geojson      # ~1,500 buildings, ~800 KB
├── roads.geojson          # ~500 road segments, ~200 KB
└── metadata.json          # Dataset info, ~1 KB
```

---

## Performance Benchmarks

| Stage | Time (Bolzano) | Time (Milan District) | Notes |
|-------|---------------|----------------------|-------|
| Fetch OSM buildings | 5-10s | 30-60s | Depends on Overpass API load |
| Process heights | <1s | 2-5s | Pure pandas operations |
| Fetch roads | 3-5s | 15-30s | Graph construction overhead |
| Clean geometries | 1-2s | 5-10s | Buffer(0) operation |
| Export GeoJSON | <1s | 3-5s | JSON serialization |
| **Total** | **15-30s** | **60-120s** | |

---

## Troubleshooting

### OSM Overpass API Timeouts
```python
# Increase timeout in osmnx settings
ox.settings.timeout = 300  # 5 minutes
ox.settings.max_query_area_size = 50 * 1000 * 1000  # 50 million m²
```

### Memory Issues (Large Cities)
```python
# Process in chunks (tile-based approach)
from shapely.geometry import box

def split_bbox_into_tiles(bbox, tile_size_km=1):
    # Split bbox into 1km × 1km tiles
    # Process each tile separately
    pass
```

### Invalid Geometries Persist
```python
# More aggressive fix
gdf['geometry'] = gdf.geometry.buffer(0).simplify(0.00001)
```

---

**Next Document**: `04-frontend-implementation.md`

**Document Version**: 1.0  
**Last Updated**: February 21, 2026  
**Owner**: Backend/Geospatial Engineer