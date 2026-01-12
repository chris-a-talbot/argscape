import { ColorScheme, calculateContrastRatio } from '../context/ColorThemeContext';

export interface AccessibilityIssue {
  element: string;
  foreground: string;
  background: string;
  contrast: number;
  required: number;
  level: 'AA' | 'AAA';
  type: 'text' | 'ui';
}

export interface AuditReport {
  passed: boolean;
  issues: AccessibilityIssue[];
  warnings: string[];
  score: number; // Percentage of checks passed
}

/**
 * Audit a theme for WCAG accessibility compliance.
 * Checks text (4.5:1) and UI elements (3:1) contrast ratios.
 * @param colors - Color scheme to audit
 * @param themeName - Name of the theme being audited
 * @returns Audit report with issues, warnings, and score
 */
export function auditThemeAccessibility(colors: ColorScheme, _themeName: string): AuditReport {
  const issues: AccessibilityIssue[] = [];
  const warnings: string[] = [];
  
  // Text contrast checks (4.5:1 for AA)
  const textChecks = [
    { name: 'Body text on background', fg: colors.text, bg: colors.background },
    { name: 'Header text on background', fg: colors.headerText, bg: colors.background },
    { name: 'Secondary text on background', fg: colors.textSecondary, bg: colors.background },
  ];
  
  // Only check container background if it's not transparent
  if (!colors.containerBackground.includes('rgba')) {
    textChecks.push(
      { name: 'Control panel text', fg: colors.controlPanelText, bg: colors.containerBackground },
    );
  } else {
    warnings.push('Skipping control panel text - containerBackground contains transparency');
  }
  
  // Only check tooltip if both colors are not transparent
  if (!colors.tooltipBackground.includes('rgba') || colors.tooltipBackground.includes('0.9')) {
    // For rgba tooltips, approximate the background color
    let tooltipBg = colors.tooltipBackground;
    if (colors.tooltipBackground.includes('rgba(0, 0, 0')) {
      tooltipBg = '#000000'; // Black tooltip
    } else if (colors.tooltipBackground.includes('rgba(255, 255, 255')) {
      tooltipBg = '#ffffff'; // White tooltip
    } else if (colors.tooltipBackground.includes('rgba(5, 62, 78')) {
      tooltipBg = '#053e4e'; // Dark teal tooltip (tskit theme)
    } else if (colors.tooltipBackground.includes('rgba')) {
      tooltipBg = colors.background; // Fallback to background
    }
    textChecks.push(
      { name: 'Tooltip text', fg: colors.tooltipText, bg: tooltipBg },
    );
  } else {
    warnings.push('Skipping tooltip text - tooltipBackground contains transparency');
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
        level: 'AA',
        type: 'text'
      });
    }
  });
  
  // UI element contrast checks (3:1 for AA)
  const uiChecks: Array<{ name: string; fg: string; bg: string }> = [];
  
  // Only check border if not transparent
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
    // Skip rgba colors that include transparency
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
        level: 'AA',
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

