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

- [ ] **Day 5**: Data quality validation
  - Visual inspection in QGIS
  - Check height distributions
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
- [ ] **Day 1**: Project setup
  - Initialize Vite + React + TypeScript project
  - Install deck.gl, MapLibre GL, dependencies
  - Set up linting and formatting
  - Configure TypeScript strict mode

- [ ] **Day 2-3**: Core rendering
  - Implement Map3D component with deck.gl
  - Create building extrusion layer
  - Create road network layer
  - Add base map (MapLibre)
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

- [ ] **Day 4**: Performance testing
  - Measure render times
  - Profile layer updates
  - Test on different browsers
  - Document performance baselines

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

## Phase 4: Extended Features (Future)

### Potential Features
- **Offline mode**: Service worker + IndexedDB cache
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
| **OSM data gaps in target cities** | Always test data quality before committing to a city |
| **Mobile WebGL limitations** | Progressive enhancement, detect GPU capabilities |
| **Browser compatibility issues** | Test on all major browsers weekly |

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