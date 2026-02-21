"""
Stage 1: Area of Interest Definition

Defines the bounding box for data fetching.
"""

import osmnx as ox
import geopandas as gpd


def define_aoi(city_name: str) -> gpd.GeoDataFrame:
    """
    Get boundary polygon for a city via OSM geocoding.

    Args:
        city_name: City name string (e.g. "Bolzano, Italy")

    Returns:
        GeoDataFrame with city boundary polygon
    """
    gdf = ox.geocode_to_gdf(city_name)
    return gdf


def bbox_to_tuple(gdf: gpd.GeoDataFrame) -> tuple[float, float, float, float]:
    """
    Extract (north, south, east, west) bounding box from a GeoDataFrame.

    Returns:
        Tuple of (north, south, east, west) in WGS84
    """
    bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]
    return (bounds[3], bounds[1], bounds[2], bounds[0])  # N, S, E, W
