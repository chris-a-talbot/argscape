# Custom Shapefiles and Coordinate Reference Systems

This guide covers advanced geographic configuration for ARGscape's 3D spatial visualizations, including custom shapefiles, coordinate reference systems (CRS), and troubleshooting common issues.

## Overview

When visualizing tree sequences with spatial data in `mode="spatial_3d"`, ARGscape needs to understand:

1. **Where your sample locations are** - the coordinate reference system (CRS) of your tree sequence's location data
2. **What geographic background to display** - either a built-in base or your own shapefile
3. **How to transform coordinates** - ensuring locations and shapefiles align properly

## Shapefile Input Types

The `shapefile` parameter accepts multiple input formats, giving you flexibility in how you provide geographic data.

### File Path (String or Path)

The simplest approach is to provide a path to a shapefile:

```python
import argscape

# String path
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile="path/to/countries.shp"
)

# Path object
from pathlib import Path
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile=Path("data/europe.shp")
)
```

ARGscape supports several file formats:
- **Shapefile** (`.shp`) - requires accompanying `.dbf`, `.shx` files
- **GeoJSON** (`.geojson`, `.json`)
- **GeoPackage** (`.gpkg`)
- **Zipped shapefile** (`.zip`) - common for downloaded data

### GeoDataFrame

For more control, load and process your shapefile with geopandas first:

```python
import geopandas as gpd
import argscape

# Load and filter to specific region
gdf = gpd.read_file("world_countries.shp")
europe = gdf[gdf["continent"] == "Europe"]

# Simplify geometry for faster rendering
europe_simplified = europe.copy()
europe_simplified["geometry"] = europe.geometry.simplify(0.01)

viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile=europe_simplified
)
```

### GeoJSON Dictionary

You can also provide a GeoJSON dictionary directly:

```python
import argscape

geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
            },
            "properties": {"name": "Study Area"}
        }
    ]
}

viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile=geojson
)
```

## Coordinate Reference Systems

### Understanding CRS in ARGscape

ARGscape uses two CRS-related parameters:

| Parameter | Purpose | When to Use |
|-----------|---------|-------------|
| `location_crs` | CRS of coordinates in your tree sequence | When your locations are not in WGS84 |
| `shapefile_crs` | CRS of your shapefile (override) | When shapefile has missing/wrong CRS |

### The `location_crs` Parameter

This tells ARGscape what coordinate system your tree sequence's sample locations use.

```python
# Locations are in WGS84 (latitude/longitude)
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    location_crs="EPSG:4326"  # WGS84
)

# Locations are in British National Grid
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    location_crs="EPSG:27700",
    shapefile="uk_outline.shp"
)

# Locations are in UTM Zone 33N (central Europe)
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    location_crs="EPSG:32633",
    shapefile="europe.shp"
)
```

### The `shapefile_crs` Parameter

Use this to override or specify a shapefile's CRS when it's missing or incorrect:

```python
# Shapefile is missing CRS metadata but we know it's WGS84
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile="old_data.shp",
    shapefile_crs="EPSG:4326"
)

# Shapefile has wrong CRS encoded - override it
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile="mislabeled_data.shp",
    shapefile_crs="EPSG:3857"  # Actually Web Mercator, not WGS84
)
```

### Automatic CRS Detection

When you don't specify CRS parameters, ARGscape attempts automatic detection:

1. **For shapefiles**: Reads CRS from file metadata (`.prj` file for shapefiles)
2. **For locations**: Analyzes coordinate ranges and patterns

```{warning}
Automatic detection works well for common cases but can fail with:
- Simulations using geographic coordinate ranges
- Small study areas within geographic bounds
- Projected coordinates with small values

When in doubt, explicitly specify `location_crs`.
```

### Common CRS Codes

| EPSG Code | Name | Use Case |
|-----------|------|----------|
| `EPSG:4326` | WGS84 | GPS coordinates, most global datasets |
| `EPSG:3857` | Web Mercator | Web maps (Google, OpenStreetMap) |
| `EPSG:32632` | UTM Zone 32N | Central Europe precise measurements |
| `EPSG:27700` | British National Grid | UK data |
| `EPSG:2154` | Lambert-93 | France |
| `EPSG:32610` | UTM Zone 10N | Western North America |

You can also use PROJ strings:

```python
# PROJ string for custom projection
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    location_crs="+proj=lcc +lat_1=49 +lat_2=77 +lon_0=-95"
)
```

## Built-in Geographic Bases

When you don't provide a custom shapefile, ARGscape offers built-in options via the `geographic_base` parameter:

### `unit_grid` (Default)

A simple 10x10 grid for simulated data without real-world coordinates:

```python
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    geographic_base="unit_grid"
)
```

- **Bounds**: (0, 0) to (1, 1)
- **Best for**: SLiM simulations, msprime with continuous space
- **CRS**: None (unitless)

### `eastern_hemisphere`

Natural Earth land boundaries for Africa, Europe, Asia, and Oceania:

```python
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    geographic_base="eastern_hemisphere",
    location_crs="EPSG:4326"
)
```

- **Bounds**: Longitude -15 to 180, Latitude -60 to 75
- **Best for**: Human population genetics, Old World species
- **CRS**: EPSG:4326 (WGS84)

### `world`

Full world map from Natural Earth:

```python
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    geographic_base="world",
    location_crs="EPSG:4326"
)
```

- **Bounds**: Longitude -180 to 180, Latitude -90 to 90
- **Best for**: Global datasets, species with worldwide distribution
- **CRS**: EPSG:4326 (WGS84)

