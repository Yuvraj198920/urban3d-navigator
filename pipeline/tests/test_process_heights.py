"""Tests for the height processing ETL stage."""
import pytest
import geopandas as gpd
from shapely.geometry import box


def _make_buildings(**kwargs) -> gpd.GeoDataFrame:
    """Helper: create a minimal buildings GeoDataFrame."""
    defaults = {
        "geometry": [box(0, 0, 0.001, 0.001)],
        "building_type": ["residential"],
        "name": [None],
        "height_osm": [None],
        "levels": [None],
    }
    defaults.update(kwargs)
    return gpd.GeoDataFrame(defaults, crs="EPSG:4326")


class TestProcessHeights:
    """Tests for process_heights()."""

    def test_osm_height_used_first(self):
        """When OSM height tag exists, it should be the primary source."""
        from pipeline.stages.process_heights import process_heights

        gdf = _make_buildings(height_osm=[15.0])
        result = process_heights(gdf)

        assert result.iloc[0]["height"] == 15.0
        assert result.iloc[0]["height_source"] == "osm"

    def test_levels_fallback(self):
        """When no OSM height but levels exist, use levels * 3m."""
        from pipeline.stages.process_heights import process_heights

        gdf = _make_buildings(levels=[4])
        result = process_heights(gdf)

        assert result.iloc[0]["height"] == 12.0  # 4 * 3.0
        assert result.iloc[0]["height_source"] == "levels"

    def test_default_fallback(self):
        """When no height data at all, use default (9m)."""
        from pipeline.stages.process_heights import process_heights

        gdf = _make_buildings()
        result = process_heights(gdf)

        assert result.iloc[0]["height"] == 9.0
        assert result.iloc[0]["height_source"] == "default"

    def test_height_clamped_to_max(self):
        """Heights above MAX_HEIGHT_M should be clamped."""
        from pipeline.stages.process_heights import process_heights
        from pipeline.config import MAX_HEIGHT_M

        gdf = _make_buildings(height_osm=[999.0])
        result = process_heights(gdf)

        assert result.iloc[0]["height"] == MAX_HEIGHT_M

    def test_height_clamped_to_min(self):
        """Heights below MIN_HEIGHT_M should be clamped."""
        from pipeline.stages.process_heights import process_heights
        from pipeline.config import MIN_HEIGHT_M

        gdf = _make_buildings(height_osm=[0.5])
        result = process_heights(gdf)

        assert result.iloc[0]["height"] == MIN_HEIGHT_M

    def test_height_source_column_present(self):
        """Output must include height_source column."""
        from pipeline.stages.process_heights import process_heights

        gdf = _make_buildings()
        result = process_heights(gdf)

        assert "height_source" in result.columns
        assert "height" in result.columns
