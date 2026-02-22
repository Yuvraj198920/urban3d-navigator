"""
Stage 7: Export to GeoJSON

Writes processed GeoDataFrames to compact GeoJSON files
with coordinate precision control.
"""

import json
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
    # After baking, strip bridge/layer from properties (they're now in geometry).
    if layer_name == "roads":
        def _add_z(coords, z: float):
            if isinstance(coords[0], (list, tuple)):
                return [_add_z(c, z) for c in coords]
            return [coords[0], coords[1], z]  # replace or add Z

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
                z_m = layer_val * 6.0  # 6 m per OSM layer level
                feature["geometry"]["coordinates"] = _add_z(
                    feature["geometry"]["coordinates"], z_m
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
