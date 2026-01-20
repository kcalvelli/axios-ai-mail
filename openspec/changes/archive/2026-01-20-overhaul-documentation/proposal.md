# Proposal: Overhaul Documentation

## Summary

Complete overhaul of all project documentation to be comprehensive, accurate, and visually enriched with screenshots of both desktop and mobile interfaces.

## Problem Statement

The current documentation has several issues:

1. **Outdated Content**
   - `QUICKSTART.md` references manual Python testing and old setup flows
   - `QUICKSTART_WEB.md` references old ports (8000 vs 8080) and outdated steps
   - `README.md` roadmap shows items as incomplete that are actually done
   - `openspec/project.md` still references TUI/notmuch architecture (no longer used)

2. **Missing Visual Documentation**
   - No screenshots of the web UI
   - No mobile interface documentation
   - No visual guides for setup flows

3. **Scattered Information**
   - `docs/dev-notes/` contains session logs mixed with useful guides
   - Multiple quickstart files with overlapping/conflicting information
   - Architecture diagrams are text-only

4. **Incomplete Coverage**
   - No comprehensive feature guide
   - No troubleshooting guide for common mobile/PWA issues
   - No keyboard shortcuts documentation
   - No swipe gestures documentation (mobile)

## Proposed Solution

### Phase 1: Audit & Archive

1. Archive outdated dev-notes to `docs/archive/`
2. Remove duplicate quickstart files (consolidate into one)
3. Update `openspec/project.md` to reflect current architecture

### Phase 2: Core Documentation Rewrite

1. **README.md** - Complete rewrite with:
   - Updated architecture diagram
   - Current feature list with screenshots
   - Accurate roadmap
   - Updated troubleshooting section

2. **docs/QUICKSTART.md** - Single unified quickstart:
   - Gmail OAuth setup (with screenshots)
   - IMAP setup
   - First sync
   - Accessing the web UI

3. **docs/USER_GUIDE.md** - Comprehensive user guide:
   - Desktop features (with screenshots)
   - Mobile features (with screenshots)
   - Keyboard shortcuts
   - Swipe gestures
   - Theme customization
   - PWA installation

4. **docs/CONFIGURATION.md** - Complete configuration reference:
   - All Nix options documented
   - AI model recommendations (merge from AI_MODELS.md)
   - Custom tags
   - Multi-account setup

### Phase 3: Visual Documentation

1. **docs/screenshots/** - Organized screenshot library:
   - `desktop/` - Desktop UI screenshots
   - `mobile/` - Mobile UI screenshots
   - `setup/` - Setup wizard screenshots

2. All major UI features documented with visuals:
   - Message list (light/dark mode)
   - Message detail view
   - Tag filtering
   - Bulk selection
   - Compose window
   - Settings/accounts

### Phase 4: Developer Documentation

1. **docs/DEVELOPMENT.md** - Developer setup guide
2. **docs/ARCHITECTURE.md** - System architecture deep-dive
3. **CONTRIBUTING.md** - Contribution guidelines

## Success Criteria

- [ ] Single source of truth for each topic (no duplicate guides)
- [ ] All screenshots current and showing actual UI
- [ ] Desktop and mobile views documented
- [ ] All keyboard shortcuts documented
- [ ] All swipe gestures documented
- [ ] Nix configuration fully documented
- [ ] README serves as effective landing page
- [ ] New users can set up in <15 minutes following docs

## Out of Scope

- Video tutorials (future consideration)
- Internationalization/translations
- API reference documentation (auto-generated from OpenAPI)

## Dependencies

- User to provide screenshots of current desktop and mobile UI
- Screenshots should cover light and dark modes

## Estimated Effort

- Phase 1: 1 hour
- Phase 2: 3-4 hours
- Phase 3: 1-2 hours (after screenshots provided)
- Phase 4: 2 hours

**Total: ~8 hours**
