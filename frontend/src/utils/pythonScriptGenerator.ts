/**
 * Python Script Generator
 *
 * Generates Python scripts that recreate the current visualization
 * using the argscape Python API.
 */

export interface PythonScriptOptions {
  // File info
  filename: string;

  // Mode
  mode: 'force_graph' | 'spatial_3d';

  // Data selection
  maxSamples?: number;
  subsetMode?: 'even' | 'random';
  subsetSeed?: number | null;
  samples?: number[] | [number, number] | null;
  genomicRange?: [number, number] | null;
  temporalRange?: [number, number] | null;

  // Focal node
  focalNode?: number | null;
  focalMode?: 'subarg' | 'ancestors';

  // Appearance
  theme?: string;

  // Node settings
  sampleNodeSize?: number;
  internalNodeSize?: number;
  rootNodeSize?: number;
  showSampleIds?: boolean;
  showInternalIds?: boolean;
  showRootIds?: boolean;

  // Edge settings
  edgeWidth?: number;
  edgeOpacity?: number;

  // Mutations
  showMutations?: boolean;
  mutationSize?: number;

  // Layout (2D)
  sampleOrder?: string;
  temporalSpacing?: 'equal' | 'linear' | 'log';
  verticalSpacing?: number;
  horizontalSpacing?: number;

  // Spatial (3D)
  geographicBase?: 'unit_grid' | 'eastern_hemisphere' | 'world';
  temporalMultiplier?: number;
  spatialMultiplier?: number;
}

// Python API defaults (from argscape/visualize.py)
const DEFAULTS: Record<string, unknown> = {
  mode: 'force_graph',
  max_samples: null,
  subset_mode: 'even',
  subset_seed: null,
  samples: null,
  genomic_range: null,
  temporal_range: null,
  focal_node: null,
  focal_mode: 'subarg',
  theme: 'liquid',
  sample_node_size: 8,
  internal_node_size: 4,
  root_node_size: 6,
  show_sample_ids: false,
  show_internal_ids: false,
  show_root_ids: false,
  edge_width: 1.0,
  edge_opacity: 0.6,
  show_mutations: false,
  mutation_size: 6,
  sample_order: 'consensus_minlex',
  temporal_spacing: 'equal',
  vertical_spacing: 100.0,
  horizontal_spacing: 100.0,
  geographic_base: 'unit_grid',
  temporal_multiplier: 12.0,
  spatial_multiplier: 160.0,
};

function formatPythonValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'None';
  }
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number') {
    // Format floats with decimal point if they're whole numbers
    if (Number.isInteger(value) && String(value).indexOf('.') === -1) {
      return String(value);
    }
    return String(value);
  }
  if (Array.isArray(value)) {
    // Check if it's a tuple (range) or list (IDs)
    if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      // Treat as tuple for ranges
      return `(${value[0]}, ${value[1]})`;
    }
    // List of IDs
    return `[${value.map(v => formatPythonValue(v)).join(', ')}]`;
  }
  return String(value);
}

function isDifferentFromDefault(key: string, value: unknown): boolean {
  const defaultValue = DEFAULTS[key];

  // Handle null/undefined
  if (value === null || value === undefined) {
    return defaultValue !== null && defaultValue !== undefined;
  }
  if (defaultValue === null || defaultValue === undefined) {
    return true;
  }

  // Handle arrays
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    if (value.length !== defaultValue.length) return true;
    return value.some((v, i) => v !== defaultValue[i]);
  }

  // Handle numbers with tolerance for floats
  if (typeof value === 'number' && typeof defaultValue === 'number') {
    return Math.abs(value - defaultValue) > 0.001;
  }

  return value !== defaultValue;
}

