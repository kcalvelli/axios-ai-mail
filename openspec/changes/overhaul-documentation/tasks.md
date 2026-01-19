# Tasks: Overhaul Documentation

## Phase 1: Audit & Archive (Prerequisites)

- [ ] 1.1 Create `docs/archive/` directory for outdated content
- [ ] 1.2 Move outdated dev-notes to archive:
  - `PHASE1_COMPLETE.md`
  - `PHASE2_COMPLETE.md`
  - `PHASE2_PROGRESS.md`
  - `PHASE3_COMPLETE.md`
  - `SESSION_SUMMARY.md`
  - `BACKEND_API_COMPLETE.md`
  - `DEPLOYMENT_SUCCESS.md`
  - `MODULE_TEST.md`
- [ ] 1.3 Delete `QUICKSTART.md` (root) after content merged
- [ ] 1.4 Delete `QUICKSTART_WEB.md` (root) after content merged
- [ ] 1.5 Update `openspec/project.md` to reflect current architecture (remove TUI/notmuch references)

## Phase 2: Core Documentation

### README.md Rewrite

- [ ] 2.1 Update feature list (mark completed roadmap items)
- [ ] 2.2 Update architecture diagram (current stack)
- [ ] 2.3 Fix port references (8080 not 8000)
- [ ] 2.4 Add desktop screenshot to hero section
- [ ] 2.5 Add mobile screenshot to features section
- [ ] 2.6 Update roadmap (accurate status)
- [ ] 2.7 Simplify installation section (link to quickstart)

### docs/QUICKSTART.md (New Unified Guide)

- [ ] 2.8 Write prerequisites section
- [ ] 2.9 Write Gmail OAuth setup with step-by-step
- [ ] 2.10 Write IMAP setup section
- [ ] 2.11 Write "First Sync" section
- [ ] 2.12 Write "Access Web UI" section
- [ ] 2.13 Add troubleshooting quick tips
- [ ] 2.14 Add screenshots of setup flow

### docs/USER_GUIDE.md (New)

- [ ] 2.15 Write introduction and overview
- [ ] 2.16 Document desktop interface:
  - Sidebar navigation
  - Message list
  - Reading pane (split view)
  - Message detail (full page)
  - Compose window
- [ ] 2.17 Document mobile interface:
  - Navigation drawer
  - Message list (compact cards)
  - Swipe gestures (left=delete, right=select)
  - Selection mode
  - Bulk action bar
- [ ] 2.18 Document keyboard shortcuts (desktop):
  - j/k navigation
  - Enter to open
  - r to reply
  - f to forward
  - u to toggle read
  - # to delete
  - o to toggle split view
  - ? for help
- [ ] 2.19 Document theme switching (light/dark/auto)
- [ ] 2.20 Document PWA installation
- [ ] 2.21 Document offline behavior
- [ ] 2.22 Add relevant screenshots throughout

### docs/CONFIGURATION.md (New)

- [ ] 2.23 Document all Nix module options
- [ ] 2.24 Document Gmail account configuration
- [ ] 2.25 Document IMAP account configuration
- [ ] 2.26 Document AI configuration options
- [ ] 2.27 Merge AI_MODELS.md content (model recommendations)
- [ ] 2.28 Document custom tags configuration
- [ ] 2.29 Document multi-account setup
- [ ] 2.30 Document systemd services (sync timer, web service)
- [ ] 2.31 Add example configurations

## Phase 3: Visual Documentation

- [ ] 3.1 Create `docs/screenshots/` directory structure
- [ ] 3.2 Collect desktop screenshots:
  - Message list (light mode)
  - Message list (dark mode)
  - Split pane view
  - Message detail
  - Compose window
  - Sidebar expanded
  - Tag filtering active
  - Bulk selection
- [ ] 3.3 Collect mobile screenshots:
  - Message list (light mode)
  - Message list (dark mode)
  - Message detail
  - Drawer open
  - Swipe gesture (delete)
  - Swipe gesture (select)
  - Selection mode with action bar
- [ ] 3.4 Optimize screenshots (compress, consistent sizing)
- [ ] 3.5 Embed screenshots in relevant documentation

## Phase 4: Developer Documentation

### docs/DEVELOPMENT.md (New)

- [ ] 4.1 Document development environment setup
- [ ] 4.2 Document backend development (Python/FastAPI)
- [ ] 4.3 Document frontend development (React/Vite)
- [ ] 4.4 Document database migrations
- [ ] 4.5 Document testing procedures
- [ ] 4.6 Document building/packaging

### docs/ARCHITECTURE.md (New)

- [ ] 4.7 Document system architecture overview
- [ ] 4.8 Document provider abstraction layer
- [ ] 4.9 Document sync engine flow
- [ ] 4.10 Document AI classification pipeline
- [ ] 4.11 Document database schema
- [ ] 4.12 Document API design

### CONTRIBUTING.md (Update/Create)

- [ ] 4.13 Document code style guidelines
- [ ] 4.14 Document PR process
- [ ] 4.15 Document OpenSpec workflow
- [ ] 4.16 Document commit message conventions

## Phase 5: Cleanup & Validation

- [ ] 5.1 Remove `docs/AI_MODELS.md` (merged into CONFIGURATION.md)
- [ ] 5.2 Update `docs/dev-notes/README.md` or remove if empty
- [ ] 5.3 Verify all internal links work
- [ ] 5.4 Verify all screenshots display correctly
- [ ] 5.5 Read through all docs as a new user (validation)
- [ ] 5.6 Update CLAUDE.md if needed

## Parallel Work

The following can be done in parallel:
- Phase 2 tasks (README, QUICKSTART, USER_GUIDE, CONFIGURATION)
- Phase 4 tasks (after Phase 2 is drafted)

## Dependencies

- Tasks 3.2-3.5 depend on user providing screenshots
- Tasks 2.4, 2.5, 2.14, 2.22 depend on screenshots being available
- Phase 5 depends on all other phases being complete
