# 3D Urban Navigation Context - Project Overview

## Project Name
**Urban3D Navigator** (working title)

## Vision Statement
Create a lightweight 3D spatial context tool that helps users mentally anchor themselves in complex urban environments by visualizing building volumes, road networks, and POIs in an intuitive, clean 3D space — addressing the orientation gap left by current 2D navigation apps.

---

## Problem Statement

### Current Pain Point
Google Maps and Apple Maps optimize for routing efficiency but fail at spatial comprehension. In dense urban areas (Milan's Navigli, Tokyo's Shinjuku, Manhattan), 2D top-down maps flatten vertical cues that humans naturally use for orientation:
- The tall corner building landmark
- Narrow passages between towers
- Low arcade roofs vs. high-rise facades
- Spatial relationship between POIs and building volumes

### User Need
"When navigating complex urban areas with multiple stores, buildings, and small roads, I need a real-world spatial feel — just vector geometries with height — to understand where I'm going before I get there."

---

## Solution Approach

### Core Concept
A **contextual 3D spatial awareness layer** that provides:
- Building footprints + height extrusion (LoD1)
- Road network geometry clearly visible between volumes
- POI placement in 3D context
- Free orbit/tilt camera controls
- Clean, wireframe/matte aesthetic (not photorealistic)

### What Differentiates This
| Feature | Google/Apple 3D | Urban3D Navigator |
|---------|----------------|-------------------|
| Visual style | Texture-heavy photorealistic | Clean wireframe/matte volumes |
| Viewing | Locked tilt angles | Free orbit/rotation |
| Data load | Huge, slow | Lightweight vectors only |
| Programmability | Closed | Open, queryable, filterable |
| Purpose | Navigation routing | Spatial comprehension |

---

## Success Criteria

### Stage 1 - Proof of Concept (Bolzano)
- ✅ Buildings render with correct relative heights
- ✅ Road network fills gaps naturally between volumes
- ✅ Camera orbits freely, scene reads intuitively
- ✅ Performance stays smooth (<16ms render time)
- ✅ User can recognize landmarks/piazzas from 3D view

### Stage 2 - Scale Up (Milan District)
- ✅ Handle 10-20k buildings without performance degradation
- ✅ Semantic filtering works (residential vs commercial)
- ✅ POI integration displays correctly
- ✅ Mobile responsive

### Stage 3 - Production Ready
- ✅ User accounts and saved locations
- ✅ Real-time GPS positioning
- ✅ Shareable 3D scenes via URL
- ✅ Deployed and accessible via web

---

## Project Phases

### Phase 0: Planning & Architecture (1 week)
- Finalize tech stack decisions
- Set up development environment
- Define data pipeline architecture
- Create detailed sprint backlog

### Phase 1: Proof of Concept - Bolzano (2-3 weeks)
- Build ETL pipeline: OSM → GeoDataFrame → deck.gl
- Implement basic 3D visualization (buildings + roads)
- Validate data quality and height fallback logic
- Jupyter notebook prototype

### Phase 2: Web Application MVP - Milan District (3-4 weeks)
- Convert to standalone web app (React + deck.gl)
- Implement camera controls and user interactions
- Add POI overlay layer
- Semantic filtering UI (building types, road types)

### Phase 3: Production Features (4-6 weeks)
- User authentication and preferences
- Real-time GPS integration
- Area selection/search functionality
- Mobile optimization
- Deploy to production

### Phase 4: Extended Features (Future)
- Route planning overlay
- AR preview mode (WebXR)
- Multi-city coverage expansion
- Time-of-day dynamic shadows
- Custom dataset upload

> **Note**: Offline mode (service worker caching) moved to Phase 2 Sprint 5 — too valuable to defer.

---

## Key Stakeholders

### Development Team
- **Solo Developer (You)** - Full-stack: Python ETL, React/deck.gl frontend, DevOps
  - Estimated capacity: 20-30 hrs/week
  - Strengths: Geospatial (EURAC background), Python, data engineering
  - Growth areas: deck.gl rendering, WebGL performance tuning
- **Future hires (Phase 3+)**: Frontend specialist, part-time designer

### End Users

**Persona 1 — "The Expat Explorer"**
- Recently moved to Bolzano/Milan, doesn't know the city layout
- Opens tool before walking to a new area to build a mental map
- Needs: quick load, intuitive orbit, recognizable landmark buildings

**Persona 2 — "The Urban Planner"**
- Works at EURAC or municipality, needs spatial context for reports
- Wants to filter by building type, export screenshots, share URLs
- Needs: semantic filtering, data accuracy indicators, stable URLs

**Persona 3 — "The Tourist"**
- 30 seconds of attention, wants a "wow" moment
- Cinematic intro sells the tool; if the first 5 seconds are boring, they leave
- Needs: zero onboarding, beautiful defaults, mobile-friendly

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Incomplete building height data | High | Medium | Fallback hierarchy (OSM → Overture → levels × 3m → 9m default); render defaults as wireframe |
| Performance issues with large datasets | Medium | High | Incremental loading, spatial indexing, LOD system |
| GeoJSON breaks at Milan scale (200k+ buildings) | High | High | Design tile loader in Sprint 4 before writing Milan code |
| Default-height buildings mislead users | Medium | Medium | Wireframe-only rendering for `height_source=default`; never solid fill |
| Mobile browser WebGL limitations | Medium | Medium | Progressive enhancement, detect capabilities |
| Solo developer burnout | Medium | High | Realistic 20-30 hr/week cap, buffer weeks, strict sprint scope |
| User adoption (niche use case) | Medium | Low | Start with research/personal use, EURAC research track opens institutional path |

---

## Technical Constraints

- **No native mobile app** (Phase 1-3) - Web-first, PWA later
- **No real-time server** initially - Static pre-processed data
- **No photorealistic rendering** - Keep lightweight
- **OSM/Overture data only** - No proprietary datasets

---

## Next Steps

1. ~~Review and approve this overview~~ ✅
2. ~~Review technical architecture document~~ ✅
3. ~~Set up GitHub repository~~ ✅ ([urban3d-navigator](https://github.com/Yuvraj198920/urban3d-navigator))
4. ~~Create Sprint 1 issues~~ ✅ (40 issues, 4 milestones, project board)
5. [ ] Begin Sprint 1 Day 1 (Python venv + project structure)

### Key Dates
| Milestone | Target Date |
|-----------|-------------|
| M1: PoC Complete (Bolzano) | March 14, 2026 |
| M2: MVP Launch (Milan) | April 11, 2026 |
| M3: Beta Launch | May 30, 2026 |
| M4: Public v1.0 | TBD |

---

**Document Version**: 1.2  
**Last Updated**: February 21, 2026  
**Owner**: Product/Technical Lead