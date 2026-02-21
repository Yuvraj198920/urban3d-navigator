"""
Stage 4: Height Processing & Fallbacks

Calculates final building heights using a fallback hierarchy:
1. building:height (OSM surveyed)
2. Overture estimated height
3. building:levels × floor_height
4. Default height

Also tracks the source of each height for frontend rendering decisions.
"""

import pandas as pd
import geopandas as gpd

from pipeline.config import DEFAULT_HEIGHT_M, FLOOR_HEIGHT_M, MIN_HEIGHT_M, MAX_HEIGHT_M


def process_heights(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Calculate final building heights using fallback hierarchy.

    Adds columns:
    - height: final numeric height in meters
    - height_source: 'osm' | 'overture' | 'levels' | 'default'

    Buildings with height_source='default' should render as wireframe-only
    in the frontend to be visually honest about data gaps.

    Args:
        gdf: GeoDataFrame with height_osm, height_overture (optional), levels columns

    Returns:
        GeoDataFrame with height + height_source columns, intermediate columns dropped
    """
    gdf = gdf.copy()

    # Priority 1: OSM height
    gdf["height"] = pd.to_numeric(gdf["height_osm"], errors="coerce")

    # Priority 2: Overture height (if column exists)
    if "height_overture" in gdf.columns:
        mask = gdf["height"].isna() & gdf["height_overture"].notna()
        gdf.loc[mask, "height"] = pd.to_numeric(
            gdf.loc[mask, "height_overture"], errors="coerce"
        )

    # Priority 3: Levels × floor height
    mask = gdf["height"].isna() & gdf["levels"].notna()
    gdf.loc[mask, "height"] = (
        pd.to_numeric(gdf.loc[mask, "levels"], errors="coerce") * FLOOR_HEIGHT_M
    )

    # Priority 4: Default
    gdf["height"] = gdf["height"].fillna(DEFAULT_HEIGHT_M)

    # Sanity clamp
    gdf["height"] = gdf["height"].clip(lower=MIN_HEIGHT_M, upper=MAX_HEIGHT_M)

    # ── Track height source ─────────────────────────────
    gdf["height_source"] = "default"

    mask_osm = pd.to_numeric(gdf["height_osm"], errors="coerce").notna()
    gdf.loc[mask_osm, "height_source"] = "osm"

    if "height_overture" in gdf.columns:
        mask_overture = gdf["height_overture"].notna() & ~mask_osm
        gdf.loc[mask_overture, "height_source"] = "overture"

    mask_levels = gdf["levels"].notna() & ~mask_osm
    if "height_overture" in gdf.columns:
        mask_levels = mask_levels & ~gdf["height_overture"].notna()
    gdf.loc[mask_levels, "height_source"] = "levels"

    # Drop intermediate columns
    gdf = gdf.drop(columns=["height_osm", "height_overture", "levels"], errors="ignore")

    return gdf
