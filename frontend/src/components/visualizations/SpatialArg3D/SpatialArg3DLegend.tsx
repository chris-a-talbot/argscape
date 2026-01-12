import React, { useMemo } from 'react';
import { LegendCard, type LegendItem } from '@/components/ui/LegendCard';
import { useColorTheme } from '@/context/ColorThemeContext';

export interface SpatialArg3DLegendProps {
  showMutations?: boolean;
}

/**
 * Helper to convert RGBA tuple to CSS rgba string
 */
const rgbaToString = (rgba: [number, number, number, number]): string =>
  `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3] / 255})`;

export const SpatialArg3DLegend: React.FC<SpatialArg3DLegendProps> = ({
  showMutations = true,
}) => {
  const { colors } = useColorTheme();

  const items: LegendItem[] = useMemo(() => {
    const baseItems: LegendItem[] = [
      {
        id: 'sample',
        label: 'Sample Node',
        color: rgbaToString(colors.nodeSample),
        shape: 'circle',
      },
      {
        id: 'internal',
        label: 'Internal Node',
        color: rgbaToString(colors.nodeDefault),
        shape: 'circle',
      },
      {
        id: 'root',
        label: 'Root Node',
        color: rgbaToString(colors.nodeRoot),
        shape: 'circle',
      },
    ];

    if (showMutations) {
      baseItems.push({
        id: 'mutation',
        label: 'Mutation',
        color: rgbaToString(colors.mutationMarker),
        shape: 'bar',
        size: 12,
      });
    }

    return baseItems;
  }, [colors, showMutations]);

  return <LegendCard items={items} />;
};
