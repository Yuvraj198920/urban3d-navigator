"""
Stage: Fetch OSM Points of Interest (POIs)

Downloads amenity / tourism / shop features from OpenStreetMap via osmnx
and classifies them into broad display categories.

Categories and their OSM tag sources:
  food          – amenity: restaurant, cafe, bar, pub, fast_food, ice_cream
  healthcare    – amenity: hospital, clinic, pharmacy, doctors, dentist
  education     – amenity: school, university, college, kindergarten, library
  finance       – amenity: bank, atm, bureau_de_change
  accommodation – tourism: hotel, hostel, guest_house, motel, apartment
  culture       – tourism: museum, gallery, theatre, cinema; amenity: theatre, cinema
  shopping      – shop: supermarket, mall, convenience, bakery, butcher, clothes
"""

from __future__ import annotations

import osmnx as ox
import geopandas as gpd
import pandas as pd

from pipeline.config import OSM_TIMEOUT, OSM_MAX_QUERY_AREA

# ── Category mapping ─────────────────────────────────────────────────────────
# Each entry: (tag_key, tag_value) → category label
_AMENITY_TO_CATEGORY: dict[str, str] = {
    # Food & drink
    "restaurant":   "food",
    "cafe":         "food",
    "bar":          "food",
    "pub":          "food",
    "fast_food":    "food",
    "ice_cream":    "food",
    "biergarten":   "food",
    # Healthcare
    "hospital":     "healthcare",
    "clinic":       "healthcare",
    "pharmacy":     "healthcare",
    "doctors":      "healthcare",
    "dentist":      "healthcare",
    # Education
    "school":       "education",
    "university":   "education",
    "college":      "education",
    "kindergarten": "education",
    "library":      "education",
    # Finance
    "bank":         "finance",
    "atm":          "finance",
    "bureau_de_change": "finance",
}

_TOURISM_TO_CATEGORY: dict[str, str] = {
    "hotel":       "accommodation",
    "hostel":      "accommodation",
    "guest_house": "accommodation",
    "motel":       "accommodation",
    "apartment":   "accommodation",
    "museum":      "culture",
    "gallery":     "culture",
    "theatre":     "culture",
}

_SHOP_CATEGORIES = {
    "supermarket": "shopping",
    "mall":        "shopping",
    "convenience": "shopping",
    "bakery":      "shopping",
    "butcher":     "shopping",
    "clothes":     "shopping",
    "shoes":       "shopping",
    "electronics": "shopping",
    "florist":     "shopping",
    "hairdresser": "shopping",
}


def _fetch_tag_group(
    bbox: tuple[float, float, float, float],
    tag_key: str,
    tag_values: list[str],
    category_map: dict[str, str],
    tag_col: str,
) -> gpd.GeoDataFrame | None:
    """Fetch features for one tag key and assign categories."""
    tags = {tag_key: tag_values}
    try:
        gdf = ox.features_from_bbox(bbox=bbox, tags=tags)
    except Exception:
        return None

    if gdf.empty:
        return None

    # Use centroid for polygons so every feature is a Point.
    # Project to UTM zone 32N (covers northern Italy) for accurate centroids,
    # then reproject back to WGS84.
    gdf = gdf.copy()
    gdf = gdf.to_crs("EPSG:32632")
    gdf["geometry"] = gdf.geometry.centroid
    gdf = gdf.to_crs("EPSG:4326")

    # Assign category
    if tag_col in gdf.columns:
        gdf["category"] = gdf[tag_col].map(category_map).fillna("other")
        gdf["amenity_tag"] = gdf[tag_col].astype(str)
    else:
        gdf["category"] = "other"
        gdf["amenity_tag"] = tag_key

    return gdf


def fetch_pois(bbox: tuple[float, float, float, float]) -> gpd.GeoDataFrame:
    """
    Fetch all POIs in bbox and return a clean GeoDataFrame of Points.

    Args:
        bbox: (north, south, east, west) in WGS84

    Returns:
        GeoDataFrame with columns:
          geometry    – Point (WGS84)
          name        – string or ""
          category    – one of: food, healthcare, education, finance,
                        accommodation, culture, shopping, other
          amenity_tag – raw OSM tag value (e.g. "restaurant")
    """
    ox.settings.timeout = OSM_TIMEOUT
    ox.settings.max_query_area_size = OSM_MAX_QUERY_AREA

    frames: list[gpd.GeoDataFrame] = []

    # ── Amenity features ────────────────────────────────────────────────
    amenity_gdf = _fetch_tag_group(
        bbox,
        tag_key="amenity",
        tag_values=list(_AMENITY_TO_CATEGORY.keys()),
        category_map=_AMENITY_TO_CATEGORY,
        tag_col="amenity",
    )
    if amenity_gdf is not None:
        frames.append(amenity_gdf)

    # ── Tourism features ────────────────────────────────────────────────
    tourism_gdf = _fetch_tag_group(
        bbox,
        tag_key="tourism",
        tag_values=list(_TOURISM_TO_CATEGORY.keys()),
        category_map=_TOURISM_TO_CATEGORY,
        tag_col="tourism",
    )
    if tourism_gdf is not None:
        frames.append(tourism_gdf)

    # ── Shop features ───────────────────────────────────────────────────
    shop_gdf = _fetch_tag_group(
        bbox,
        tag_key="shop",
        tag_values=list(_SHOP_CATEGORIES.keys()),
        category_map=_SHOP_CATEGORIES,
        tag_col="shop",
    )
    if shop_gdf is not None:
        frames.append(shop_gdf)

    if not frames:
        # Return empty GeoDataFrame with correct schema
        return gpd.GeoDataFrame(
            columns=["geometry", "name", "category", "amenity_tag"],
            geometry="geometry",
            crs="EPSG:4326",
        )

    combined = gpd.GeoDataFrame(pd.concat(frames, ignore_index=True), crs="EPSG:4326")

    # Normalise name column
    if "name" not in combined.columns:
        combined["name"] = ""
    combined["name"] = combined["name"].fillna("").astype(str)

    # Drop duplicates that ended up with identical geometries (osmnx sometimes
    # returns the same node for multiple tag queries)
    combined = combined.drop_duplicates(subset=["geometry"]).reset_index(drop=True)

    # Final column selection
    keep = ["geometry", "name", "category", "amenity_tag"]
    for col in keep:
        if col not in combined.columns:
            combined[col] = ""
    return combined[keep].copy()
