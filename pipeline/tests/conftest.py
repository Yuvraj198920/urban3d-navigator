"""Shared pytest fixtures for pipeline tests."""
import pytest
import sys
from pathlib import Path

# Ensure pipeline package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
