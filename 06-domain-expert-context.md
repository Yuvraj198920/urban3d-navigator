# Domain Expert Considerations & GIS Context

## Urban Planning & Spatial Cognition Context

### Why 3D Matters for Navigation

**Spatial Cognition Research**: Humans navigate using **landmark-based mental maps**, not abstract coordinates. Three key types of spatial knowledge:

1. **Landmark knowledge** - Recognition of distinctive features
2. **Route knowledge** - Sequences of turns and directions
3. **Survey knowledge** - Bird's-eye mental map

Current 2D navigation apps provide route knowledge excellently but fail at landmark and survey knowledge in dense urban areas. Your 3D approach addresses this gap.

**Reference**: Lynch, K. (1960). *The Image of the City* - foundational work on urban legibility.

---

## Level of Detail (LoD) Standards

Your project targets **LoD1** - the sweet spot for navigation context.

| LoD Level | Description | Use Case | Data Requirement |
|-----------|-------------|----------|------------------|
| **LoD0** | Flat footprints | 2D maps | Polygon only |
| **LoD1** | Extruded boxes (your target) | City context, navigation | Footprint + height |
| **LoD2** | Roof shapes | Urban planning | Roof geometry |
| **LoD3** | Facade details | Architecture viz | Detailed surveying |
| **LoD4** | Interior spaces | Indoor navigation | BIM data |

LoD1 provides **90% of spatial orientation value** at **<5% of data complexity** compared to LoD3.

**Standard**: CityGML LoD specification (OGC standard)

---

## Data Quality Considerations

### OSM Building Height Coverage by Region

Based on research and OSM analysis[web:31][web:40]:

| Region | Height Coverage | Quality | Notes |
|--------|----------------|---------|-------|
| **Germany** | 40-60% | High | Strong OSM community |
| **Austria** | 35-50% | High | Includes South Tyrol |
| **Netherlands** | 30-50% | Medium-High | BAG integration |
| **Italy (North)** | 20-35% | Medium | Better in major cities |
| **Italy (South)** | 10-20% | Low | Sparse coverage |
| **France** | 15-30% | Medium | Improving with imports |
| **UK** | 20-40% | Medium | Variable by city |
| **USA** | 15-25% | Low-Medium | Overture fills gaps better here |

**Implication**: Bolzano (South Tyrol/German influence) has excellent OSM quality. Milan is good for major buildings but benefits from Overture gap-filling.

---

## Height Estimation Methods

### 1. Direct OSM Survey Data (`building:height`)
- **Accuracy**: ±1-2m typically
- **Source**: Manual survey or government import
- **Coverage**: 10-30% globally
- **Reliability**: High (when present)

### 2. Floor Count Heuristic (`building:levels × 3m`)
- **Accuracy**: ±2-5m
- **Source**: OSM tagging (easier than measuring height)
- **Coverage**: 30-60% in urban areas
- **Reliability**: Medium (depends on local standards)
- **3m assumption**: Valid for Europe, may need adjustment elsewhere
  - Europe: 3.0m typical
  - North America: 3.5m for commercial, 3.0m residential
  - Asia: 3.0-3.5m modern, 2.8m older

### 3. Overture ML Estimates (LiDAR-derived)
- **Accuracy**: ±3-8m
- **Source**: Machine learning on USGS LiDAR data[web:22]
- **Coverage**: 6M+ buildings globally, best in USA
- **Reliability**: Medium (varies by source data quality)

### 4. Default Fallback (9m = 3 floors)
- **Accuracy**: ±10-30m (rough estimate)
- **Source**: Reasonable assumption for urban context
- **When used**: <5% of buildings (after above methods)
- **Purpose**: Prevent visual gaps, not precision

**Recommendation**: Document which buildings use which method in metadata for transparency.

---

## Geometry Validation Issues

### Common OSM Geometry Problems

1. **Invalid polygons** (self-intersections)
   - **Frequency**: 1-5% of OSM buildings
   - **Fix**: `buffer(0)` trick (standard PostGIS approach)
   - **Side effect**: Very minor coordinate shifts (<1mm)

2. **Duplicate nodes**
   - **Frequency**: Rare but occurs
   - **Fix**: GeoPandas simplification

3. **Multipolygons** (buildings with courtyards)
   - **Frequency**: Common in European old towns
   - **Handling**: deck.gl handles natively

4. **Buildings as points** (errors in OSM)
   - **Frequency**: <1% of results
   - **Fix**: Filter out non-polygons

**Best Practice**: Always run `.is_valid` check and report invalid count in data quality report.

---

## Coordinate Systems & Projections

### CRS for Different Stages

| Stage | CRS | Why |
|-------|-----|-----|
| **OSM fetch** | EPSG:4326 (WGS84) | Native OSM format |
| **Spatial operations** | Local UTM (e.g., EPSG:32632 for Italy) | Accurate area/distance |
| **Export to frontend** | EPSG:4326 (WGS84) | deck.gl expects lat/lon |

