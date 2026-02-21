"""Shared pytest fixtures for pipeline tests."""
import pytest
import sys
from pathlib import Path

# Ensure the project root (parent of `pipeline/`) is on sys.path.
# __file__ is pipeline/tests/conftest.py → .parent.parent.parent = 3d_map_navigation/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
