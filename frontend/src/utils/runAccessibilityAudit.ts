/**
 * Accessibility audit runner for ARGscape themes.
 * Run this script to check WCAG AA compliance for all built-in themes.
 * 
 * Usage (from frontend directory):
 * npx tsx src/utils/runAccessibilityAudit.ts
 */

// Mock the React context for standalone execution
const colorSchemes = {
  tskit: {
    background: '#03303E',
    containerBackground: '#0f1419',
    nodeDefault: [96, 160, 183, 255],
    nodeRoot: [56, 189, 248, 255],
    nodeSample: [20, 226, 168, 255],
    nodeCombined: [80, 160, 175, 255],
    nodeSelected: [255, 255, 255, 255],
    nodeClusterSample: [56, 189, 248, 179],
    nodeClusterRegular: [147, 51, 234, 179],
    edgeDefault: [153, 153, 153, 102],
    edgeHighlight: [255, 255, 255, 200],
    edgeClusterSample: [56, 189, 248, 255],
    mutationMarker: [220, 38, 38, 255],
    text: '#ffffff',
    textSecondary: '#14E2A8',
    border: '#5a7a8a',
    exportBackground: '#03303E',
    accentPrimary: '#14E2A8',
    accentSecondary: '#14E2A8',
    geographicGrid: [20, 226, 168, 102],
    temporalGrid: [20, 226, 168, 77],
    tooltipBackground: 'rgba(5, 62, 78, 0.95)',
    tooltipText: '#ffffff',
    headerText: '#ffffff',
    controlPanelText: '#ffffff',
    buttonText: '#ffffff',
    success: '#14E2A8',
    successHover: '#1EEBB1',
    warning: '#f59e0b',
    warningHover: '#d97706',
    error: '#ef4444',
    errorHover: '#dc2626',
    info: '#3b82f6',
    infoHover: '#2563eb',
    activeHighlight: '#14E2A8',
    hoverOverlay: 'rgba(255, 255, 255, 0.05)',
    focusRing: '#14E2A8'
  },
  liquid: {
    background: '#f5f5f7',
    containerBackground: 'rgba(255, 255, 255, 0.8)',
    nodeDefault: [148, 163, 184, 255],
    nodeRoot: [20, 226, 168, 255],
    nodeSample: [20, 226, 168, 255],
    nodeCombined: [100, 116, 139, 255],
    nodeSelected: [20, 226, 168, 255],
    nodeClusterSample: [20, 226, 168, 150],
    nodeClusterRegular: [148, 163, 184, 150],
    edgeDefault: [148, 163, 184, 80],
    edgeHighlight: [20, 226, 168, 200],
    edgeClusterSample: [20, 226, 168, 200],
    mutationMarker: [220, 38, 38, 255],
    text: '#1d1d1f',
    textSecondary: '#6e6e73',
    border: 'rgba(20, 226, 168, 0.15)',
    exportBackground: '#f5f5f7',
    accentPrimary: '#0a9d7e',
    accentSecondary: '#087a62',
    geographicGrid: [20, 226, 168, 50],
    temporalGrid: [20, 226, 168, 30],
    tooltipBackground: 'rgba(255, 255, 255, 0.95)',
    tooltipText: '#1d1d1f',
    headerText: '#1d1d1f',
    controlPanelText: '#1d1d1f',
    buttonText: '#ffffff',
    success: '#0a9d7e',
    successHover: '#087a62',
    warning: '#c87005',
    warningHover: '#b45309',
    error: '#dc2626',
    errorHover: '#b91c1c',
    info: '#0369a1',
    infoHover: '#075985',
    activeHighlight: '#0a9d7e',
    hoverOverlay: 'rgba(10, 157, 126, 0.08)',
    focusRing: '#0a9d7e'
  },
  grayscale: {
    background: '#ffffff',
    containerBackground: '#f8f9fa',
    nodeDefault: [100, 100, 100, 255],
    nodeRoot: [50, 50, 50, 255],
    nodeSample: [70, 70, 70, 255],
    nodeCombined: [120, 120, 120, 255],
    nodeSelected: [0, 0, 0, 255],
    nodeClusterSample: [80, 80, 80, 179],
    nodeClusterRegular: [60, 60, 60, 179],
    edgeDefault: [140, 140, 140, 128],
    edgeHighlight: [40, 40, 40, 200],
    edgeClusterSample: [80, 80, 80, 255],
    mutationMarker: [200, 50, 50, 255],
    text: '#212529',
    textSecondary: '#6c757d',
    border: '#8b9299',
    exportBackground: '#ffffff',
    accentPrimary: '#085167',
    accentSecondary: '#085167',
    geographicGrid: [140, 140, 140, 102],
    temporalGrid: [140, 140, 140, 77],
    tooltipBackground: 'rgba(0, 0, 0, 0.9)',
    tooltipText: '#ffffff',
    headerText: '#212529',
    controlPanelText: '#212529',
    buttonText: '#212529',
    success: '#4a5568',
    successHover: '#2d3748',
    warning: '#6b7280',
    warningHover: '#4b5563',
    error: '#1f2937',
    errorHover: '#111827',
    info: '#6b7280',
    infoHover: '#4b5563',
    activeHighlight: '#085167',
    hoverOverlay: 'rgba(0, 0, 0, 0.05)',
    focusRing: '#085167'
  }
};

