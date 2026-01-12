# Visualizer Stats Enhancement Design

**Date:** 2026-01-12
**Status:** Approved

## Overview

Enhance all visualizers (2D, 3D, Spatial Diff) with population genetics statistics, window-specific stats when genomic filtering is active, and fix UI issues with temporal filter modes and layout options.

## Changes

### 1. Layout Panel (2D Visualizer)

**File:** `frontend/src/components/ui/QuickActionsBar/panels/LayoutPanel.tsx`

#### Remove Sample Order Options
- Remove `'ancestral_path'` ("Ancestral")
- Remove `'coalescence_minlex'` ("Coalescence")
- Keep: Numeric, First Tree, Center Tree, Consensus, Dagre

#### Add Tooltips to Section Headers

**Sample Order tooltip:**
- **Numeric**: Orders by sample ID. Simple and predictable.
- **First Tree**: Optimizes for the first tree to minimize crossings.
- **Center Tree**: Uses the center tree for ordering. Good for balanced views.
- **Consensus**: Works well across all trees. Best general-purpose choice.
- **Dagre**: Hierarchical layout algorithm. Best for complex topologies.

**Temporal Spacing tooltip:**
- **Equal**: Spaces generations evenly. Best for understanding structure.
- **Linear**: Proportional to actual time. Shows true temporal relationships.
- **Log**: Logarithmic scaling. Best for large time spans with recent clustering.

---

### 2. Stats Panel Enhancement (All Visualizers)

**Files:**
- `frontend/src/components/ui/QuickActionsBar/panels/StatsPanel.tsx`
- `frontend/src/components/ui/QuickActionsBar/panels/StatsPanel.types.ts`
- New: `frontend/src/components/ui/QuickActionsBar/panels/PopGenStatsDisplay.tsx`

#### New Structure

```
┌─────────────────────────────────────────────────┐
│ STATS                                           │
├─────────────────────────────────────────────────┤
│ ▼ Graph Info (collapsible, open by default)     │
│   Nodes: 150 → 89 → 89  Edges: 200 → 120 → 120  │
│   Samples: 50  Trees: 100  Sites: 1,234         │
├─────────────────────────────────────────────────┤
│ ▼ Population Genetics (collapsible, open)       │
│                                                 │
│   [When NO genomic filter active:]              │
│   Nucleotide diversity (π)    0.00234           │
│   Watterson's theta (θ)       0.00198           │
│   Tajima's D                  0.42              │
│   Segregating sites           847               │
│   TMRCA                       1,234.5           │
│                                                 │
│   [When genomic filter IS active:]              │
│   ┌──────────────────┬──────────────────┐       │
│   │   Full Sequence  │     Window       │       │
│   ├──────────────────┼──────────────────┤       │
│   │ π      0.00234   │ π      0.00312   │       │
│   │ θ      0.00198   │ θ      0.00245   │       │
│   │ D      0.42      │ D      0.67      │       │
│   │ Sites  847       │ Sites  234       │       │
│   │ TMRCA  1,234.5   │ TMRCA  892.1     │       │
│   └──────────────────┴──────────────────┘       │
│                                                 │
│   [Show more ▼] ← expands advanced stats        │
├─────────────────────────────────────────────────┤
│ ▸ Active Filters (collapsible, closed)          │
└─────────────────────────────────────────────────┘
```

#### Curated Stats (shown by default)
- Nucleotide diversity (π)
- Watterson's theta (θ)
- Tajima's D
- Segregating sites
- TMRCA

#### Advanced Stats (expandable)
- Mean/median tree height & length
- Ne (Watterson), Ne (Pi)
- Recombination rate
- LD r²
- FST, divergence (if multiple populations)

---

### 3. Window Stats Backend API

**New File:** `argscape/api/routes/statistics.py`

#### Endpoint

