"""
Stage 8: Metadata Generation

Creates metadata.json with dataset info for frontend consumption.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import geopandas as gpd


def generate_metadata(
    city_name: str,
    buildings_gdf: gpd.GeoDataFrame,
    roads_gdf: gpd.GeoDataFrame,
    output_path: Path,
) -> Path:
    """
    Generate metadata JSON for frontend consumption.

    Includes bounding box, center point, feature counts, and height statistics.

    Args:
        city_name: Human-readable city name
        buildings_gdf: Processed buildings GeoDataFrame (must have height, height_source)
        roads_gdf: Processed roads GeoDataFrame
        output_path: Destination file path

    Returns:
        Path to the written file
    """
    bounds = buildings_gdf.total_bounds  # [minx, miny, maxx, maxy]

    # Height source breakdown
    source_counts = buildings_gdf["height_source"].value_counts().to_dict()

    metadata = {
        "city": city_name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "bounds": {
            "west": float(bounds[0]),
            "south": float(bounds[1]),
            "east": float(bounds[2]),
            "north": float(bounds[3]),
        },
        "center": {
            "lon": float((bounds[0] + bounds[2]) / 2),
            "lat": float((bounds[1] + bounds[3]) / 2),
        },
        "stats": {
            "buildings_count": len(buildings_gdf),
            "roads_count": len(roads_gdf),
            "avg_building_height": round(float(buildings_gdf["height"].mean()), 1),
            "max_building_height": round(float(buildings_gdf["height"].max()), 1),
            "height_sources": source_counts,
            "pct_known_height": round(
                (1 - source_counts.get("default", 0) / max(len(buildings_gdf), 1)) * 100,
                1,
            ),
        },
        "data_sources": {
            "osm": "OpenStreetMap via osmnx",
            "overture": "Overture Maps Foundation (if used)",
        },
        "files": {
            "buildings": "buildings.geojson",
            "roads": "roads.geojson",
        },
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"  Metadata written: {output_path}")
    return output_path
