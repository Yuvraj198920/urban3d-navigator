"""
Stage 3: Fetch Overture Buildings (Gap Filling)

Queries Overture Maps Foundation cloud Parquet files via DuckDB
to fill height gaps in OSM data.
"""

import duckdb
import geopandas as gpd

from pipeline.config import OVERTURE_S3_BASE


def fetch_overture_buildings(
    bbox: tuple[float, float, float, float],
) -> gpd.GeoDataFrame:
    """
    Query Overture Maps for buildings in bbox.

    Uses DuckDB spatial extension to query cloud Parquet files.

    Args:
        bbox: (north, south, east, west) in WGS84

    Returns:
        GeoDataFrame with geometry, height, name, building_type
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
    FROM read_parquet('{OVERTURE_S3_BASE}')
    WHERE bbox.xmin >= {west}
      AND bbox.xmax <= {east}
      AND bbox.ymin >= {south}
      AND bbox.ymax <= {north};
    """

    conn = duckdb.connect()
    result = conn.execute(query).fetchdf()
    conn.close()

    gdf = gpd.GeoDataFrame(result, geometry="geometry", crs="EPSG:4326")
    return gdf


def merge_osm_overture(
    osm_gdf: gpd.GeoDataFrame,
    overture_gdf: gpd.GeoDataFrame,
) -> gpd.GeoDataFrame:
    """
    Merge OSM and Overture data, prioritizing OSM heights.

    Strategy:
    1. Keep all OSM buildings as-is
    2. For buildings missing height, find nearest Overture building
    3. If within 5m distance, use Overture height

    Args:
        osm_gdf: OSM buildings (primary)
        overture_gdf: Overture buildings (gap fill)

    Returns:
        OSM GeoDataFrame with 'height_overture' column added where gaps filled
    """
    osm_gdf = osm_gdf.copy()
    osm_gdf["height_overture"] = None

    if overture_gdf.empty:
        return osm_gdf

    # Buildings missing OSM height
    import pandas as pd

    missing_height = osm_gdf[pd.to_numeric(osm_gdf["height_osm"], errors="coerce").isna()]

    if missing_height.empty:
        return osm_gdf

    # Spatial join: nearest neighbour within 5m
    # Convert to projected CRS for accurate distance
    local_crs = missing_height.estimate_utm_crs()
    missing_proj = missing_height.to_crs(local_crs)
    overture_proj = overture_gdf.to_crs(local_crs)

    joined = gpd.sjoin_nearest(
        missing_proj,
        overture_proj[["geometry", "height"]],
        how="left",
        max_distance=5,  # meters
        distance_col="match_distance",
    )

    # Write matched Overture heights back to the original OSM dataframe
    osm_gdf.loc[joined.index, "height_overture"] = joined["height"].values

    return osm_gdf
