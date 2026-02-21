"""
Data Quality Validation

Generates a quality report after height processing.
Uses the height_source column (available after process_heights).
"""

import geopandas as gpd


def validate_building_data(gdf: gpd.GeoDataFrame) -> dict:
    """
    Quality checks on processed building data.

    Args:
        gdf: GeoDataFrame with height + height_source columns

    Returns:
        Dictionary of quality metrics

    Raises:
        ValueError: If required columns are missing
    """
    required_cols = {"height", "height_source"}
    missing = required_cols - set(gdf.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    total = len(gdf)
    source_counts = gdf["height_source"].value_counts()

    checks = {
        "total_buildings": total,
        "height_from_osm": int(source_counts.get("osm", 0)),
        "height_from_overture": int(source_counts.get("overture", 0)),
        "height_from_levels": int(source_counts.get("levels", 0)),
        "height_default": int(source_counts.get("default", 0)),
        "pct_known_height": f"{(1 - source_counts.get('default', 0) / max(total, 1)) * 100:.1f}%",
        "avg_height": round(float(gdf["height"].mean()), 1),
        "max_height": round(float(gdf["height"].max()), 1),
        "min_height": round(float(gdf["height"].min()), 1),
        "invalid_geometries": int((~gdf.geometry.is_valid).sum()),
    }

    print("\n  ── Data Quality Report ──")
    for key, value in checks.items():
        print(f"    {key}: {value}")

    return checks
