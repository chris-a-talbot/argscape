# Documentation Refresh Design

## Overview

Refresh the ARGscape documentation to improve structure, visual styling, and navigation. The goal is a cleaner, more professional presentation that moves away from the stock Jupyter Book look.

## Problems Addressed

1. **Python API structure is inconsistent** - `visualize` and `VizResult` are split across pages, but `infer` and `InferResult` are together
2. **Redundant content** - Overview page overlaps with individual function pages
3. **Themes in wrong section** - It's a guide, not an API reference
4. **Stock Jupyter Book appearance** - Generic typography, spacing, and styling
5. **Navigation unclear** - Sections feel out of place, hard to find things

## New Documentation Structure

```
ARGscape Documentation
├── Getting Started
│   ├── Installation
│   ├── Quickstart (notebook)
│   └── Web App vs Python API
│
├── Tutorials
│   ├── Your First Visualization (notebook)
│   ├── 3D Spatial Visualization (notebook)
│   ├── Filtering & Subsetting (notebook)
│   ├── Themes & Styling          ← moved from Python API
│   └── Exporting Figures
│
├── Python API
│   ├── Visualization             ← consolidated (visualize + VizResult)
│   └── Inference                 ← already consolidated (infer + InferResult)
│
├── CLI Reference
│   ├── argscape
│   ├── argscape serve
│   ├── argscape viz
│   ├── argscape infer
│   └── argscape load
│
└── Advanced
    ├── Inference Algorithms
    ├── Shapefiles & CRS
    ├── Performance Tips
    └── Benchmarking              ← moved from top-level section
        ├── Overview
        ├── Running Benchmarks
        ├── Interpreting Results
        └── Datasets
```

### Key Changes

- Remove "Python API Overview" page (redundant)
- Consolidate `visualize.md` + `vizresult.md` → `visualization.md`
- Move `themes.md` from Python API → Tutorials (rename to "Themes & Styling")
- Move entire Benchmarking section under Advanced
- Remove `argscape-benchmark` from CLI Reference (covered in Advanced/Benchmarking)
- 5 top-level sections instead of 6

## Visual Styling

### Typography

| Element | Current | New |
|---------|---------|-----|
| Body font | System default | Inter or IBM Plex Sans |
| Base size | 16px | 17px |
| Line height | ~1.5 | 1.7 |
| Code font | System monospace | JetBrains Mono or Fira Code |
| Heading weight | Default | Slightly lighter, tighter letter-spacing |

### Spacing

- Wider content area
- More margin between sections
- Better padding inside code blocks
- More whitespace above headings
- Consistent vertical rhythm throughout

### Colors

Keep the existing palette but refine:

| Element | Value | Notes |
|---------|-------|-------|
| Accent | `#14E2A8` | ARGscape green - keep as primary accent |
| Background | `#f5f5f7` | Current light gray - keep |
| Links | Muted blue | Less aggressive than default |
| Borders | Soft gray | Subtle, not distracting |
| Code background | Light gray | With rounded corners |

### Components

- **Code blocks**: Rounded corners, subtle background, better padding
- **Admonitions**: Consistent border-radius, softer colors
- **Cards**: Subtle shadows, consistent spacing
- **Tables**: Cleaner borders, better cell padding

## Navigation Improvements

### Sidebar

- Cleaner section dividers (subtle lines vs bold captions)
- More visible active page indicator
- Consistent indentation

### Page-Level

- Clear "Next/Previous" links at page bottom
- Breadcrumbs at top
- "On this page" right sidebar for longer pages

### Header/Footer

- Simplified footer: link to argscape.com, GitHub, citation
- Keep logo, ensure crisp rendering

### Polish

- Smooth hover transitions on links/buttons
- Consistent border-radius across all elements
- Remove cluttered default Jupyter Book elements

## Files to Modify

### Structure Changes

| Action | File |
|--------|------|
| Edit | `docs/book/_toc.yml` |
| Delete | `docs/book/python-api/overview.md` |
| Merge into visualization.md | `docs/book/python-api/vizresult.md` |
| Rename/move | `docs/book/python-api/themes.md` → `docs/book/tutorials/themes-styling.md` |
| Delete | `docs/book/cli-reference/argscape-benchmark.md` |
| Restructure | `docs/book/benchmarking/*` → `docs/book/advanced/benchmarking/*` |

### Content Updates

| File | Changes |
|------|---------|
| `docs/book/python-api/visualize.md` | Rename to `visualization.md`, add VizResult content |
| `docs/book/intro.md` | Update navigation cards to match new structure |
| All files | Update version references (0.6.1 → 0.6.2) |
| All files | Update cross-references to moved pages |

### Styling

| File | Changes |
|------|---------|
| `docs/book/_static/css/liquid-glass.css` | Typography, spacing, color refinements |
| `docs/book/_config.yml` | Add web fonts if using Inter/IBM Plex |

## Implementation Order

1. Update `_toc.yml` with new structure
2. Consolidate Python API pages (visualize + vizresult)
3. Move themes to tutorials
4. Move benchmarking under advanced
5. Update intro page navigation cards
6. Fix all cross-references
7. Update version numbers
8. Apply CSS styling changes
9. Test build and review

## Success Criteria

- Clean 5-section structure
- Python API has exactly 2 pages (Visualization, Inference)
- No redundant overview content
- Typography feels modern (not stock Jupyter Book)
- Consistent spacing throughout
- Easy to navigate between related pages
