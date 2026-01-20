# Tasks: Overhaul Documentation

> **STATUS: COMPLETE**
>
> All documentation overhauled: README rewritten, core docs created (QUICKSTART, USER_GUIDE, CONFIGURATION, ARCHITECTURE, DEVELOPMENT), screenshots collected, old dev-notes archived.

## Phase 1: Audit & Archive (Prerequisites)

- [x] 1.1 Create `docs/archive/` directory for outdated content
- [x] 1.2 Move outdated dev-notes to archive (PHASE1_COMPLETE, PHASE2_COMPLETE, etc.)
- [x] 1.3 Delete root QUICKSTART.md (merged into docs/QUICKSTART.md)
- [x] 1.4 Delete root QUICKSTART_WEB.md (merged into docs/QUICKSTART.md)
- [x] 1.5 Update `openspec/project.md` to reflect current architecture

## Phase 2: Core Documentation

### README.md Rewrite

- [x] 2.1 Update feature list with current capabilities
- [x] 2.2 Update architecture diagram (React + FastAPI stack)
- [x] 2.3 Fix port references (8080)
- [x] 2.4 Add desktop screenshot to hero section
- [x] 2.5 Add mobile screenshots to features section
- [x] 2.6 Update roadmap with accurate status
- [x] 2.7 Simplify installation section (link to quickstart)

### docs/QUICKSTART.md

- [x] 2.8 Write prerequisites section
- [x] 2.9 Write Gmail OAuth setup with step-by-step
- [x] 2.10 Write IMAP setup section
- [x] 2.11 Write "First Sync" section
- [x] 2.12 Write "Access Web UI" section
- [x] 2.13 Add troubleshooting quick tips

### docs/USER_GUIDE.md

- [x] 2.14 Write introduction and overview
- [x] 2.15 Document desktop interface (sidebar, message list, reading pane, compose)
- [x] 2.16 Document mobile interface (drawer, swipe gestures, selection mode)
- [x] 2.17 Document keyboard shortcuts
- [x] 2.18 Document theme switching
- [x] 2.19 Document PWA installation
- [x] 2.20 Document offline behavior

### docs/CONFIGURATION.md

- [x] 2.21 Document all Nix module options
- [x] 2.22 Document Gmail account configuration
- [x] 2.23 Document IMAP account configuration
- [x] 2.24 Document AI configuration options
- [x] 2.25 Merge AI_MODELS.md content (archived original)
- [x] 2.26 Document custom tags configuration
- [x] 2.27 Document multi-account setup
- [x] 2.28 Document systemd services
- [x] 2.29 Add example configurations

## Phase 3: Visual Documentation

- [x] 3.1 Create `docs/screenshots/` directory
- [x] 3.2 Collect desktop screenshots (11 total - dark/light modes, various views)
- [x] 3.3 Collect mobile screenshots (drawer, message thread)
- [x] 3.4 Embed screenshots in documentation

## Phase 4: Developer Documentation

### docs/DEVELOPMENT.md

- [x] 4.1 Document development environment setup
- [x] 4.2 Document backend development (Python/FastAPI)
- [x] 4.3 Document frontend development (React/Vite)
- [x] 4.4 Document testing procedures
- [x] 4.5 Document building/packaging

### docs/ARCHITECTURE.md

- [x] 4.6 Document system architecture overview
- [x] 4.7 Document provider abstraction layer
- [x] 4.8 Document sync engine flow
- [x] 4.9 Document AI classification pipeline
- [x] 4.10 Document database schema
- [x] 4.11 Document API design
- [x] 4.12 Document async provider sync (pending operations queue)

### CONTRIBUTING.md

- [x] 4.13 Document code style guidelines
- [x] 4.14 Document PR process
- [x] 4.15 Document OpenSpec workflow

## Phase 5: Cleanup & Validation

- [x] 5.1 Archive AI_MODELS.md (merged into CONFIGURATION.md)
- [x] 5.2 Update docs/archive/README.md
- [x] 5.3 Verify all internal links work
- [x] 5.4 Verify all screenshots display correctly

## Documentation Files Created/Updated

- README.md - Completely rewritten with screenshots
- docs/QUICKSTART.md - New unified setup guide
- docs/USER_GUIDE.md - New comprehensive user guide
- docs/CONFIGURATION.md - New configuration reference
- docs/ARCHITECTURE.md - New architecture deep-dive (includes async provider sync)
- docs/DEVELOPMENT.md - New development guide
- CONTRIBUTING.md - Created with guidelines
- docs/CLI_REFERENCE.md - CLI documentation
- docs/screenshots/* - 11 screenshots (desktop/mobile, light/dark)
- docs/archive/* - Old dev-notes archived