// Calculate contrast ratio (copied from ColorThemeContext)
function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    if (hex.length !== 6) {
      return 0;
    }
    
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  if (!color1 || !color2) {
    return 21;
  }

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Audit function (simplified version)
function auditThemeAccessibility(colors: any, _themeName: string) {
  const issues: any[] = [];
  const warnings: string[] = [];
  
  // Text contrast checks (4.5:1 for AA)
  const textChecks = [
    { name: 'Body text on background', fg: colors.text, bg: colors.background },
    { name: 'Header text on background', fg: colors.headerText, bg: colors.background },
    { name: 'Secondary text on background', fg: colors.textSecondary, bg: colors.background },
  ];
  
  if (!colors.containerBackground.includes('rgba')) {
    textChecks.push(
      { name: 'Control panel text', fg: colors.controlPanelText, bg: colors.containerBackground },
    );
  } else {
    warnings.push('Skipping control panel text - containerBackground contains transparency');
  }
  
  if (!colors.tooltipBackground.includes('rgba') || colors.tooltipBackground.includes('0.9')) {
    // For rgba tooltips, approximate the background color
    let tooltipBg = colors.tooltipBackground;
    if (colors.tooltipBackground.includes('rgba(0, 0, 0')) {
      tooltipBg = '#000000'; // Black tooltip
    } else if (colors.tooltipBackground.includes('rgba(255, 255, 255')) {
      tooltipBg = '#ffffff'; // White tooltip
    } else if (colors.tooltipBackground.includes('rgba(5, 62, 78')) {
      tooltipBg = '#053e4e'; // Dark teal tooltip
    } else if (colors.tooltipBackground.includes('rgba')) {
      tooltipBg = colors.background; // Fallback to background
    }
    textChecks.push(
      { name: 'Tooltip text', fg: colors.tooltipText, bg: tooltipBg },
    );
  }
  
  textChecks.forEach(check => {
    const contrast = calculateContrastRatio(check.fg, check.bg);
    if (contrast < 4.5) {
      issues.push({
        element: check.name,
        foreground: check.fg,
        background: check.bg,
        contrast,
        required: 4.5,
        type: 'text'
      });
    }
  });
  
  // UI element contrast checks (3:1 for AA)
  const uiChecks: any[] = [];
  
  if (!colors.border.includes('rgba')) {
    uiChecks.push({ name: 'Border on background', fg: colors.border, bg: colors.background });
  } else {
    warnings.push('Skipping border - contains transparency');
  }
  
  uiChecks.push(
    { name: 'Accent primary on background', fg: colors.accentPrimary, bg: colors.background },
    { name: 'Success color on background', fg: colors.success, bg: colors.background },
    { name: 'Error color on background', fg: colors.error, bg: colors.background },
    { name: 'Warning color on background', fg: colors.warning, bg: colors.background },
    { name: 'Info color on background', fg: colors.info, bg: colors.background },
    { name: 'Active highlight on background', fg: colors.activeHighlight, bg: colors.background },
    { name: 'Focus ring on background', fg: colors.focusRing, bg: colors.background },
  );
  
  uiChecks.forEach(check => {
    if (check.fg.includes('rgba')) {
      warnings.push(`Skipping ${check.name} - contains transparency`);
      return;
    }
    
    const contrast = calculateContrastRatio(check.fg, check.bg);
    if (contrast < 3.0) {
      issues.push({
        element: check.name,
        foreground: check.fg,
        background: check.bg,
        contrast,
        required: 3.0,
        type: 'ui'
      });
    }
  });
  
  const totalChecks = textChecks.length + uiChecks.length;
  const passedChecks = totalChecks - issues.length;
  const score = (passedChecks / totalChecks) * 100;
  
  return {
    passed: issues.length === 0,
    issues,
    warnings,
    score
  };
}

// Run audits
console.log('═══════════════════════════════════════════════════════════');
console.log('ARGscape Theme Accessibility Audit');
console.log('WCAG AA Requirements: Text 4.5:1 | UI Elements 3:1');
console.log('═══════════════════════════════════════════════════════════\n');

(['liquid', 'tskit', 'grayscale'] as const).forEach(themeName => {
  const scheme = colorSchemes[themeName];
  const report = auditThemeAccessibility(scheme, themeName);
  
  console.log(`━━━ ${themeName.toUpperCase()} Theme ━━━`);
  console.log(`Score: ${report.score.toFixed(1)}%`);
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (report.issues.length > 0) {
    console.log('\n🔴 Issues Found:');
    report.issues.forEach(issue => {
      console.log(`  • ${issue.element}`);
      console.log(`    Contrast: ${issue.contrast.toFixed(2)}:1 (needs ${issue.required}:1)`);
      console.log(`    FG: ${issue.foreground} | BG: ${issue.background}`);
    });
  }
  
  if (report.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    report.warnings.forEach(w => console.log(`  • ${w}`));
  }
  
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════');