**Your workflow**:
- Fetch in EPSG:4326
- Optional: transform to UTM for area calculations (if needed)
- Export in EPSG:4326 for web

**Precision**: 6 decimal places in lat/lon = ~10cm accuracy (sufficient for visualization)

---

## Road Network Hierarchy

### OSM Highway Tag Classification

Relevant for your road visualization:

| OSM `highway` Value | Visual Class | Typical Width | Priority |
|---------------------|-------------|---------------|----------|
| `motorway` | Major | 3-4 lanes | 1 |
| `trunk` | Major | 2-3 lanes | 2 |
| `primary` | Major | 2 lanes | 3 |
| `secondary` | Minor | 2 lanes | 4 |
| `tertiary` | Minor | 1-2 lanes | 5 |
| `residential` | Minor | 1 lane | 6 |
| `footway` | Path | Walking | 7 |
| `cycleway` | Path | Cycling | 8 |
| `pedestrian` | Path | Walking | 7 |
| `path` | Path | Walking/hiking | 9 |

**Visualization strategy**:
- Major roads: Visible from all zoom levels, high contrast
- Minor roads: Visible at medium zoom
- Paths: Visible only at high zoom or when explicitly enabled

---

## European Urban Typologies

Understanding building patterns helps interpret your visualizations:

### Bolzano (Your Test Case)
- **Old Town**: Medieval street pattern, 3-5 story buildings (9-15m), compact
- **Arcades**: Ground floor covered walkways (distinctive feature)
- **Modern districts**: 1960s-80s blocks, 6-10 stories (18-30m)
- **Landmark**: Cathedral/Duomo (distinctive tower)

### Milan Districts (Phase 2 Targets)
- **Brera**: 4-6 stories (12-18m), uniform height, narrow streets
- **Porta Venezia**: Mixed 4-8 stories (12-24m), tree-lined avenues
- **Duomo area**: Wide variation, 3-10+ stories, historic + modern mix
- **Porta Nuova**: Modern towers, 20-30+ stories (60-100m+), distinct skyline

**Design implication**: Color gradients should handle both low-variation (Brera) and high-variation (Porta Nuova) distributions effectively.

---

## Semantic Building Classification

### OSM `building` Tag Values

Useful for filtering/coloring by type:

| Value | Meaning | Typical Height | Color Suggestion |
|-------|---------|---------------|------------------|
| `residential` | Housing | 9-30m | Blue tones |
| `commercial` | Shops, offices | 9-40m | Orange tones |
| `retail` | Street-level shops | 6-12m | Warm colors |
| `industrial` | Factories | 6-15m | Gray/neutral |
| `civic` | Government | 12-30m | Purple |
| `religious` | Churches | 15-50m | Gold/yellow |
| `school` | Education | 9-18m | Green |
| `hospital` | Medical | 18-40m | Red/pink |
| `yes` | Generic/unknown | Variable | Default gradient |

**Coverage**: `building=yes` is 60-80% of all buildings (generic). Specific types are bonus detail.

**UI Feature Idea**: "Color by type" vs "Color by height" toggle.

---

## POI Categories for Context

### Relevant OSM `amenity` Tags for Navigation Context

Phase 2 POI integration should prioritize landmarks:

**High Priority** (orientation landmarks):
- `place_of_worship` - Churches, mosques (tall, distinctive)
- `town_hall` - Government buildings
- `university` - Campus buildings
- `hospital` - Large medical centers
- `train_station` / `bus_station` - Transport hubs

**Medium Priority** (daily navigation):
- `restaurant` / `cafe` - Dense in commercial areas
- `bank` / `post_office` - Common destinations
- `pharmacy` - Frequent searches
- `supermarket` - Daily needs

**Low Priority** (clutter risk):
- `bench`, `waste_basket` - Too granular for city-scale

**Data volume**: Expect 5-10 POIs per 1000m² in dense urban cores.

---

## Performance Benchmarks from Similar Projects

### Comparable 3D Urban Visualization Projects

| Project | Dataset Size | Load Time | Render FPS | Notes |
|---------|--------------|-----------|------------|-------|
| **OSM Buildings** | Berlin (300k buildings) | 8-12s | 30-60fps | MVT tiles[web:16] |
| **Kepler.gl** | NYC (1M buildings) | 15-20s | 20-40fps | GPU-accelerated[web:13] |
| **CesiumJS** | Full Earth | Streaming | 30-60fps | 3D Tiles format |
| **Your Target** | Bolzano (2k) | <2s | >30fps | GeoJSON direct |
| **Your Target** | Milan dist (20k) | <5s | >30fps | Tiled GeoJSON |

**Key insight**: GeoJSON is fine up to ~50k features. Beyond that, switch to MVT (Mapbox Vector Tiles) format.

