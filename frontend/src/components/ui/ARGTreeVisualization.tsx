import { ReactNode, useMemo } from 'react';
import { useColorTheme } from '@/context/ColorThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { APP_LOGO_FONT_FAMILY } from '@/lib/fonts';

// SVG viewBox dimensions - these scale responsively with the container
const SVG_WIDTH = 900;
const SVG_HEIGHT = 520; // Taller for comfortable vertical spacing

// Logo position (centered at top)
const LOGO_CENTER_X = SVG_WIDTH / 2;
const LOGO_Y = 55; // Increased to prevent clipping at top
const LOGO_FONT_SIZE = 56; // Larger logo

// The "p" in "scape" - positioned to align with the actual "p" character
// At 56px font, "ARG" takes about 88px, "scape" starts after that
// "p" is the 4th character in "scape", roughly at center + 72px
const P_X = LOGO_CENTER_X + 72;
const TREE_START_Y = LOGO_Y + 18; // Start right at the descender

// Tree structure coordinates (orthogonal/cladogram style)
// Mirrored layout: Upload, Simulate on left; Load on right

// First horizontal split (after vertical from p)
const SPLIT1_Y = TREE_START_Y + 50;

// Main trunk X position (right branch of first split)
const TRUNK_X = LOGO_CENTER_X + 140;

// Start Here position (left branch of first split)
const START_HERE_X = LOGO_CENTER_X - 220;
const START_HERE_Y = SPLIT1_Y + 55; // More space for Start Here

// Second split on main trunk (where Load branches off) - more vertical space below Start Here
const SPLIT2_Y = START_HERE_Y + 90;

// Load branches right from trunk
const LOAD_X = TRUNK_X + 140;
const LOAD_Y = SVG_HEIGHT - 130; // Lines end with room for button cards

// Recombination node - where trunk continues left and Start Here line joins
const RECOMB_X = LOGO_CENTER_X - 60;
const RECOMB_Y = SPLIT2_Y + 65;

// Upload and Simulate branch from recombination node (left to right order)
const UPLOAD_X = RECOMB_X - 110;
const SIMULATE_X = RECOMB_X + 110;
const BUTTONS_Y = SVG_HEIGHT - 130; // Lines end with room for button cards

// Convert SVG coordinates to percentage positions for button placement
const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

// Particle animation configuration
const PARTICLE_COUNT = 5;
const PARTICLE_DURATION = 4000; // ms for full journey

interface ARGTreeVisualizationProps {
  /** "Start here" button element */
  startHereButton: ReactNode;
  /** Upload button element */
  uploadButton: ReactNode;
  /** Simulate button element */
  simulateButton: ReactNode;
  /** Load button element */
  loadButton: ReactNode;
  /** Tagline text */
  tagline: string;
  /** Handler for logo click */
  onLogoClick: () => void;
}

/**
 * ARGTreeVisualization - Renders an ARG tree connecting logo to action buttons
 *
 * The tree emerges from the "p" in "ARGscape" and branches to four buttons:
 * - Start here (branches early, introductory path)
 * - Load (branches from main trunk)
 * - Upload & Simulate (share a common ancestor via recombination node)
 */