```
GET /api/statistics/window
Parameters:
  - session_id: string
  - ts_id: string
  - start: number (genomic start position in bp)
  - end: number (genomic end position in bp)

Response:
{
  "nucleotide_diversity": 0.00312,
  "wattersons_theta": 0.00245,
  "tajimas_d": 0.67,
  "segregating_sites": 234,
  "tmrca": 892.1,
  "mean_tree_height": 456.2,
  "median_tree_height": 423.8,
  "mean_tree_length": 1234.5,
  "median_tree_length": 1189.2,
  "ne_watterson": 12500,
  "ne_pi": 14200,
  "recombination_rate": 1.2e-8,
  "ld_r2": 0.34,
  "fst": 0.12,           // only if multiple populations
  "divergence": 0.0045   // only if multiple populations
}
```

#### Implementation
- Use `ts.keep_intervals()` to subset the tree sequence
- Calculate stats using existing tskit methods on the subset
- Cache results for repeated requests with same parameters

#### Frontend Hook

**New File:** `frontend/src/hooks/useWindowStats.ts`

```typescript
useWindowStats(sessionId, tsId, genomicRange, enabled)
// Returns: { data, isLoading, error }
// Debounced by 750ms (matching debouncedGenomicRange)
// Only fetches when enabled = true (genomic filtering active)
```

---

### 4. Temporal Filter Mode Fix (3D/Diff)

**Files:**
- `frontend/src/components/ui/QuickActionsBar/panels/FilterPanel.tsx`
- `frontend/src/components/ui/QuickActionsBar/panels/FilterPanel.types.ts`
- `frontend/src/components/visualizations/SpatialArg3D/SpatialArg3DControls.tsx`
- `frontend/src/components/visualizations/SpatialArg3D/SpatialArg3DVisualizationContainer.tsx`
- `frontend/src/components/visualizations/SpatialArgDiff/SpatialArgDiffControls.tsx`

#### Problem
- 3 modes exist: `'hide'`, `'planes'`, `'hybrid'`
- UI only has binary toggle mapping to 2 modes
- `'hybrid'` mode is inaccessible

#### Solution
Replace binary toggle with 3-button group:

```
┌─────────────────────────────────────────────────┐
│ TEMPORAL FILTER                                 │
├─────────────────────────────────────────────────┤
│ Range: [====|----------|====] 0.0 - 1234.5      │
│                                                 │
│ Mode:  [Hide] [Planes] [Hybrid]                 │
│                                                 │
│ Dim Opacity: [=====|-----] 0.3                  │
│              (only shown for planes/hybrid)     │
└─────────────────────────────────────────────────┘
```

#### Mode Tooltips
- **Hide**: Removes nodes outside the time range entirely
- **Planes**: Shows all nodes; dims those outside range with opacity
- **Hybrid**: Hides nodes AND shows temporal plane markers

#### Code Changes
1. Update `FilterMode` type to `'hide' | 'planes' | 'hybrid'`
2. Add button group UI in FilterPanel when temporal filtering enabled
3. Remove binary mapping in 3D/Diff controls - pass mode directly
4. Show dim opacity slider only for planes/hybrid modes

---

## Implementation Order

1. **Layout Panel changes** (quick, isolated)
2. **Temporal filter mode fix** (isolated to 3D/Diff)
3. **Stats Panel enhancement** (shared component)
4. **Backend API for window stats**
5. **Frontend hook + integration**

## Files Summary

| Change | Files |
|--------|-------|
| Layout Panel | `LayoutPanel.tsx` |
| Stats Panel | `StatsPanel.tsx`, `StatsPanel.types.ts`, new `PopGenStatsDisplay.tsx` |
| Window Stats API | New `argscape/api/routes/statistics.py`, new `useWindowStats.ts` |
| Temporal Filter Fix | `FilterPanel.tsx`, `FilterPanel.types.ts`, `SpatialArg3DControls.tsx`, `SpatialArg3DVisualizationContainer.tsx`, `SpatialArgDiffControls.tsx` |
