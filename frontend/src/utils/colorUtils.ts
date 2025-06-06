interface ColorTheme {
  background: string;
  text: string;
  textSecondary: string | [number, number, number, number];
  border: string;
  containerBackground: string;
  nodeSelected: [number, number, number, number];
  nodeDefault: [number, number, number, number];
  nodeSample: [number, number, number, number];
  nodeRoot: [number, number, number, number];
  nodeCombined: [number, number, number, number];
  edgeDefault: [number, number, number, number];
}

export const getTooltipStyles = (colors: ColorTheme) => {
  const isLightTheme = colors.background === '#ffffff';
  return {
    backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(5, 62, 78, 0.95)',
    color: isLightTheme ? '#ffffff' : colors.text,
    border: isLightTheme ? '1px solid rgba(0, 0, 0, 0.2)' : 'none'
  };
};

export const getContainerStyles = (colors: ColorTheme) => ({
  backgroundColor: colors.background,
  color: colors.text,
  borderColor: colors.border
});

export const getButtonStyles = (colors: ColorTheme, isActive = false) => ({
  backgroundColor: isActive ? colors.textSecondary : colors.background,
  color: isActive ? colors.background : colors.text,
  borderColor: colors.border
});

export const getNodeOutlineColor = (
  colors: ColorTheme, 
  isSelected: boolean, 
  isRoot: boolean, 
  isSample: boolean,
  opacityMultiplier = 1
): [number, number, number, number] => {
  if (isSelected) {
    return [
      colors.nodeSelected[0], 
      colors.nodeSelected[1], 
      colors.nodeSelected[2], 
      colors.nodeSelected[3] * opacityMultiplier
    ] as [number, number, number, number];
  }
  
  if (isRoot) {
    return [
      colors.nodeSelected[0], 
      colors.nodeSelected[1], 
      colors.nodeSelected[2], 
      colors.nodeSelected[3] * opacityMultiplier
    ] as [number, number, number, number];
  }
  
  if (isSample) {
    const outlineColor = colors.background === '#ffffff' ? 0 : 255;
    return [outlineColor, outlineColor, outlineColor, 255 * opacityMultiplier] as [number, number, number, number];
  }
  
  return [colors.nodeSelected[0], colors.nodeSelected[1], colors.nodeSelected[2], 0] as [number, number, number, number];
};

export const getNodeOutlineWidth = (
  isSelected: boolean,
  isRoot: boolean, 
  isSample: boolean,
  baseSize = 3
): number => {
  const sizeFactor = baseSize / 3; // Normalize to base size of 3
  
  if (isSelected) return Math.max(1, 2 * sizeFactor);
  if (isRoot) return Math.max(0.8, 1.5 * sizeFactor);
  if (isSample) return Math.max(0.5, 0.8 * sizeFactor);
  return 0;
};

export const formatCoordinates = (x: number, y: number, isGeographic?: boolean): string => {
  if (isGeographic) {
    return `Lat: ${y.toFixed(3)}°, Lon: ${x.toFixed(3)}°`;
  }
  return `(${x.toFixed(2)}, ${y.toFixed(2)})`;
};

export const formatGenomicPosition = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}; 