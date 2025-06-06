/**
 * Utility functions for high-resolution image export with content-aware cropping
 */

export interface ContentBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface ExportOptions {
  filename: string;
  padding?: number;
  maxWidth?: number;
  maxHeight?: number;
  backgroundColor?: string;
  scale?: number;
  watermark?: WatermarkOptions;
}

export interface WatermarkOptions {
  text: string;
  subtext?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  opacity?: number;
}

/**
 * Calculate the bounding box of SVG content by examining all visible elements
 */
export function calculateSVGContentBounds(svgElement: SVGSVGElement): ContentBounds {
  const allElements = svgElement.querySelectorAll('circle, line, path, text, rect, ellipse, polygon, polyline');
  
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  allElements.forEach(element => {
    try {
      const bbox = (element as SVGGraphicsElement).getBBox();
      if (bbox.width > 0 && bbox.height > 0) {
        minX = Math.min(minX, bbox.x);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        minY = Math.min(minY, bbox.y);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      }
    } catch (e) {
      // Some elements might not support getBBox, skip them
      console.warn('Could not get bounding box for element:', element, e);
    }
  });

  // Fallback to viewBox if no content found
  if (minX === Infinity) {
    const viewBox = svgElement.viewBox.baseVal;
    minX = viewBox.x;
    minY = viewBox.y;
    maxX = viewBox.x + viewBox.width;
    maxY = viewBox.y + viewBox.height;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2
  };
}

/**
 * Calculate the bounding box of 3D canvas content by examining the rendered pixels
 */
export function calculateCanvasContentBounds(canvas: HTMLCanvasElement): ContentBounds {
  // For WebGL contexts, we need to first copy the canvas to a 2D canvas
  let sourceCanvas = canvas;
  const gl = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');
  
  if (gl) {
    // For WebGL canvas, create a temporary 2D canvas to read pixel data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      console.warn('Could not create 2D context for WebGL canvas bounds calculation');
      return getDefaultBounds(canvas);
    }
    
    try {
      tempCtx.drawImage(canvas, 0, 0);
      sourceCanvas = tempCanvas;
    } catch (error) {
      console.warn('Could not copy WebGL canvas for bounds calculation:', error);
      return getDefaultBounds(canvas);
    }
  }

  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) {
    return getDefaultBounds(canvas);
  }

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  } catch (error) {
    console.warn('Could not read image data for bounds calculation:', error);
    return getDefaultBounds(canvas);
  }

  const data = imageData.data;
  let minX = sourceCanvas.width;
  let maxX = 0;
  let minY = sourceCanvas.height;
  let maxY = 0;

  // Scan for non-transparent pixels to find content bounds
  // Use a more efficient sampling approach for large canvases
  const step = sourceCanvas.width > 1000 || sourceCanvas.height > 1000 ? 2 : 1;
  
  for (let y = 0; y < sourceCanvas.height; y += step) {
    for (let x = 0; x < sourceCanvas.width; x += step) {
      const index = (y * sourceCanvas.width + x) * 4;
      const alpha = data[index + 3];
      
      // Check if pixel is not transparent and not the background color
      if (alpha > 0) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Skip if it's the background color (dark blue #03303E)
        // Allow for some tolerance in color matching
        const isBackground = Math.abs(r - 3) <= 2 && Math.abs(g - 48) <= 2 && Math.abs(b - 62) <= 2;
        if (!isBackground) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
  }

  // Fallback to full canvas if no content found
  if (minX === sourceCanvas.width) {
    console.log('No content found in canvas, using full canvas bounds');
    return getDefaultBounds(canvas);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2
  };
}

/**
 * Get default bounds for a canvas (full canvas)
 */
function getDefaultBounds(canvas: HTMLCanvasElement): ContentBounds {
  return {
    minX: 0,
    maxX: canvas.width,
    minY: 0,
    maxY: canvas.height,
    width: canvas.width,
    height: canvas.height,
    centerX: canvas.width / 2,
    centerY: canvas.height / 2
  };
}

/**
 * Export SVG as high-resolution PNG with content-aware cropping
 * This creates a fresh high-resolution render, not a screenshot
 */
