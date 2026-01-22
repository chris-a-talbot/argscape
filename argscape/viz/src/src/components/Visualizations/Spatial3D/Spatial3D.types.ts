import type { GraphNode } from '@/types'

export interface Node3D extends GraphNode {
  position: [number, number, number]
  color: [number, number, number, number]
  size: number
}

export interface Edge3D {
  source: [number, number, number]
  target: [number, number, number]
  color: [number, number, number, number]
}

export interface CoordinateTransform {
  centerX: number
  centerY: number
  maxScale: number
  dataBounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

export interface ViewState {
  target: [number, number, number]
  zoom: number
  minZoom: number
  maxZoom: number
  rotationX: number
  rotationOrbit: number
  orbitAxis: 'Y'
}

export const DEFAULT_VIEW_STATE: ViewState = {
  target: [0, 0, 0],
  zoom: 1.8,  // AUTO_FIT_ZOOM matching web app
  minZoom: 0.001,  // Match web app BASE_MIN_ZOOM
  maxZoom: 500,    // Match web app BASE_MAX_ZOOM
  rotationX: 30,   // Angle from above (30 degrees from horizontal)
  rotationOrbit: 15,  // Slight side angle to show both background planes
  orbitAxis: 'Y',  // Y is "up" in OrbitView - we swap coords so time is in Y slot
}

export const NODE_SIZES = {
  SAMPLE: 5,
  ROOT: 5,
  INTERNAL: 4,
}

export const BASE_ELEVATION = 0.1
export const JITTER_SCALE = 0.00125
export const Z_JITTER_SCALE = 0.02      // Tiny Z jitter to prevent node overlap clipping
export const SHAPE_Z_OFFSET = -0.5      // Lower shapefile so nodes sit on top
