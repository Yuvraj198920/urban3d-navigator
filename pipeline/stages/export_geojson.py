"""
Stage 7: Export to GeoJSON

Writes processed GeoDataFrames to compact GeoJSON files
with coordinate precision control.
"""

import json
import math
from pathlib import Path

import geopandas as gpd

from pipeline.config import GEOJSON_COORD_PRECISION


def export_geojson(
    gdf: gpd.GeoDataFrame,
    output_path: Path,
    layer_name: str,
) -> Path:
    """
    Export GeoDataFrame to optimized GeoJSON.

    Optimizations:
    - Coordinate precision reduced to ~10 cm accuracy
    - Only necessary properties included
    - Compact JSON (no whitespace)

    Args:
        gdf: Processed GeoDataFrame
        output_path: Destination file path
        layer_name: 'buildings' or 'roads' (selects which columns to keep)

    Returns:
        Path to the written file
    """
    # Select minimal columns per layer type
    if layer_name == "buildings":
        keep_cols = ["geometry", "height", "height_source", "building_type", "name"]
    elif layer_name == "roads":
        # bridge + layer are used to bake Z elevation; stripped from props after
        keep_cols = ["geometry", "highway", "road_class", "name", "line_width", "bridge", "layer"]
    else:
        raise ValueError(f"Unknown layer_name: {layer_name}")

    # Keep only columns that exist
    keep_cols = [c for c in keep_cols if c in gdf.columns]
    gdf_export = gdf[keep_cols].copy()

    # Fill null names with empty string (reduces GeoJSON size vs null entries)
    if "name" in gdf_export.columns:
        gdf_export["name"] = gdf_export["name"].fillna("")

    # Serialize
    geojson_str = gdf_export.to_json(drop_id=True)
    geojson_data = json.loads(geojson_str)

    # For roads: lift bridge/elevated segments by baking Z into coordinates.
    # OSM `layer` tag = vertical level relative to ground; 1 level ≈ 6 m.
    # A cosine taper is applied so Z ramps from 0 at each endpoint up to the
    # full deck height at the midpoint — this makes bridge segments connect
    # smoothly to the flat ground roads on either side.
    # After baking, strip bridge/layer from exported properties.
    if layer_name == "roads":
        def _taper_coords(coords: list, z_max: float) -> list:
            """Set Z using a cosine taper (0 → z_max → 0).

            Most OSM bridge edges are 2-node LineStrings after graph
            simplification, so we first ensure at least 5 evenly-spaced
            points by linear interpolation before applying the taper.
            """
            # Ensure minimum point density so the taper is visible
            MIN_PTS = 5
            if len(coords) < MIN_PTS:
                interp = []
                for j in range(MIN_PTS):
                    t = j / (MIN_PTS - 1)
                    # lerp between first and last coord (handles 2-pt case)
                    lon = coords[0][0] + t * (coords[-1][0] - coords[0][0])
                    lat = coords[0][1] + t * (coords[-1][1] - coords[0][1])
                    interp.append([lon, lat])
                coords = interp

            n = len(coords)
            result = []
            for i, pt in enumerate(coords):
                t = i / (n - 1) if n > 1 else 0.5
                # cosine taper: 0 at endpoints, z_max at midpoint (t=0.5)
                z = z_max * 0.5 * (1 - math.cos(math.pi * 2 * min(t, 1 - t)))
                result.append([pt[0], pt[1], z])
            return result

        for feature in geojson_data["features"]:
            props = feature["properties"]
            bridge = props.get("bridge")
            try:
                layer_val = int(props.get("layer") or 0)
            except (ValueError, TypeError):
                layer_val = 0
            # bridge=yes with no layer tag implies layer 1
            if bridge and str(bridge).lower() not in ("", "no") and layer_val == 0:
                layer_val = 1
            if layer_val > 0:
                z_max = layer_val * 6.0  # 6 m per OSM layer level
                feature["geometry"]["coordinates"] = _taper_coords(
                    feature["geometry"]["coordinates"], z_max
                )
            # Remove baked / internal attributes from exported properties
            props.pop("bridge", None)
            props.pop("layer", None)

    # Round coordinates
    precision = GEOJSON_COORD_PRECISION

    def _round_coords(coords):
        if isinstance(coords[0], (list, tuple)):
            return [_round_coords(c) for c in coords]
        return [round(c, precision) for c in coords]

    for feature in geojson_data["features"]:
        geom = feature["geometry"]
        geom["coordinates"] = _round_coords(geom["coordinates"])

    # Write compact JSON
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(geojson_data, f, separators=(",", ":"))

    file_size_mb = output_path.stat().st_size / 1_000_000
    print(f"  Exported {layer_name}: {len(gdf)} features, {file_size_mb:.2f} MB")

    return output_path
