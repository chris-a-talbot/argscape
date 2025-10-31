export const NODE_SIZES = {
    SAMPLE: 4,
    COMBINED: 3,
    ROOT: 4,
    DEFAULT: 3
  } as const;
  
export const LINE_WIDTHS = {
    GEOGRAPHIC_ACTIVE: 0.8, // Reduced for cleaner appearance
    GEOGRAPHIC_NORMAL: 1.5, // Reduced for cleaner appearance
    TIME_SLICE_ACTIVE: 0.5, // Reduced thickness
    TIME_SLICE_NORMAL: 0.8, // Reduced thickness
    NODE_OUTLINE_SELECTED: 2,
    NODE_OUTLINE_ROOT: 1.5,
    NODE_OUTLINE_SAMPLE: 0.8,
    MIN_NODE_OUTLINE: 0.3,
    MAX_NODE_OUTLINE: 4
  } as const;