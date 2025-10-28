export const formatCoordinates = (x: number, y: number, isGeographic?: boolean): string => {
  if (isGeographic) {
    return `Lat: ${y.toFixed(3)}°, Lon: ${x.toFixed(3)}°`;
  }
  return `(${x.toFixed(2)}, ${y.toFixed(2)})`;
};

export const formatGenomicPosition = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};