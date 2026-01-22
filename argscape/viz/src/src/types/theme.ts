export interface NodeColors {
  sample: string
  internal: string
  root: string
  cluster: string
  selected: string
}

export interface EdgeColors {
  default: string
  highlight: string
  dimmed: string
}

export interface Theme {
  name: string
  background: string
  nodes: NodeColors
  edges: EdgeColors
  text: string
  text_secondary: string
  grid: string
  mutation: string
  mutation_unknown: string
}
