# Sprint Plan & Development Roadmap

## Phase 1: Proof of Concept (Bolzano) - 2-3 weeks

### Sprint 1: Setup & ETL Pipeline (Week 1)

**Goal**: Get Bolzano data processed and validated

#### Backend Tasks
- [ ] **Day 1-2**: Environment setup
  - Create Python virtual environment
  - Install dependencies: osmnx, geopandas, jupyter
  - Set up project structure
  - Initialize Git repository

- [ ] **Day 3-4**: Implement ETL pipeline
  - Code all pipeline stages (fetch, transform, export)
  - Test on Bolzano old town bbox
  - Validate output GeoJSON files
  - Generate metadata.json
  - Add `height_source` column to output (`osm` | `overture` | `levels` | `default`) so frontend can render unknown-height buildings differently

- [ ] **Day 4** (parallel): Fetch terrain DEM for Bolzano
  - Source: Mapzen Terrain Tiles or AWS Terrain Tiles (free)
  - Enable MapLibre GL `terrain` with DEM tile URL
  - Validate: Bolzano valley + Alps visible in scene

- [ ] **Day 5**: Data quality validation
  - Visual inspection in QGIS
  - Check height distributions
  - Confirm buildings with `height_source=default` render as wireframe-only outlines (not solid)
  - Identify any geometry issues
  - Document data coverage stats

**Deliverables**:
- ✅ Working Python ETL script
- ✅ Bolzano GeoJSON dataset (buildings + roads)
- ✅ Data quality report
- ✅ Jupyter notebook for exploration

**Success Criteria**:
- Buildings: 1,500-2,000 features
- File size: <1.5 MB total
- All geometries valid
- Heights present for 100% of buildings (via fallbacks)

---

### Sprint 2: Frontend Foundation (Week 2)

**Goal**: Display Bolzano in 3D with basic controls

#### Frontend Tasks
- [ ] **Day 1**: Project setup + define the wow moment
  - Initialize Vite + React + TypeScript project
  - Install deck.gl, MapLibre GL, dependencies
  - Set up linting and formatting
  - Configure TypeScript strict mode
  - **Define cinematic intro**: on first load, auto-orbit camera smoothly around the city center for 5 seconds before handing control to user — this sells spatial value immediately
  - **Confirm color scheme**: test at least 2 palettes on paper before writing a line of render code

- [ ] **Day 2-3**: Core rendering
  - Implement Map3D component with deck.gl
  - Create building extrusion layer
    - Buildings with `height_source=default`: render as wireframe outline only (not solid), visually honest about data gaps
    - Buildings with known heights: solid fill with height-based color gradient
  - Create road network layer
  - Add base map (MapLibre)
  - Enable MapLibre terrain DEM (Bolzano valley must be visible)
  - Add cinematic intro camera sweep on first load
  - Add landmark height label for Bolzano Cathedral (65m) as trust anchor
  - Copy GeoJSON files to public/data/

- [ ] **Day 4**: State management & data loading
  - Set up Zustand store
  - Implement useMapData hook
  - Handle loading states
  - Wire up metadata to viewport

- [ ] **Day 5**: Basic controls
  - Camera controls component
  - Layer visibility toggles
  - Reset view button
  - 2D/3D toggle

**Deliverables**:
- ✅ Running React app on localhost
- ✅ 3D buildings rendered correctly
- ✅ Roads visible between buildings
- ✅ Smooth camera controls

**Success Criteria**:
- Scene renders in < 2 seconds
- Free orbit/tilt/zoom works intuitively
- Can distinguish landmark buildings by height
- Frame rate > 30fps on dev machine

---

### Sprint 3: Polish & Validation (Week 3)

**Goal**: Validate proof of concept, prepare for demo

#### Tasks
- [ ] **Day 1-2**: Interactivity
  - Building hover tooltips
  - Click to select building
  - Info panel with building details
  - Highlight selected building

- [ ] **Day 3**: Visual refinement
  - Height-based color gradient
  - Improve lighting/shadows
  - Adjust line widths and opacity
  - Test dark mode base map

- [ ] **Day 4**: Performance testing + user research
  - Measure render times
  - Profile layer updates
  - Test on different browsers
  - Document performance baselines
  - **User research session**: watch 1 real person (colleague or Bolzano local) use the tool for 20 minutes without guidance — note every moment of confusion
  - Document top 3 UX friction points for Sprint 4 backlog

