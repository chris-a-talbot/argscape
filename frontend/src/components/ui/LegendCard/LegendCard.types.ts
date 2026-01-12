export interface LegendItem {
  id: string;
  label: string;
  color: string;
  shape?: 'circle' | 'square' | 'x' | 'diamond' | 'bar';
  size?: number;
  borderColor?: string;
}

export interface LegendCardProps {
  items: LegendItem[];
  title?: string;
  defaultPosition?: { x: number; y: number };
  defaultMinimized?: boolean;
  className?: string;
}
