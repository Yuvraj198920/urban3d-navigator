"""
Stage 6: Geometry Validation & CRS

Fixes invalid geometries and ensures EPSG:4326 for web rendering.
"""

import geopandas as gpd


def clean_geometries(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Fix invalid geometries and ensure correct CRS.

    Operations:
    1. Reproject to EPSG:4326 if needed (deck.gl expects lat/lon)
    2. Fix invalid polygons using buffer(0)
    3. Remove empty geometries

    Args:
        gdf: GeoDataFrame with potentially invalid geometries

    Returns:
        Cleaned GeoDataFrame in EPSG:4326
    """
    gdf = gdf.copy()

    # Ensure WGS84
    if gdf.crs is None:
        gdf = gdf.set_crs("EPSG:4326")
    elif gdf.crs != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    # Fix invalid geometries
    invalid_mask = ~gdf.geometry.is_valid
    if invalid_mask.any():
        count = invalid_mask.sum()
        print(f"  Fixing {count} invalid geometries via buffer(0)")
        gdf.loc[invalid_mask, "geometry"] = gdf.loc[invalid_mask, "geometry"].buffer(0)

    # Remove still-invalid or empty geometries
    gdf = gdf[gdf.geometry.is_valid & ~gdf.geometry.is_empty]

    return gdf.reset_index(drop=True)
