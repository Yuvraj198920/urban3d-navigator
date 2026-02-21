"""Tests for data validation stage."""
import pytest
import geopandas as gpd
from shapely.geometry import box


class TestValidateBuildingData:
    """Tests for validate_building_data()."""

    def test_valid_data_passes(self):
        """Well-formed data should not raise."""
        from pipeline.stages.validate import validate_building_data

        gdf = gpd.GeoDataFrame(
            {
                "geometry": [box(0, 0, 1, 1)],
                "height": [10.0],
                "height_source": ["osm"],
                "building_type": ["residential"],
            },
            crs="EPSG:4326",
        )
        # Should not raise
        validate_building_data(gdf)

    def test_missing_height_column_raises(self):
        """Missing 'height' column should raise ValueError."""
        from pipeline.stages.validate import validate_building_data

        gdf = gpd.GeoDataFrame(
            {
                "geometry": [box(0, 0, 1, 1)],
                "height_source": ["osm"],
            },
            crs="EPSG:4326",
        )
        with pytest.raises(ValueError):
            validate_building_data(gdf)

    def test_missing_height_source_raises(self):
        """Missing 'height_source' column should raise ValueError."""
        from pipeline.stages.validate import validate_building_data

        gdf = gpd.GeoDataFrame(
            {
                "geometry": [box(0, 0, 1, 1)],
                "height": [10.0],
            },
            crs="EPSG:4326",
        )
        with pytest.raises(ValueError):
            validate_building_data(gdf)