---

## Accessibility Considerations

Your tool should be usable by:

### Visual Accessibility
- **Color blindness**: Don't rely solely on color - use height variation, labels
- **High contrast mode**: Support system preferences
- **Zoom/pan controls**: Ensure keyboard navigation works

### Cognitive Accessibility
- **Simple controls**: Minimize UI clutter
- **Clear labels**: Building names, heights in simple language
- **Familiar patterns**: Use standard map interaction (pinch/zoom, drag/rotate)

### Technical Accessibility
- **Low-end devices**: Detect GPU capabilities, degrade gracefully
- **Slow networks**: Progressive loading, show low-res first
- **Screen readers**: Provide text alternative for map content (Phase 3)

---

## Legal & Data Licensing

### OSM Data License: ODbL (Open Database License)

**Requirements**:
- ✅ **Attribution**: Display "© OpenStreetMap contributors"
- ✅ **Share-Alike**: Derived data must use ODbL
- ✅ **Open Access**: Can't restrict access to OSM-derived data

**Your compliance**:
- Add attribution in app footer
- If you improve OSM data, contribute back (encouraged)
- GeoJSON exports from ETL can be shared openly

### Overture Maps: CDLA Permissive 2.0

**Requirements**:
- ✅ **Attribution**: Credit Overture Maps Foundation
- ❌ **No Share-Alike**: More permissive than ODbL
- ✅ **Commercial Use**: Explicitly allowed

**Your compliance**:
- Add "Data from Overture Maps" attribution
- Can mix with OSM data freely

### Base Map Tiles

**Options**:
- **OSM Carto** (openstreetmap.org tiles): Free but usage limits apply
- **CARTO Basemaps**: Free tier available, attribution required
- **MapLibre demo tiles**: Development only
- **Your choice**: Use CARTO Positron (as in docs) - clean, free, well-documented

---

## Research Applications

Given your EURAC background, potential research use cases:

### Environmental Monitoring
- Visualize urban heat island effects (building density + height)
- Solar potential analysis (roof areas from LoD2 in future)
- Urban growth tracking (compare historical OSM snapshots)

### Disaster Management
- Evacuation route planning (building heights + road network)
- Flood risk visualization (height above ground)
- Earthquake vulnerability (building age + height correlation)

### Transportation Planning
- Street canyon analysis (building height : street width ratio)
- Pedestrian flow optimization
- Bike route planning (avoid tall buildings = less wind protection)

### Heritage Documentation
- Digital twin of historic city centers
- Before/after reconstruction (e.g., post-earthquake)
- Architectural style clustering

---

## Standards & Specifications to Follow

1. **OGC CityGML** - City model standard (LoD definitions)
2. **OGC 3D Tiles** - Streaming 3D geospatial (Phase 4 consideration)
3. **ISO 19107** - Spatial schema (geometry types)
4. **OSM Tagging Standards** - Community conventions

---

## Validation Against Ground Truth

How to verify your output is "correct":

### Visual Validation
1. **Street View comparison**: Google/Apple Street View vs your 3D scene
2. **Satellite imagery**: Overlay satellite on top-down view
3. **Local knowledge**: You know Bolzano - does it "feel" right?

### Quantitative Validation
1. **Landmark buildings**: Check known building heights (e.g., Duomo)
   - Bolzano Cathedral: ~65m spire
   - Check if your data shows this as tallest
2. **Average heights**: Compare your avg vs. city statistics if available
3. **Road network**: OSM vs official city transport maps

### Crowdsourced Validation
1. **User feedback**: "Report incorrect height" feature (Phase 3)
2. **OSM editing**: If you find errors, update OSM directly
3. **Community validation**: Share with local OSM community

---

## Domain-Specific Recommendations

### For Bolzano Specifically
- **Arcades detection**: Buildings with `building:part=arcade` - visualize ground floor differently?
- **Alpine context**: Terrain backdrop (Phase 4) - Bolzano is in a valley
- **Bilingual labels**: Names in German/Italian (OSM has `name:de`, `name:it`)

### For Milan Scale-Up
- **Navigli canals**: Visualize water features as blue "negative space"
- **Metro stations**: POI priority - major orientation landmarks
- **Fashion district quadrilatero**: Dense, uniform heights - good test of visual clarity

---

## References & Further Reading

1. **OSM Building Wiki**: https://wiki.openstreetmap.org/wiki/Buildings
2. **Overture Buildings Spec**: https://docs.overturemaps.org/guides/buildings/
3. **CityGML Standard**: https://www.ogc.org/standards/citygml
4. **deck.gl Performance Guide**: https://deck.gl/docs/developer-guide/performance
5. **Spatial Cognition**: Golledge, R. (1999). *Wayfinding Behavior*

---

**Document Version**: 1.0  
**Last Updated**: February 21, 2026  
**Owner**: Domain Expert / GIS Specialist