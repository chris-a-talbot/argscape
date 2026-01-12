import React from 'react';
import { useColorTheme } from '../../../context/ColorThemeContext';
import { WizardSettings, TreeSequenceStats, ComplexityEstimate, VisualizationType } from './wizardConfig';

interface WizardSummaryProps {
  vizType: VisualizationType;
  settings: WizardSettings;
  stats: TreeSequenceStats;
  complexity: ComplexityEstimate;
  onAdjustSettings: () => void;
}

export function WizardSummary({
  vizType,
  settings,
  stats,
  complexity,
  onAdjustSettings,
}: WizardSummaryProps) {
  const { colors } = useColorTheme();

  const vizTypeLabels: Record<VisualizationType, string> = {
    '2d': '2D ARG Visualization',
    '3d': '3D Spatial Visualization',
    'diff': 'Spatial Diff Comparison',
  };

  const getPerformanceBadge = () => {
    switch (complexity.level) {
      case 'good':
        return {
          label: 'Good Performance',
          bgColor: 'rgba(34, 197, 94, 0.15)',
          textColor: '#22c55e',
          borderColor: 'rgba(34, 197, 94, 0.4)',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case 'moderate':
        return {
          label: 'Moderate Load',
          // Use orange instead of yellow for better visibility in light themes
          bgColor: 'rgba(249, 115, 22, 0.15)',
          textColor: '#ea580c',  // orange-600 for better contrast
          borderColor: 'rgba(249, 115, 22, 0.4)',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
          ),
        };
      case 'poor':
        return {
          label: 'May Be Slow',
          bgColor: 'rgba(239, 68, 68, 0.15)',
          textColor: '#ef4444',
          borderColor: 'rgba(239, 68, 68, 0.4)',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        };
    }
  };

  const perfBadge = getPerformanceBadge();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center pb-4 border-b" style={{ borderColor: colors.border }}>
        <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
          Ready to Launch
        </h3>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          {vizTypeLabels[vizType]}
        </p>
      </div>

      {/* Performance Indicator */}
      <div
        className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border"
        style={{ backgroundColor: perfBadge.bgColor, borderColor: perfBadge.borderColor }}
      >
        <span style={{ color: perfBadge.textColor }}>{perfBadge.icon}</span>
        <span className="text-sm font-medium" style={{ color: perfBadge.textColor }}>
          {perfBadge.label}
        </span>
        <span className="text-sm" style={{ color: colors.textSecondary }}>
          (~{complexity.estimatedEdges.toLocaleString()} edges)
        </span>
      </div>

      {/* Settings Summary */}
      <div className="space-y-3">
        {/* Data Scope */}
        <SummaryRow
          label="Data Scope"
          value={getDataScopeDescription(settings, stats)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        {/* Region Filter */}
        <SummaryRow
          label="Genomic Region"
          value={
            settings.regionFilter === 'full'
              ? `Entire sequence (${stats.sequenceLength.toLocaleString()} bp)`
              : settings.filterMode === 'base_pairs' && settings.genomicRange
                ? `${settings.genomicRange[0].toLocaleString()} - ${settings.genomicRange[1].toLocaleString()} bp`
                : settings.treeRange
                  ? `Trees ${settings.treeRange[0]} - ${settings.treeRange[1]}`
                  : 'Custom region'
          }
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        {/* Time Range (if set) */}
        {settings.temporalRange && (
          <SummaryRow
            label="Time Range"
            value={`${settings.temporalRange[0].toFixed(2)} - ${settings.temporalRange[1].toFixed(2)} units`}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        )}

        {/* Performance Options */}
        <div className="pt-2 border-t" style={{ borderColor: colors.border }}>
          <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            OPTIMIZATIONS
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {settings.enableClustering && (
              <FeatureTag label="Node Clustering" enabled />
            )}
            {settings.enableHeatmap && vizType === '3d' && (
              <FeatureTag label="Heatmap Mode" enabled />
            )}
            {!settings.enableClustering && !settings.enableHeatmap && (
              <span className="text-sm" style={{ color: colors.textSecondary }}>
                None enabled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {complexity.warnings.length > 0 && (
        <div
          className="p-3 rounded-lg border"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              {complexity.warnings.map((warning, i) => (
                <p key={i} className="text-sm" style={{ color: colors.text }}>
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {complexity.recommendations.length > 0 && (
        <div
          className="p-3 rounded-lg border"
          style={{
            backgroundColor: `${colors.accentPrimary}10`,
            borderColor: `${colors.accentPrimary}30`,
          }}
        >
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.accentPrimary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div>
              {complexity.recommendations.map((rec, i) => (
                <p key={i} className="text-sm" style={{ color: colors.text }}>
                  {rec}
                </p>
              ))}
              <button
                type="button"
                onClick={onAdjustSettings}
                className="text-sm font-medium mt-2 hover:underline"
                style={{ color: colors.accentPrimary }}
              >
                Adjust settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function SummaryRow({ label, value, icon }: SummaryRowProps) {
  const { colors } = useColorTheme();

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${colors.accentPrimary}15`, color: colors.accentPrimary }}
      >
        {icon}
      </div>
      <div className="flex-grow">
        <span className="text-xs" style={{ color: colors.textSecondary }}>
          {label}
        </span>
        <p className="text-sm font-medium" style={{ color: colors.text }}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface FeatureTagProps {
  label: string;
  enabled: boolean;
}

function FeatureTag({ label, enabled }: FeatureTagProps) {
  const { colors } = useColorTheme();

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: enabled ? `${colors.accentPrimary}15` : colors.containerBackground,
        color: enabled ? colors.accentPrimary : colors.textSecondary,
        border: `1px solid ${enabled ? colors.accentPrimary : colors.border}`,
      }}
    >
      {enabled && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {label}
    </span>
  );
}

// Helper to get human-readable description of data scope settings
function getDataScopeDescription(settings: WizardSettings, stats: TreeSequenceStats): string {
  if (settings.dataScope === 'full') {
    return `Full ARG (${stats.numSamples.toLocaleString()} samples)`;
  }

  if (settings.dataScope === 'subset') {
    switch (settings.subsetMethod) {
      case 'random':
        return `${settings.sampleCount.toLocaleString()} random samples`;
      case 'range':
        const rangeCount = Math.max(0, settings.sampleRangeEnd - settings.sampleRangeStart + 1);
        return `Samples ${settings.sampleRangeStart}-${settings.sampleRangeEnd} (${rangeCount} samples)`;
      case 'specific':
        return `${settings.sampleIds.length} specific samples`;
    }
  }

  if (settings.dataScope === 'focal') {
    if (settings.focalNodeId === null) {
      return 'Focal node (not specified)';
    }
    if (settings.focalMode === 'subgraph') {
      return `Subgraph from node ${settings.focalNodeId}`;
    } else {
      return `Ancestors of sample ${settings.focalNodeId}`;
    }
  }

  return 'Custom selection';
}