## Working with Real-World Shapefiles

### Obtaining Shapefiles

Common sources for geographic data:

| Source | URL | Data Types |
|--------|-----|------------|
| Natural Earth | [naturalearthdata.com](https://www.naturalearthdata.com) | Countries, coastlines, rivers |
| GADM | [gadm.org](https://gadm.org) | Administrative boundaries |
| OpenStreetMap | [geofabrik.de](https://download.geofabrik.de) | Roads, buildings, land use |
| DIVA-GIS | [diva-gis.org](https://www.diva-gis.org/gdata) | Country-level administrative data |

### Example: European Human Genetics Study

```python
import geopandas as gpd
import argscape

# Load European countries from Natural Earth
europe = gpd.read_file("ne_10m_admin_0_countries.shp")
europe = europe[europe["CONTINENT"] == "Europe"]

# Simplify for performance (0.01 degrees ~ 1km at equator)
europe["geometry"] = europe.geometry.simplify(0.01)

# Load tree sequence with sample locations
ts = tskit.load("european_samples.trees")

# Visualize
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile=europe,
    location_crs="EPSG:4326",  # Samples have lat/lon coordinates
    temporal_multiplier=15.0,
    spatial_multiplier=200.0
)
viz.show()
```

### Example: Mixing CRS (Transform Required)

```python
import geopandas as gpd
import argscape

# Shapefile is in WGS84
world = gpd.read_file("world.shp")  # EPSG:4326

# But tree sequence locations are in Web Mercator (from a web interface)
ts = tskit.load("web_collected_samples.trees")

# ARGscape handles the transformation
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile=world,
    location_crs="EPSG:3857",  # Tell ARGscape locations are Web Mercator
    # shapefile_crs not needed - world.shp has correct metadata
)
viz.show()
```

## Troubleshooting CRS Mismatches

### Symptom: Samples Don't Appear on Map

**Cause**: Locations and shapefile use different CRS without proper specification.

**Solution**: Check your coordinate ranges and specify CRS explicitly:

```python
import numpy as np

# Examine your tree sequence locations
locations = []
for ind in ts.individuals():
    if len(ind.location) >= 2:
        locations.append(ind.location[:2])

locations = np.array(locations)
print(f"X range: {locations[:, 0].min():.2f} to {locations[:, 0].max():.2f}")
print(f"Y range: {locations[:, 1].min():.2f} to {locations[:, 1].max():.2f}")

# Based on ranges, determine CRS:
# - 0 to 1: unit_grid, no location_crs needed
# - -180 to 180 / -90 to 90: likely EPSG:4326
# - Large values (millions): likely projected CRS
```

### Symptom: Map Appears But Is Wrong Location

**Cause**: Shapefile CRS metadata is incorrect or missing.

**Solution**: Override with `shapefile_crs`:

```python
# Check shapefile's CRS
import geopandas as gpd
gdf = gpd.read_file("mystery_data.shp")
print(f"Shapefile CRS: {gdf.crs}")

# If None or wrong, specify correct CRS
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile="mystery_data.shp",
    shapefile_crs="EPSG:4326"  # Override with correct CRS
)
```

### Symptom: Distorted or Stretched Visualization

**Cause**: Using a projected CRS that distorts at your study area.

**Solution**: Use a local projection or convert to WGS84:

```python
import geopandas as gpd

# Convert shapefile to WGS84 before passing to ARGscape
gdf = gpd.read_file("local_projection.shp")
gdf_wgs84 = gdf.to_crs("EPSG:4326")

viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile=gdf_wgs84,
    location_crs="EPSG:4326"
)
```

### Symptom: "CRS mismatch" or Transform Errors

**Cause**: Incompatible CRS that can't be automatically transformed.

**Solution**: Manually transform your data to a common CRS:

```python
import geopandas as gpd
from pyproj import Transformer

# Transform shapefile
gdf = gpd.read_file("data.shp")
gdf = gdf.to_crs("EPSG:4326")

# Transform tree sequence locations (requires rebuilding)
transformer = Transformer.from_crs("EPSG:32632", "EPSG:4326", always_xy=True)

# Transform your locations before creating the tree sequence
# (This should be done during data preparation)
```

## Performance Considerations

### Simplifying Complex Shapefiles

High-resolution shapefiles can slow rendering:

```python
import geopandas as gpd

# Load detailed shapefile
gdf = gpd.read_file("detailed_boundaries.shp")

# Check complexity
print(f"Original vertices: {sum(len(g.exterior.coords) for g in gdf.geometry if g.geom_type == 'Polygon')}")

# Simplify (tolerance in CRS units - degrees for WGS84)
gdf["geometry"] = gdf.geometry.simplify(tolerance=0.01)  # ~1km at equator

# For very detailed data, use preserve_topology=False for speed
gdf["geometry"] = gdf.geometry.simplify(tolerance=0.05, preserve_topology=False)
```

### Clipping to Study Area

Only load the region you need:

```python
import geopandas as gpd
from shapely.geometry import box

# Define study area bounding box
study_bbox = box(-10, 35, 40, 60)  # Western Europe

# Clip world data to study area
world = gpd.read_file("world.shp")
study_area = world.clip(study_bbox)

viz = argscape.visualize(ts, mode="spatial_3d", shapefile=study_area)
```

## See Also

- {doc}`/python-api/visualize` - Full `visualize()` parameter reference
- {doc}`/tutorials/spatial-3d` - Tutorial on 3D spatial visualizations
- {doc}`performance-tips` - General performance optimization guide