- [ ] **Day 5**: Documentation & demo prep
  - Write README.md
  - Record demo video / screenshots
  - Document known issues
  - Prepare Phase 2 backlog

**Deliverables**:
- ✅ Polished Bolzano demo
- ✅ Demo video/screenshots
- ✅ Performance report
- ✅ Phase 2 requirements doc

**Success Criteria**:
- User can recognize landmarks intuitively
- Scene "feels" correct compared to real Bolzano
- Ready to show to stakeholders
- Clear path to Phase 2

---

## Phase 2: Web Application MVP (Milan District) - 3-4 weeks

### Sprint 4: Scale Up Data (Week 4)

**Goal**: Process larger dataset, implement tiling if needed

#### Tasks
- [ ] Choose Milan test area (e.g., Brera district)
- [ ] Run ETL pipeline for Milan district
- [ ] Evaluate file sizes - tiling needed?
- [ ] If > 5MB: Implement spatial tiling (1km × 1km)
- [ ] Test viewport-based tile loading
- [ ] Benchmark load times

**Target**: 10-20k buildings, <3s load time

---

### Sprint 5: Advanced Filtering (Week 5)

**Goal**: Semantic filtering and UI enhancements

#### Tasks
- [ ] Implement height range filter (slider)
- [ ] Building type filter (residential/commercial/...)
- [ ] Road type filter (major/minor/paths)
- [ ] Search by building name
- [ ] Filter UI component
- [ ] GPU-side filtering optimization
- [ ] **Reframe filters around user goals, not data attributes** — e.g. "Highlight tallest buildings", "Show only navigable streets", not raw sliders labelled with technical field names
- [ ] Add service worker for offline caching of visited GeoJSON tiles (moved up from Phase 4 — dramatically improves repeat-visit load time)

---

### Sprint 6: POI Integration (Week 6)

**Goal**: Add points of interest layer

#### Tasks
- [ ] Fetch OSM POIs (amenities, shops) in ETL
- [ ] Create POI IconLayer
- [ ] Design icon set (or use open source)
- [ ] Category-based coloring
- [ ] POI search and filter
- [ ] Click to show POI details

---

### Sprint 7: Mobile & Deployment (Week 7)

**Goal**: Make responsive, deploy to web

#### Tasks
- [ ] Mobile-responsive layout
- [ ] Touch gesture controls
- [ ] Test on iOS Safari, Android Chrome
- [ ] Set up Netlify/Vercel deployment
- [ ] Configure CI/CD (GitHub Actions)
- [ ] Deploy production build
- [ ] Custom domain (optional)

**Deliverable**: Live URL with Milan district demo

---

## Phase 3: Production Features - 4-6 weeks

### Sprint 8-9: User Accounts (Weeks 8-9)

- [ ] Set up Supabase (or similar)
- [ ] User authentication (email/social)
- [ ] Save favorite locations
- [ ] Saved camera views
- [ ] Share location via URL
- [ ] User preferences (color schemes, units)

---

### Sprint 10-11: Real-time GPS (Weeks 10-11)

- [ ] Browser geolocation API integration
- [ ] Real-time positioning indicator
- [ ] "Fly to my location" button
- [ ] Compass orientation
- [ ] Location permission handling
- [ ] GPS accuracy indicator

---

### Sprint 12: Multi-city Support (Week 12)

- [ ] City selector dropdown
- [ ] Generate datasets for 5-10 major cities
- [ ] Tile index federation
- [ ] Dynamic data loading per city
- [ ] City metadata catalog

---

### Sprint 13: Optimization & Polish (Week 13)

- [ ] Performance audit
- [ ] Implement LOD (Level of Detail) system
- [ ] Lazy load distant tiles
- [ ] Add loading skeletons
- [ ] Error boundaries
- [ ] Analytics integration (optional)

---

### Sprint 14: Launch Prep (Week 14)

- [ ] Full QA pass
- [ ] Cross-browser testing
- [ ] Write user guide
- [ ] Create landing page
- [ ] Social media assets
- [ ] Beta tester recruitment
- [ ] Launch! 🚀

---

## Phase 3.5: EURAC Research Track (Parallel, Weeks 10-14)

> **Strategic note**: These use cases have institutional buyers with budgets and leverage your existing EURAC expertise. Running this in parallel with Phase 3 consumer features opens a faster path to real-world funding and validation.

