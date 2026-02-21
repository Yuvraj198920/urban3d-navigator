"""
Stage 5: Fetch Road Network

Downloads the road/path network from OSM and classifies into visual hierarchy.
"""

import osmnx as ox
import geopandas as gpd

from pipeline.config import OSM_TIMEOUT


# Visual hierarchy mapping
ROAD_HIERARCHY: dict[str, str] = {
    "motorway": "major",
    "trunk": "major",
    "primary": "major",
    "secondary": "minor",
    "tertiary": "minor",
    "residential": "minor",
    "footway": "path",
    "cycleway": "path",
    "path": "path",
    "pedestrian": "path",
}

WIDTH_MAP: dict[str, int] = {"major": 3, "minor": 2, "path": 1, "other": 1}


def fetch_road_network(
    bbox: tuple[float, float, float, float],
) -> gpd.GeoDataFrame:
    """
    Fetch road network from OSM as LineString GeoDataFrame.

    Args:
        bbox: (north, south, east, west) in WGS84

    Returns:
        GeoDataFrame with geometry, highway, name, road_class, line_width
    """
    ox.settings.timeout = OSM_TIMEOUT

    G = ox.graph_from_bbox(bbox=bbox, network_type="all", simplify=True)
    gdf_edges = ox.graph_to_gdfs(G, nodes=False, edges=True)

    # Keep relevant columns (handle missing gracefully)
    keep = ["geometry", "highway", "name"]
    for col in keep:
        if col not in gdf_edges.columns:
            gdf_edges[col] = None

    gdf_edges = gdf_edges[keep].reset_index(drop=True)

    return classify_roads(gdf_edges)


def classify_roads(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Classify roads into visual categories and assign widths.

    Categories: major, minor, path, other
    """
    gdf = gdf.copy()

    # highway can be a list (e.g. ['residential', 'tertiary']); take first
    def _first(val):
        if isinstance(val, list):
            return val[0] if val else None
        return val

    highway_flat = gdf["highway"].apply(_first)
    gdf["road_class"] = highway_flat.map(ROAD_HIERARCHY).fillna("other")
    gdf["line_width"] = gdf["road_class"].map(WIDTH_MAP)

    return gdf