export async function exportSVGAsImage(
  svgElement: SVGSVGElement,
  options: ExportOptions
): Promise<void> {
  const {
    filename,
    padding = 50,
    maxWidth = 8192, // Increased for better quality
    maxHeight = 8192,
    backgroundColor = '#03303E',
    scale = 3, // Higher default scale for crisp rendering
    watermark
  } = options;

  try {
    // Calculate content bounds to get the entire ARG content
    const bounds = calculateSVGContentBounds(svgElement);
    
    // Add padding around the content
    const paddedWidth = bounds.width + (padding * 2);
    const paddedHeight = bounds.height + (padding * 2);
    
    // Calculate scale to fit within max dimensions while maintaining aspect ratio
    const maxScale = Math.min(maxWidth / paddedWidth, maxHeight / paddedHeight);
    const finalScale = Math.min(scale, maxScale);
    
    const finalWidth = Math.round(paddedWidth * finalScale);
    const finalHeight = Math.round(paddedHeight * finalScale);

    // Create a completely new SVG optimized for export
    const exportSvg = svgElement.cloneNode(true) as SVGSVGElement;
    
    // Remove any transform attributes that might interfere with export
    exportSvg.removeAttribute('transform');
    
    // Set the viewBox to show the entire content with padding
    const viewBoxX = bounds.minX - padding;
    const viewBoxY = bounds.minY - padding;
    exportSvg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${paddedWidth} ${paddedHeight}`);
    exportSvg.setAttribute('width', finalWidth.toString());
    exportSvg.setAttribute('height', finalHeight.toString());
    
    // Ensure crisp rendering and proper styling
    exportSvg.setAttribute('shape-rendering', 'geometricPrecision');
    exportSvg.setAttribute('text-rendering', 'geometricPrecision');
    exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    exportSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Add explicit background rectangle to ensure proper background rendering
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', viewBoxX.toString());
    bgRect.setAttribute('y', viewBoxY.toString());
    bgRect.setAttribute('width', paddedWidth.toString());
    bgRect.setAttribute('height', paddedHeight.toString());
    bgRect.setAttribute('fill', backgroundColor);
    bgRect.setAttribute('stroke', 'none');
    exportSvg.insertBefore(bgRect, exportSvg.firstChild);
    
    // Ensure all computed styles are converted to inline styles for better preservation
    const allElements = exportSvg.querySelectorAll('*');
    allElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element as Element);
      const inlineStyle = element.getAttribute('style') || '';
      
      // Key style properties that should be preserved in export
      const importantProps = ['fill', 'stroke', 'stroke-width', 'stroke-opacity', 'fill-opacity', 'opacity'];
      
      importantProps.forEach(prop => {
        const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        const value = computedStyle.getPropertyValue(kebabProp);
        if (value && value !== 'none' && !element.hasAttribute(kebabProp)) {
          element.setAttribute(kebabProp, value);
        }
      });
    });
    
    // Convert SVG to string
    const svgData = new XMLSerializer().serializeToString(exportSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create high-resolution canvas for rasterization
    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get canvas context');

    // Enable high-quality rendering with anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Fill with background color first (ensure solid background)
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Load and draw SVG at high resolution
    const img = new Image();
    
    // Set up timeout for SVG loading
    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(svgUrl);
      throw new Error('SVG loading timed out');
    }, 10000); // 10 second timeout
    
    img.onload = () => {
      clearTimeout(timeoutId);
      
      try {
        // Clear and refill background to ensure no transparency issues
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, finalWidth, finalHeight);
        
        // Draw SVG with proper blending
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        // Add watermark if specified
        if (watermark) {
          addWatermark(ctx, finalWidth, finalHeight, watermark);
        }
        
        // Convert to PNG and download with maximum quality
        canvas.toBlob((blob) => {
          if (!blob) throw new Error('Failed to create image blob');
          downloadBlob(blob, filename);
        }, 'image/png', 1.0); // Maximum quality
        
        URL.revokeObjectURL(svgUrl);
      } catch (drawError) {
        URL.revokeObjectURL(svgUrl);
        throw new Error(`Failed to draw SVG to canvas: ${drawError}`);
      }
    };
    
    img.onerror = (error) => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(svgUrl);
      throw new Error(`Failed to load SVG image: ${error}`);
    };
    
    // Ensure cross-origin images are handled properly
    img.crossOrigin = 'anonymous';
    img.src = svgUrl;
  } catch (error) {
    console.error('Error exporting SVG image:', error);
    throw error;
  }
}

/**
 * Interface for 3D visualization data needed for export
 */
export interface Visualization3DData {
  nodes: Array<{
    id: number;
    position: [number, number, number];
    [key: string]: any;
  }>;
  edges: Array<{
    source: [number, number, number];
    target: [number, number, number];
    [key: string]: any;
  }>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  currentViewState: any;
}

/**
 * Export 3D visualization as high-resolution PNG by temporarily adjusting the view
 * This approach works with the existing DeckGL instance for better reliability
 */
export async function export3DVisualizationAsImage(
  data: Visualization3DData,
  deckGLRef: any,
  options: ExportOptions
): Promise<void> {
  const {
    filename,
    padding = 50,
    maxWidth = 4096,
    maxHeight = 4096,
    backgroundColor = '#03303E',
    scale = 2,
    watermark
  } = options;

  try {
    if (!deckGLRef.current || !data.nodes.length) {
      throw new Error('No 3D visualization data available for export');
    }

    // Calculate the optimal view state to show all content
    const { bounds, currentViewState } = data;
    
    // Calculate center of all content
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;  
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    
    // Calculate the size of the content
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    const contentDepth = bounds.maxZ - bounds.minZ;
    const maxDimension = Math.max(contentWidth, contentHeight, contentDepth);
    
    // Calculate zoom level to fit all content with padding
    const paddingFactor = 1.3; // 30% padding around content
    const optimalZoom = Math.max(0.1, Math.min(3.0, 1 / (maxDimension * paddingFactor)));
    
    // Get the current canvas - try different ways to access it
    let currentCanvas = null;
    
    // Try different ways to access the DeckGL canvas
    if (deckGLRef.current?.deck?.canvas) {
      currentCanvas = deckGLRef.current.deck.canvas;
    } else if (deckGLRef.current?.canvas) {
      currentCanvas = deckGLRef.current.canvas;
    } else {
      // Look for canvas in the DOM as fallback
      const containerElement = deckGLRef.current?.domElement || deckGLRef.current;
      if (containerElement) {
        currentCanvas = containerElement.querySelector('canvas');
      }
    }
    
    if (!currentCanvas) {
      throw new Error('Could not access DeckGL canvas - trying fallback method');
    }

    // Store original view state
    const originalViewState = { ...currentViewState };
    
    // Create export view state that shows all content while maintaining current orientation
    const exportViewState = {
      ...currentViewState,
      target: [centerX, centerY, centerZ],
      zoom: optimalZoom
    };

    // Calculate export dimensions
    const aspectRatio = currentCanvas.width / currentCanvas.height;
    let exportWidth = Math.min(maxWidth, 2048 * scale);
    let exportHeight = Math.min(maxHeight, exportWidth / aspectRatio);
    
    // Ensure we don't exceed max dimensions
    if (exportHeight > maxHeight) {
      exportHeight = maxHeight;
      exportWidth = exportHeight * aspectRatio;
    }

    exportWidth = Math.round(exportWidth);
    exportHeight = Math.round(exportHeight);

    // Store original canvas size
    const originalWidth = currentCanvas.width;
    const originalHeight = currentCanvas.height;
    const originalStyle = {
      width: currentCanvas.style.width,
      height: currentCanvas.style.height
    };

    try {
      // Temporarily resize the canvas for high-resolution export
      currentCanvas.width = exportWidth;
      currentCanvas.height = exportHeight;
      currentCanvas.style.width = `${exportWidth}px`;
      currentCanvas.style.height = `${exportHeight}px`;

      // Update DeckGL to use the new dimensions and view state
      deckGLRef.current.setProps({
        width: exportWidth,
        height: exportHeight,
        viewState: exportViewState
      });

      // Wait for the re-render to complete
      await new Promise(resolve => {
        // Use multiple animation frames to ensure render completion
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 200); // Additional wait for WebGL
          });
        });
      });

      // Create export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get export canvas context');

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill with background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      // Copy the high-resolution render
      ctx.drawImage(currentCanvas, 0, 0);

      // Add watermark if specified
      if (watermark) {
        addWatermark(ctx, exportWidth, exportHeight, watermark);
      }

      // Convert to PNG and download
      exportCanvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to create image blob');
        downloadBlob(blob, filename);
      }, 'image/png', 1.0);

    } finally {
      // Restore original canvas size and view state
      currentCanvas.width = originalWidth;
      currentCanvas.height = originalHeight;
      currentCanvas.style.width = originalStyle.width;
      currentCanvas.style.height = originalStyle.height;

      // Restore original view state and dimensions
      deckGLRef.current.setProps({
        width: originalWidth,
        height: originalHeight,
        viewState: originalViewState
      });

      // Wait for restore to complete
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
    }

  } catch (error) {
    console.error('Error exporting 3D visualization image:', error);
    throw error;
  }
}

/**
 * Legacy function for basic canvas export (fallback)
 * @deprecated Use export3DVisualizationAsImage for proper 3D export
 */
export async function exportCanvasAsImage(
  sourceCanvas: HTMLCanvasElement,
  options: ExportOptions
): Promise<void> {
  const {
    filename,
    padding = 50,
    maxWidth = 4096,
    maxHeight = 4096,
    backgroundColor = '#03303E',
    scale = 2,
    watermark
  } = options;

  try {
    // Wait for next frame to ensure WebGL render is complete
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // For legacy compatibility, just do a high-quality capture
    const finalWidth = Math.min(maxWidth, sourceCanvas.width * scale);
    const finalHeight = Math.min(maxHeight, sourceCanvas.height * scale);

    // Create high-resolution canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = finalWidth;
    exportCanvas.height = finalHeight;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Draw the source canvas scaled up
    ctx.drawImage(sourceCanvas, 0, 0, finalWidth, finalHeight);

    // Add watermark if specified
    if (watermark) {
      addWatermark(ctx, finalWidth, finalHeight, watermark);
    }

    // Convert to PNG and download
    exportCanvas.toBlob((blob) => {
      if (!blob) throw new Error('Failed to create image blob');
      downloadBlob(blob, filename);
    }, 'image/png', 1.0);
  } catch (error) {
    console.error('Error exporting canvas image:', error);
    throw error;
  }
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Add a watermark to a canvas context
 */
function addWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  options: WatermarkOptions
): void {
  const {
    text,
    subtext,
    position = 'bottom-right',
    color = '#14E2A8',
    backgroundColor = 'rgba(3, 48, 62, 0.8)',
    fontSize = 24,
    fontFamily = 'Arial, sans-serif',
    opacity = 0.9
  } = options;

  // Save current context state
  ctx.save();

  // Set global alpha for the entire watermark
  ctx.globalAlpha = opacity;

  // Configure text style
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Measure text to calculate watermark dimensions
  const mainTextMetrics = ctx.measureText(text);
  const subtextMetrics = subtext ? ctx.measureText(subtext) : { width: 0 };
  
  const maxTextWidth = Math.max(mainTextMetrics.width, subtextMetrics.width);
  const textHeight = fontSize;
  const lineSpacing = 4;
  const totalTextHeight = subtext ? textHeight * 2 + lineSpacing : textHeight;
  
  // Padding around text
  const paddingX = 16;
  const paddingY = 12;
  
  // Calculate watermark box dimensions
  const boxWidth = maxTextWidth + paddingX * 2;
  const boxHeight = totalTextHeight + paddingY * 2;
  
  // Calculate position based on the specified corner
  let x: number, y: number;
  const margin = 20;
  
  switch (position) {
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-right':
      x = canvasWidth - boxWidth - margin;
      y = margin;
      break;
    case 'bottom-left':
      x = margin;
      y = canvasHeight - boxHeight - margin;
      break;
    case 'bottom-right':
      x = canvasWidth - boxWidth - margin;
      y = canvasHeight - boxHeight - margin;
      break;
    case 'top-center':
      x = (canvasWidth - boxWidth) / 2;
      y = margin;
      break;
    case 'bottom-center':
    default:
      x = (canvasWidth - boxWidth) / 2;
      y = canvasHeight - boxHeight - margin;
      break;
  }

  // Draw background rectangle with rounded corners
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  const cornerRadius = 6;
  
  // Use roundRect if available, otherwise fallback to regular rectangle
  if ((ctx as any).roundRect) {
    (ctx as any).roundRect(x, y, boxWidth, boxHeight, cornerRadius);
  } else {
    // Fallback for browsers without roundRect support
    ctx.rect(x, y, boxWidth, boxHeight);
  }
  ctx.fill();

  // Draw main text
  ctx.fillStyle = color;
  ctx.fillText(text, x + paddingX, y + paddingY);

  // Draw subtext if provided
  if (subtext) {
    ctx.font = `${Math.round(fontSize * 0.7)}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.fillText(subtext, x + paddingX, y + paddingY + textHeight + lineSpacing);
  }

  // Restore context state
  ctx.restore();
} 