### Research Use Cases to Prototype
- [ ] **Urban heat island overlay** — building density + height correlation with temperature data
- [ ] **Solar potential layer** — roof area estimation from LoD1 footprints (quick win with existing data)
- [ ] **Flood risk visualization** — building height above ground level in low-lying areas
- [ ] **Evacuation routing** — combine road network + building volumes for escape path planning
- [ ] **Street canyon analysis** — building:height / street:width ratio (wind, shadow, air quality)
- [ ] Produce a short research brief for EURAC colleagues showing tool capability
- [ ] Identify 1 active EURAC project the tool could plug into directly

---

## Phase 4: Extended Features (Future)

### Potential Features
- **Route planning overlay**: Integrate with routing APIs
- **AR preview mode**: WebXR for in-situ viewing
- **Time of day lighting**: Dynamic shadows
- **Historical data**: Compare building heights over time
- **Custom datasets**: Upload your own GeoJSON
- **API for developers**: Embed 3D maps in other apps

---

## Key Milestones

| Milestone | Date | Deliverable |
|-----------|------|-------------|
| **M1: PoC Complete** | End of Week 3 | Bolzano demo working |
| **M2: MVP Launch** | End of Week 7 | Milan district live on web |
| **M3: Beta Launch** | End of Week 14 | Multi-city, user accounts |
| **M4: Public v1.0** | TBD | Full feature set, stable |

---

## Resource Requirements

### Development Team (Ideal)
- **1 Backend/Geospatial Engineer** (You) - 20-30 hrs/week
- **1 Frontend Developer** - 20-30 hrs/week (Phase 2+)
- **1 Designer** (Part-time) - 5-10 hrs/week (Phase 3)

### Infrastructure Costs (Estimated)
| Service | Phase 1-2 | Phase 3 | Phase 4 |
|---------|-----------|---------|---------|
| Hosting (Netlify/Vercel) | Free | Free | $0-20/mo |
| CDN/Storage (Cloudflare R2) | Free | Free | $5-15/mo |
| Database (Supabase) | - | Free | $0-25/mo |
| Domain | - | $12/year | $12/year |
| **Total** | **$0/mo** | **$0-2/mo** | **$5-60/mo** |

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|-----------|
| **Performance degrades with large datasets** | Implement tiling early in Phase 2, benchmark continuously |
| **GeoJSON breaks at Milan scale (200k+ buildings)** | Design tile loading system architecture in Sprint 4 Week 1, before writing any code — don't discover the problem mid-sprint |
| **OSM data gaps in target cities** | Always test data quality before committing to a city |
| **Mobile WebGL limitations** | Progressive enhancement, detect GPU capabilities |
| **Browser compatibility issues** | Test on all major browsers weekly |
| **Default-height buildings mislead users** | Always render `height_source=default` buildings as wireframe outlines, never solid fill |

### Project Risks
| Risk | Mitigation |
|------|-----------|
| **Scope creep** | Strict sprint boundaries, MVP-first mentality |
| **Solo developer burnout** | Realistic 20-30 hr/week estimate, buffer weeks |
| **Low user adoption** | Start with personal use + research communities |

---

## Definition of Done (Sprint Level)

Each sprint is "done" when:
- [ ] All tasks completed or explicitly deferred
- [ ] Code committed to main branch
- [ ] Manual testing passed
- [ ] Documentation updated
- [ ] Demo-ready (can show to external person)
- [ ] No critical bugs
- [ ] Sprint retrospective completed

---

## Communication & Tracking

### Tools
- **GitHub Issues** - Task tracking
- **GitHub Projects** - Sprint board (Kanban)
- **README.md updates** - User-facing changes
- **Weekly dev log** - Progress notes (optional but recommended)

### Sprint Cadence
- **Sprint length**: 1 week
- **Sprint planning**: Monday
- **Daily standup**: Optional (solo dev)
- **Sprint review**: Friday
- **Sprint retro**: Friday

---

## Next Steps (This Week)

1. ✅ Review all planning documents
2. ✅ Approve project scope and timeline
3. [ ] Set up GitHub repository
4. [ ] Create Sprint 1 issues
5. [ ] Begin Day 1 tasks (environment setup)

---

**Document Version**: 1.0  
**Last Updated**: February 21, 2026  
**Owner**: Project Manager / Technical Lead