export function ARGTreeVisualization({
  startHereButton,
  uploadButton,
  simulateButton,
  loadButton,
  tagline,
  onLogoClick,
}: ARGTreeVisualizationProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { colors } = useColorTheme();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Generate particle data with staggered start times
  const particles = useMemo(() => {
    if (prefersReducedMotion) return [];

    // Main path for particles: down from p, left to trunk, down to recomb, down to upload
    const mainPath = `M ${P_X} ${TREE_START_Y}
                      L ${P_X} ${SPLIT1_Y}
                      L ${TRUNK_X} ${SPLIT1_Y}
                      L ${TRUNK_X} ${SPLIT2_Y}
                      L ${RECOMB_X} ${SPLIT2_Y}
                      L ${RECOMB_X} ${RECOMB_Y}
                      L ${UPLOAD_X} ${RECOMB_Y}
                      L ${UPLOAD_X} ${BUTTONS_Y}`;

    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      delay: (i / PARTICLE_COUNT) * PARTICLE_DURATION,
      path: mainPath,
    }));
  }, [prefersReducedMotion]);

  // On mobile, return null - LandingPage will render fallback layout
  if (!isDesktop) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* SVG and buttons wrapper - buttons are positioned relative to this */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto"
          style={{ minHeight: '480px' }}
          aria-hidden="true"
        >
        <title>ARG tree visualization connecting logo to navigation options</title>

        {/* Logo text as SVG */}
        <text
          x={LOGO_CENTER_X}
          y={LOGO_Y}
          textAnchor="middle"
          className="cursor-pointer select-none"
          style={{
            fontSize: `${LOGO_FONT_SIZE}px`,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            fontFamily: APP_LOGO_FONT_FAMILY,
          }}
          onClick={onLogoClick}
          role="button"
          aria-label="ARGscape - click to go home"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onLogoClick();
            }
          }}
        >
          <tspan fill={colors.text}>ARG</tspan>
          <tspan fill={colors.accentPrimary}>scape</tspan>
        </text>

        {/* Tree branches - orthogonal lines */}
        <g className="tree-branches">
          {/* 1. Vertical line down from "p" descender to first split */}
          <path
            d={`M ${P_X} ${TREE_START_Y} L ${P_X} ${SPLIT1_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={3.5}
            fill="none"
          />

          {/* 2. Horizontal line at first split - left to trunk, right to Start Here */}
          <path
            d={`M ${TRUNK_X} ${SPLIT1_Y} L ${START_HERE_X} ${SPLIT1_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={3.5}
            fill="none"
          />

          {/* 3. Vertical line down to Start Here button */}
          <path
            d={`M ${START_HERE_X} ${SPLIT1_Y} L ${START_HERE_X} ${START_HERE_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={2.5}
            strokeDasharray="6 3"
            fill="none"
          />

          {/* 4. Main trunk - vertical down from first split to second split */}
          <path
            d={`M ${TRUNK_X} ${SPLIT1_Y} L ${TRUNK_X} ${SPLIT2_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={3.5}
            fill="none"
          />

          {/* 5. Horizontal line at second split - left to Load, right continues */}
          <path
            d={`M ${LOAD_X} ${SPLIT2_Y} L ${RECOMB_X} ${SPLIT2_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={3.5}
            fill="none"
          />

          {/* 6. Vertical line down to Load button */}
          <path
            d={`M ${LOAD_X} ${SPLIT2_Y} L ${LOAD_X} ${LOAD_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={3.5}
            fill="none"
          />

          {/* 7. Line from Start Here down to recombination node */}
          <path
            d={`M ${START_HERE_X} ${START_HERE_Y + 50} L ${START_HERE_X} ${RECOMB_Y} L ${RECOMB_X} ${RECOMB_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={2.5}
            strokeDasharray="6 3"
            fill="none"
          />

          {/* 8. Line from trunk continuing to recombination node */}
          <path
            d={`M ${RECOMB_X} ${SPLIT2_Y} L ${RECOMB_X} ${RECOMB_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={3.5}
            fill="none"
          />

          {/* 9. Horizontal line from recombination node to Upload and Simulate */}
          <path
            d={`M ${UPLOAD_X} ${RECOMB_Y} L ${SIMULATE_X} ${RECOMB_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={3.5}
            fill="none"
          />

          {/* 10. Vertical line down to Upload */}
          <path
            d={`M ${UPLOAD_X} ${RECOMB_Y} L ${UPLOAD_X} ${BUTTONS_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={3.5}
            fill="none"
          />

          {/* 11. Vertical line down to Simulate */}
          <path
            d={`M ${SIMULATE_X} ${RECOMB_Y} L ${SIMULATE_X} ${BUTTONS_Y}`}
            stroke={colors.accentPrimary}
            strokeWidth={3.5}
            fill="none"
          />

        </g>

        {/* Animated particles */}
        {!prefersReducedMotion && (
          <g className="particles">
            {particles.map((particle) => (
              <circle
                key={particle.id}
                r={2.5}
                fill={colors.accentPrimary}
                opacity={0.7}
              >
                <animateMotion
                  dur={`${PARTICLE_DURATION}ms`}
                  repeatCount="indefinite"
                  begin={`${particle.delay}ms`}
                  path={particle.path}
                />
                <animate
                  attributeName="opacity"
                  values="0;0.7;0.7;0"
                  dur={`${PARTICLE_DURATION}ms`}
                  repeatCount="indefinite"
                  begin={`${particle.delay}ms`}
                />
              </circle>
            ))}
          </g>
        )}
      </svg>

        {/* Buttons positioned absolutely over SVG */}
        <div
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        >
          {/* Start Here button */}
          <div
            className="absolute transform -translate-x-1/2"
            style={{
              left: toPercent(START_HERE_X, SVG_WIDTH),
              top: toPercent(START_HERE_Y, SVG_HEIGHT),
              pointerEvents: 'auto',
            }}
          >
            {startHereButton}
          </div>

          {/* Load button */}
          <div
            className="absolute transform -translate-x-1/2"
            style={{
              left: toPercent(LOAD_X, SVG_WIDTH),
              top: toPercent(LOAD_Y, SVG_HEIGHT),
              pointerEvents: 'auto',
            }}
          >
            {loadButton}
          </div>

          {/* Upload button */}
          <div
            className="absolute transform -translate-x-1/2"
            style={{
              left: toPercent(UPLOAD_X, SVG_WIDTH),
              top: toPercent(BUTTONS_Y, SVG_HEIGHT),
              pointerEvents: 'auto',
            }}
          >
            {uploadButton}
          </div>

          {/* Simulate button */}
          <div
            className="absolute transform -translate-x-1/2"
            style={{
              left: toPercent(SIMULATE_X, SVG_WIDTH),
              top: toPercent(BUTTONS_Y, SVG_HEIGHT),
              pointerEvents: 'auto',
            }}
          >
            {simulateButton}
          </div>
        </div>
      </div>

      {/* Footer with tagline and copyright - outside the SVG/button wrapper */}
      <footer className="text-center mt-16 space-y-2">
        <p
          className="text-base md:text-lg"
          style={{ color: colors.textSecondary }}
        >
          {tagline}
        </p>
        <p
          className="text-xs"
          style={{ color: colors.textSecondary, opacity: 0.7 }}
        >
          © {new Date().getFullYear()} Chris Talbot
        </p>
      </footer>
    </div>
  );
}
