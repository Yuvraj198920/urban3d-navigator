#!/usr/bin/env python3
"""
Urban3D Navigator — Full ETL Pipeline

Orchestrates all stages from data fetch to GeoJSON export.

Usage:
    python -m pipeline.run                     # Uses defaults from config.py
    python -m pipeline.run --city "Milan, Italy" --use-overture
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure the project root (parent of `pipeline/`) is on sys.path so that
# `from pipeline.X import ...` resolves correctly whether run.py is invoked
# directly (`python run.py`) or as a module (`python -m pipeline.run`).
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from pipeline.config import BBOX, CITY, OUTPUT_DIR, USE_OVERTURE
from pipeline.stages.fetch_buildings import fetch_osm_buildings
from pipeline.stages.fetch_pois import fetch_pois
from pipeline.stages.fetch_overture import fetch_overture_buildings, merge_osm_overture
from pipeline.stages.process_heights import process_heights
from pipeline.stages.fetch_roads import fetch_road_network
from pipeline.stages.clean_geometry import clean_geometries
from pipeline.stages.export_geojson import export_geojson
from pipeline.stages.generate_metadata import generate_metadata
from pipeline.stages.validate import validate_building_data


def run_pipeline(
    city: str = CITY,
    bbox: tuple[float, float, float, float] = BBOX,
    output_dir: Path = OUTPUT_DIR,
    use_overture: bool = USE_OVERTURE,
) -> Path:
    """
    Run the complete ETL pipeline for a city.

    Args:
        city: City name (for metadata + slug)
        bbox: (north, south, east, west) bounding box
        output_dir: Root output directory
        use_overture: Whether to fetch Overture data for gap filling

    Returns:
        Path to the city output directory
    """
    print(f"{'=' * 60}")
    print(f"Urban3D Navigator — ETL Pipeline")
    print(f"City: {city}")
    print(f"Bbox: N={bbox[0]}, S={bbox[1]}, E={bbox[2]}, W={bbox[3]}")
    print(f"Overture: {'enabled' if use_overture else 'disabled'}")
    print(f"{'=' * 60}")

    # ── Stage 2: Fetch OSM buildings ─────────────────────
    print("\n[1/7] Fetching OSM buildings...")
    buildings = fetch_osm_buildings(bbox)
    print(f"  Fetched {len(buildings)} buildings")

    # ── Stage 3: Overture gap filling (optional) ─────────
    if use_overture:
        print("\n[2/7] Fetching Overture buildings for height gap-filling...")
        overture = fetch_overture_buildings(bbox)
        buildings = merge_osm_overture(buildings, overture)
        print(f"  Merged Overture heights")
    else:
        print("\n[2/7] Skipping Overture (disabled)")

    # ── Stage 4: Process heights ─────────────────────────
    print("\n[3/7] Processing building heights...")
    buildings = process_heights(buildings)
    validate_building_data(buildings)

    # ── Stage 5: Fetch roads ─────────────────────────────
    print("\n[4/7] Fetching road network...")
    roads = fetch_road_network(bbox)
    print(f"  Fetched {len(roads)} road segments")

    # ── Stage 6: Clean geometries ────────────────────────
    print("\n[5/7] Cleaning geometries...")
    buildings = clean_geometries(buildings)
    roads = clean_geometries(roads)

    # ── Stage 6b: Fetch POIs ─────────────────────────────────────────
    print("\n[5b/7] Fetching POIs...")
    pois = fetch_pois(bbox)
    print(f"  Fetched {len(pois)} POIs")

    # ── Stage 7: Export ──────────────────────────────────────────────
    print("\n[6/7] Exporting GeoJSON files...")
    city_slug = city.lower().replace(" ", "_").replace(",", "")
    city_dir = output_dir / city_slug

    export_geojson(buildings, city_dir / "buildings.geojson", "buildings")
    export_geojson(roads, city_dir / "roads.geojson", "roads")
    export_geojson(pois, city_dir / "pois.geojson", "pois")

    # ── Stage 8: Metadata ────────────────────────────────────────────
    print("\n[7/7] Generating metadata...")
    generate_metadata(city, buildings, roads, city_dir / "metadata.json", pois_gdf=pois)

    print(f"\n{'=' * 60}")
    print(f"✅ Pipeline complete! Output: {city_dir}")
    print(f"{'=' * 60}")

    return city_dir


def main():
    parser = argparse.ArgumentParser(description="Urban3D Navigator ETL Pipeline")
    parser.add_argument("--city", default=CITY, help=f"City name (default: {CITY})")
    parser.add_argument(
        "--bbox",
        nargs=4,
        type=float,
        default=list(BBOX),
        metavar=("N", "S", "E", "W"),
        help="Bounding box: north south east west",
    )
    parser.add_argument(
        "--use-overture",
        action="store_true",
        default=USE_OVERTURE,
        help="Enable Overture Maps gap filling",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=OUTPUT_DIR,
        help=f"Output directory (default: {OUTPUT_DIR})",
    )
    args = parser.parse_args()

    run_pipeline(
        city=args.city,
        bbox=tuple(args.bbox),
        output_dir=args.output_dir,
        use_overture=args.use_overture,
    )


if __name__ == "__main__":
    main()
