"""
Stage 2: Fetch OSM Buildings

Downloads building footprints from OpenStreetMap via osmnx.
"""

import osmnx as ox
import geopandas as gpd

from pipeline.config import OSM_TIMEOUT, OSM_MAX_QUERY_AREA


def fetch_osm_buildings(bbox: tuple[float, float, float, float]) -> gpd.GeoDataFrame:
    """
    Fetch all buildings in bbox from OSM.

    Args:
        bbox: (north, south, east, west) in WGS84

    Returns:
        GeoDataFrame with columns:
        - geometry (Polygon/MultiPolygon)
        - building_type
        - height_osm (meters, may be NaN)
        - levels (floor count, may be NaN)
        - name (if available)
    """
    ox.settings.timeout = OSM_TIMEOUT
    ox.settings.max_query_area_size = OSM_MAX_QUERY_AREA

    tags = {"building": True}
    gdf = ox.features_from_bbox(bbox=bbox, tags=tags)

    # Keep only polygon geometries (some OSM buildings are erroneously points/lines)
    gdf = gdf[gdf.geometry.type.isin(["Polygon", "MultiPolygon"])].copy()

    # Rename columns for consistency
    rename_map = {
        "building:height": "height_osm",
        "building:levels": "levels",
        "building": "building_type",
    }
    gdf = gdf.rename(columns={k: v for k, v in rename_map.items() if k in gdf.columns})

    # Select only the columns we need (others may or may not exist)
    keep = ["geometry", "building_type", "height_osm", "levels", "name"]
    for col in keep:
        if col not in gdf.columns:
            gdf[col] = None

    return gdf[keep].reset_index(drop=True)
