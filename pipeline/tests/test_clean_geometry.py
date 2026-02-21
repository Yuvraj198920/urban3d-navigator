"""Tests for geometry validation stage."""
import pytest
import geopandas as gpd
from shapely.geometry import box, Polygon


class TestCleanGeometries:
    """Tests for clean_geometries()."""

    def test_removes_empty_geometries(self):
        """Empty geometries should be dropped."""
        from pipeline.stages.clean_geometry import clean_geometries

        gdf = gpd.GeoDataFrame(
            {"geometry": [box(0, 0, 1, 1), Polygon()], "name": ["a", "b"]},
            crs="EPSG:4326",
        )
        result = clean_geometries(gdf)
        assert len(result) == 1

    def test_preserves_valid_geometries(self):
        """Valid geometries should pass through unchanged."""
        from pipeline.stages.clean_geometry import clean_geometries

        gdf = gpd.GeoDataFrame(
            {"geometry": [box(0, 0, 1, 1), box(1, 1, 2, 2)]},
            crs="EPSG:4326",
        )
        result = clean_geometries(gdf)
        assert len(result) == 2

    def test_crs_is_epsg_4326(self):
        """Output CRS should always be EPSG:4326."""
        from pipeline.stages.clean_geometry import clean_geometries

        gdf = gpd.GeoDataFrame(
            {"geometry": [box(0, 0, 1, 1)]},
            crs="EPSG:4326",
        )
        result = clean_geometries(gdf)
        assert result.crs.to_epsg() == 4326