export function generatePythonScript(options: PythonScriptOptions): string {
  const date = new Date().toISOString().split('T')[0];
  const baseFilename = options.filename.replace(/\.(trees|tsz)$/, '');

  // Build parameters list (only non-defaults)
  const params: Array<{ key: string; value: string }> = [];

  // Always include mode if it's 3D (since default is 2D)
  if (options.mode === 'spatial_3d') {
    params.push({ key: 'mode', value: '"spatial_3d"' });
  }

  // Data selection
  if (options.maxSamples && isDifferentFromDefault('max_samples', options.maxSamples)) {
    params.push({ key: 'max_samples', value: String(options.maxSamples) });
  }
  if (options.subsetMode && isDifferentFromDefault('subset_mode', options.subsetMode)) {
    params.push({ key: 'subset_mode', value: `"${options.subsetMode}"` });
  }
  if (options.subsetSeed !== null && options.subsetSeed !== undefined) {
    params.push({ key: 'subset_seed', value: String(options.subsetSeed) });
  }
  if (options.samples && options.samples.length > 0) {
    params.push({ key: 'samples', value: formatPythonValue(options.samples) });
  }
  if (options.genomicRange && options.genomicRange[0] !== undefined) {
    params.push({ key: 'genomic_range', value: formatPythonValue(options.genomicRange) });
  }
  if (options.temporalRange && options.temporalRange[0] !== undefined) {
    params.push({ key: 'temporal_range', value: formatPythonValue(options.temporalRange) });
  }

  // Focal node
  if (options.focalNode !== null && options.focalNode !== undefined) {
    params.push({ key: 'focal_node', value: String(options.focalNode) });
    if (options.focalMode && isDifferentFromDefault('focal_mode', options.focalMode)) {
      params.push({ key: 'focal_mode', value: `"${options.focalMode}"` });
    }
  }

  // Theme
  if (options.theme && isDifferentFromDefault('theme', options.theme)) {
    params.push({ key: 'theme', value: `"${options.theme}"` });
  }

  // Node settings
  if (options.sampleNodeSize !== undefined && isDifferentFromDefault('sample_node_size', options.sampleNodeSize)) {
    params.push({ key: 'sample_node_size', value: String(options.sampleNodeSize) });
  }
  if (options.internalNodeSize !== undefined && isDifferentFromDefault('internal_node_size', options.internalNodeSize)) {
    params.push({ key: 'internal_node_size', value: String(options.internalNodeSize) });
  }
  if (options.rootNodeSize !== undefined && isDifferentFromDefault('root_node_size', options.rootNodeSize)) {
    params.push({ key: 'root_node_size', value: String(options.rootNodeSize) });
  }
  if (options.showSampleIds && isDifferentFromDefault('show_sample_ids', options.showSampleIds)) {
    params.push({ key: 'show_sample_ids', value: 'True' });
  }
  if (options.showInternalIds && isDifferentFromDefault('show_internal_ids', options.showInternalIds)) {
    params.push({ key: 'show_internal_ids', value: 'True' });
  }
  if (options.showRootIds && isDifferentFromDefault('show_root_ids', options.showRootIds)) {
    params.push({ key: 'show_root_ids', value: 'True' });
  }

  // Edge settings
  if (options.edgeWidth !== undefined && isDifferentFromDefault('edge_width', options.edgeWidth)) {
    params.push({ key: 'edge_width', value: String(options.edgeWidth) });
  }
  if (options.edgeOpacity !== undefined && isDifferentFromDefault('edge_opacity', options.edgeOpacity)) {
    params.push({ key: 'edge_opacity', value: String(options.edgeOpacity) });
  }

  // Mutations
  if (options.showMutations && isDifferentFromDefault('show_mutations', options.showMutations)) {
    params.push({ key: 'show_mutations', value: 'True' });
  }
  if (options.mutationSize !== undefined && isDifferentFromDefault('mutation_size', options.mutationSize)) {
    params.push({ key: 'mutation_size', value: String(options.mutationSize) });
  }

  // Layout (2D only)
  if (options.mode === 'force_graph') {
    if (options.sampleOrder && isDifferentFromDefault('sample_order', options.sampleOrder)) {
      params.push({ key: 'sample_order', value: `"${options.sampleOrder}"` });
    }
    if (options.temporalSpacing && isDifferentFromDefault('temporal_spacing', options.temporalSpacing)) {
      params.push({ key: 'temporal_spacing', value: `"${options.temporalSpacing}"` });
    }
    if (options.verticalSpacing !== undefined && isDifferentFromDefault('vertical_spacing', options.verticalSpacing)) {
      params.push({ key: 'vertical_spacing', value: String(options.verticalSpacing) });
    }
    if (options.horizontalSpacing !== undefined && isDifferentFromDefault('horizontal_spacing', options.horizontalSpacing)) {
      params.push({ key: 'horizontal_spacing', value: String(options.horizontalSpacing) });
    }
  }

  // Spatial (3D only)
  if (options.mode === 'spatial_3d') {
    if (options.geographicBase && isDifferentFromDefault('geographic_base', options.geographicBase)) {
      params.push({ key: 'geographic_base', value: `"${options.geographicBase}"` });
    }
    if (options.temporalMultiplier !== undefined && isDifferentFromDefault('temporal_multiplier', options.temporalMultiplier)) {
      params.push({ key: 'temporal_multiplier', value: String(options.temporalMultiplier) });
    }
    if (options.spatialMultiplier !== undefined && isDifferentFromDefault('spatial_multiplier', options.spatialMultiplier)) {
      params.push({ key: 'spatial_multiplier', value: String(options.spatialMultiplier) });
    }
  }

  // Build the visualize() call
  let vizCall = '    ts,';
  if (params.length > 0) {
    vizCall += '\n' + params.map(p => `    ${p.key}=${p.value},`).join('\n');
  }

  return `"""
ARGscape visualization script
Generated from web app on ${date}

To use: Update the tree sequence path below, then run this script.
"""

import argscape
import tskit

# Load your tree sequence (update this path)
ts = tskit.load("${baseFilename}.trees")

# Create visualization with the same settings as the web app
viz = argscape.visualize(
${vizCall}
)

# Display (choose one)
viz.show()       # Opens in browser
# viz.display()  # Jupyter notebook
# viz.export("output.png")  # Save to file
`;
}

export function downloadPythonScript(options: PythonScriptOptions): void {
  const script = generatePythonScript(options);
  const baseFilename = options.filename.replace(/\.(trees|tsz)$/, '');
  const blob = new Blob([script], { type: 'text/x-python' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseFilename}_viz.py`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
