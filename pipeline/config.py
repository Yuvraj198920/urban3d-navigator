"""
Urban3D Navigator - ETL Pipeline Configuration

Centralized constants for the data pipeline.
Change these values to switch between cities, toggle features, or update data sources.
"""

from pathlib import Path

# ── Output ──────────────────────────────────────────────
OUTPUT_DIR = Path(__file__).parent / "data" / "processed"

# ── Area of Interest ────────────────────────────────────
CITY = "Bolzano, Italy"
# Expanded city-wide bounding box (north, south, east, west)
# Covers: Gries, Centro Storico, Don Bosco, Europa-Novacella, Station area
# ~5.5 km × 5 km — well within OSM_MAX_QUERY_AREA (50 km²)
# Old town only was: (46.503, 46.495, 11.358, 11.345)
BBOX = (46.515, 46.465, 11.385, 11.315)

# ── Overture Maps ───────────────────────────────────────
USE_OVERTURE = False  # Enable for cities with sparse OSM heights (e.g. Milan)
OVERTURE_RELEASE = "2024-11-13.0"  # Pin to tested release — update when new release ships

# ── Height Processing ───────────────────────────────────
DEFAULT_HEIGHT_M = 9.0    # Fallback when no height data is available (3 floors)
FLOOR_HEIGHT_M = 3.0      # Meters per building:levels (European standard)
MIN_HEIGHT_M = 2.0        # Sanity cap — minimum building height
MAX_HEIGHT_M = 300.0      # Sanity cap — maximum building height

# ── OSM Settings ────────────────────────────────────────
OSM_TIMEOUT = 300          # Overpass API timeout in seconds
OSM_MAX_QUERY_AREA = 50_000_000  # Max query area in m²

# ── Spatial Tiling (Phase 2) ────────────────────────────
TILE_SIZE_KM = 1.0         # Tile size for large areas
GEOJSON_COORD_PRECISION = 6  # Decimal places (~10cm accuracy)

# ── Overture S3 URL ─────────────────────────────────────
OVERTURE_S3_BASE = (
    f"s3://overturemaps-us-west-2/release/{OVERTURE_RELEASE}"
    f"/theme=buildings/type=building/*"
)
