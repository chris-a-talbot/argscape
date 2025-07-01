import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SelfCheckQuestion } from './LessonPageHelpers';

// Types for the modular pedigree explorer
interface Individual {
  generation: number;
  position: number;
  affected: boolean;
  gender: 'male' | 'female';
  name: string;
  genotype: string;
  x?: number;
  y?: number;
}

interface Relationship {
  from: string;
  to: string;
  type: 'marriage' | 'parent';
}

interface TraitInfo {
  name: string;
  description: string;
  inheritance: string;
}

interface PedigreeColors {
  affected: string;
  unaffected: string;
  highlight: string;
  selection: string;
  connections: string;
  background: string;
  text: string;
}

interface PedigreeConfig {
  individuals: Record<string, Individual>;
  relationships: Relationship[];
  traitInfo: TraitInfo;
  showInheritanceToggle?: boolean;
  showTooltips?: boolean;
  showLegend?: boolean;
  showInfoPanel?: boolean;
  width?: number;
  height?: number;
  colors?: Partial<PedigreeColors>;
  title?: string;
  subtitle?: string;
}

// Default color theme
const defaultColors: PedigreeColors = {
  affected: '#ef4444',
  unaffected: 'transparent',
  highlight: '#fbbf24',
  selection: '#10b981',
  connections: '#64748b',
  background: 'transparent',
  text: '#f1f5f9'
};

// Modular Pedigree Explorer Component
export function PedigreeExplorer({ 
  individuals, 
  relationships, 
  traitInfo, 
  showInheritanceToggle = true,
  showTooltips = true,
  showLegend = true,
  showInfoPanel = true,
  width = 500,
  height = 350,
  colors = {},
  title = "Pedigree Explorer",
  subtitle = "Interactive Family Tree"
}: PedigreeConfig) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedIndividual, setSelectedIndividual] = useState<string | null>(null);
  const [showInheritance, setShowInheritance] = useState(false);
  const [highlightedTrait, setHighlightedTrait] = useState<string | null>(null);

  // Merge colors with defaults
  const themeColors = { ...defaultColors, ...colors };

  const handleIndividualClick = (id: string) => {
    setSelectedIndividual(id);
  };

  const toggleInheritanceView = () => {
    setShowInheritance(!showInheritance);
    setHighlightedTrait(showInheritance ? null : 'recessive');
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 30, right: 30, bottom: 60, left: 30 };

    // Clear previous content
    svg.selectAll("*").remove();

    // Set up SVG dimensions
    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background", themeColors.background);

    // Create main group for zoom/pan
    const g = svg.append("g");

    // Calculate positions for individuals with better spacing
    const generations = Array.from(new Set(Object.values(individuals).map(i => i.generation))).sort();
    const generationHeight = (height - margin.top - margin.bottom) / (generations.length + 1);

    // Position individuals with improved layout
    Object.entries(individuals).forEach(([id, individual]) => {
      const genIndex = generations.indexOf(individual.generation);
      const y = margin.top + (genIndex + 1) * generationHeight;
      
      // Get siblings in the same generation for better spacing
      const siblings = Object.entries(individuals).filter(([_, ind]) => ind.generation === individual.generation);
      const siblingIndex = siblings.findIndex(([sibId]) => sibId === id);
      
      // Improved spacing calculation
      const totalWidth = width - margin.left - margin.right;
      let x;
      if (siblings.length === 1) {
        x = width / 2;
      } else {
        const spacing = totalWidth / (siblings.length + 1);
        x = margin.left + (siblingIndex + 1) * spacing;
      }
      
      individual.x = x;
      individual.y = y;
    });

    // Create tooltip with enhanced styling
    const tooltip = showTooltips ? d3.select("body")
      .selectAll(".pedigree-tooltip")
      .data([null])
      .join("div")
      .attr("class", "pedigree-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(15, 23, 42, 0.95)")
      .style("color", "#f1f5f9")
      .style("border", "1px solid #475569")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("box-shadow", "0 10px 25px rgba(0, 0, 0, 0.5)")
      .style("backdrop-filter", "blur(8px)") : null;

    // Draw connections with enhanced styling
    const connections = g.append("g").attr("class", "connections");

    // Marriage lines (horizontal) with improved styling
    const marriages = relationships.filter(r => r.type === 'marriage');
    marriages.forEach(rel => {
      const from = individuals[rel.from as keyof typeof individuals];
      const to = individuals[rel.to as keyof typeof individuals];
      
      if (from?.x !== undefined && from?.y !== undefined && to?.x !== undefined && to?.y !== undefined) {
        connections.append("line")
          .attr("x1", from.x)
          .attr("y1", from.y)
          .attr("x2", to.x)
          .attr("y2", to.y)
          .attr("stroke", themeColors.connections)
          .attr("stroke-width", 3)
          .attr("stroke-linecap", "round")
          .style("opacity", 0)
          .transition()
          .duration(800)
          .delay(200)
          .style("opacity", 1);
      }
    });

    // Parent-child lines with smooth animations
    const parentRelations = relationships.filter(r => r.type === 'parent');
    
    // Group by child to draw connecting lines
    const childrenMap = new Map<string, string[]>();
    parentRelations.forEach(rel => {
      if (!childrenMap.has(rel.to)) {
        childrenMap.set(rel.to, []);
      }
      childrenMap.get(rel.to)!.push(rel.from);
    });

    childrenMap.forEach((parents, child) => {
      const childInd = individuals[child as keyof typeof individuals];
      const parentInds = parents.map(p => individuals[p as keyof typeof individuals]).filter(p => p);
      
      if (parentInds.length === 2 && childInd?.x !== undefined && childInd?.y !== undefined) {
        const parent1 = parentInds[0];
        const parent2 = parentInds[1];
        
        if (parent1?.x !== undefined && parent1?.y !== undefined && 
            parent2?.x !== undefined && parent2?.y !== undefined) {
          // Draw line from marriage midpoint to child with smooth curves
          const midX = (parent1.x + parent2.x) / 2;
          const midY = (parent1.y + parent2.y) / 2;
          const dropY = midY + generationHeight * 0.4;
          
          // Vertical drop from marriage line
          connections.append("line")
            .attr("x1", midX)
            .attr("y1", midY)
            .attr("x2", midX)
            .attr("y2", dropY)
            .attr("stroke", themeColors.connections)
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "round")
            .style("opacity", 0)
            .transition()
            .duration(600)
            .delay(400)
            .style("opacity", 1);
            
          // Horizontal line to child position
          connections.append("line")
            .attr("x1", midX)
            .attr("y1", dropY)
            .attr("x2", childInd.x)
            .attr("y2", dropY)
            .attr("stroke", themeColors.connections)
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "round")
            .style("opacity", 0)
            .transition()
            .duration(600)
            .delay(500)
            .style("opacity", 1);
            
          // Vertical line to child
          connections.append("line")
            .attr("x1", childInd.x)
            .attr("y1", dropY)
            .attr("x2", childInd.x)
            .attr("y2", childInd.y)
            .attr("stroke", themeColors.connections)
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "round")
            .style("opacity", 0)
            .transition()
            .duration(600)
            .delay(600)
            .style("opacity", 1);
        }
      }
    });

    // Draw individuals with enhanced animations and interactions
    const nodes = g.append("g").attr("class", "nodes");
    
    Object.entries(individuals).forEach(([id, individual], index) => {
      const nodeGroup = nodes.append("g")
        .attr("class", "individual")
        .attr("transform", `translate(${individual.x}, ${individual.y})`)
        .style("cursor", "pointer")
        .style("opacity", 0);

      // Animate node appearance
      nodeGroup
        .transition()
        .duration(500)
        .delay(index * 100)
        .style("opacity", 1);

      // Create symbol based on gender with enhanced styling
      const symbolSize = 18;
      const symbol = nodeGroup.append(individual.gender === 'male' ? 'rect' : 'circle');
      
      if (individual.gender === 'male') {
        symbol
          .attr("width", symbolSize)
          .attr("height", symbolSize)
          .attr("x", -symbolSize/2)
          .attr("y", -symbolSize/2)
          .attr("rx", 2);
      } else {
        symbol
          .attr("r", symbolSize/2);
      }

      // Enhanced styling based on affected status and inheritance highlighting
      symbol
        .attr("fill", individual.affected ? themeColors.affected : themeColors.unaffected)
        .attr("stroke", themeColors.text)
        .attr("stroke-width", 2.5)
        .attr("class", `individual-${id}`)
        .style("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))")
        .style("transition", "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)");

      // Add inheritance highlighting with smooth transitions
      if (showInheritance && (individual.genotype.includes('a'))) {
        symbol
          .transition()
          .duration(300)
          .attr("stroke", themeColors.highlight)
          .attr("stroke-width", 4)
          .style("filter", "drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))");
      }

      // Add selection highlight with pulsing effect
      if (selectedIndividual === id) {
        symbol
          .transition()
          .duration(300)
          .attr("stroke", themeColors.selection)
          .attr("stroke-width", 5)
          .style("filter", "drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))");
        
        // Pulsing selection ring
        const pulseRing = nodeGroup.append("circle")
          .attr("r", symbolSize + 6)
          .attr("fill", "none")
          .attr("stroke", themeColors.selection)
          .attr("stroke-width", 2)
          .attr("opacity", 0.7);
        
        // Animate pulsing
        function pulse() {
          pulseRing
            .transition()
            .duration(1000)
            .ease(d3.easeCircleInOut)
            .attr("r", symbolSize + 12)
            .attr("opacity", 0.2)
            .transition()
            .duration(1000)
            .ease(d3.easeCircleInOut)
            .attr("r", symbolSize + 6)
            .attr("opacity", 0.7)
            .on("end", pulse);
        }
        pulse();
      }

      // Add label with improved typography
      nodeGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", symbolSize + 16)
        .attr("font-size", "11px")
        .attr("font-weight", "500")
        .attr("fill", "#e2e8f0")
        .style("text-shadow", "0 1px 2px rgba(0, 0, 0, 0.5)")
        .text(id);

      // Add genotype label if showing inheritance with enhanced styling
      if (showInheritance) {
        nodeGroup.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", -symbolSize - 8)
          .attr("font-size", "10px")
          .attr("font-family", "ui-monospace, monospace")
          .attr("font-weight", "600")
          .attr("fill", themeColors.highlight)
          .style("text-shadow", "0 1px 2px rgba(0, 0, 0, 0.8)")
          .style("opacity", 0)
          .text(individual.genotype)
          .transition()
          .duration(300)
          .delay(200)
          .style("opacity", 1);
      }

      // Enhanced interactivity
      nodeGroup
        .on("click", (event) => {
          event.stopPropagation();
          handleIndividualClick(id);
          
          // Add click ripple effect
          const ripple = nodeGroup.append("circle")
            .attr("r", 0)
            .attr("fill", "none")
            .attr("stroke", themeColors.selection)
            .attr("stroke-width", 2)
            .attr("opacity", 0.8);
          
          ripple
            .transition()
            .duration(400)
            .ease(d3.easeCircleOut)
            .attr("r", symbolSize + 20)
            .attr("opacity", 0)
            .remove();
        })
        .on("mouseover", (event) => {
          if (!showTooltips) return;
          
          // Enhanced hover effects
          if (selectedIndividual !== id) {
            symbol
              .transition()
              .duration(200)
              .attr("stroke-width", 4)
              .style("filter", "drop-shadow(0 4px 12px rgba(16, 185, 129, 0.4))");
          }
          
          // Show enhanced tooltip
          const tooltipContent = `
            <div style="margin-bottom: 8px;"><strong style="color: #10b981;">${individual.name}</strong> <span style="color: #94a3b8;">(${id})</span></div>
            <div style="margin-bottom: 4px;"><strong>Gender:</strong> ${individual.gender}</div>
            <div style="margin-bottom: 4px;"><strong>Genotype:</strong> <span style="font-family: ui-monospace, monospace; background: rgba(100, 116, 139, 0.3); padding: 2px 6px; border-radius: 4px;">${individual.genotype}</span></div>
            <div style="margin-bottom: 4px;"><strong>Status:</strong> <span style="color: ${individual.affected ? '#ef4444' : '#10b981'};">${individual.affected ? 'Affected' : 'Unaffected'}</span></div>
            <div><strong>Generation:</strong> ${individual.generation}</div>
          `;
          
          tooltip!
            .style("visibility", "visible")
            .html(tooltipContent)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mousemove", (event) => {
          if (!showTooltips) return;
          tooltip!
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", () => {
          if (selectedIndividual !== id) {
            const currentStroke = showInheritance && individual.genotype.includes('a') ? 4 : 2.5;
            const currentColor = showInheritance && individual.genotype.includes('a') ? themeColors.highlight : themeColors.text;
            symbol
              .transition()
              .duration(200)
              .attr("stroke-width", currentStroke)
              .attr("stroke", currentColor)
              .style("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))");
          }
          if (showTooltips) {
            tooltip!.style("visibility", "hidden");
          }
        });
    });

    // Add enhanced legend with larger symbols
    if (showLegend) {
      const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(10, ${height - 95})`);

      // Legend background for better visibility
      const legendBackground = legend.append("rect")
        .attr("x", -10)
        .attr("y", -10)
        .attr("width", 140)
        .attr("height", 85)
        .attr("fill", "rgba(15, 23, 42, 0.8)")
        .attr("stroke", "#475569")
        .attr("stroke-width", 1)
        .attr("rx", 6)
        .style("opacity", 0);

      legendBackground
        .transition()
        .duration(300)
        .delay(1200)
        .style("opacity", 1);

      const legendData = [
        { type: 'male', label: 'Male', x: 0, y: 0 },
        { type: 'female', label: 'Female', x: 0, y: 25 },
        { type: 'affected', label: 'Affected', x: 0, y: 50 }
      ];

      legendData.forEach((item, index) => {
        const legendItem = legend.append("g")
          .style("opacity", 0);

        // Animate legend appearance
        legendItem
          .transition()
          .duration(300)
          .delay(1000 + index * 100)
          .style("opacity", 1);

        if (item.type === 'male') {
          legendItem.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("x", item.x)
            .attr("y", item.y - 9)
            .attr("rx", 3)
            .attr("fill", themeColors.unaffected)
            .attr("stroke", themeColors.text)
            .attr("stroke-width", 2.5)
            .style("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))");
        } else if (item.type === 'female') {
          legendItem.append("circle")
            .attr("cx", item.x + 9)
            .attr("cy", item.y)
            .attr("r", 9)
            .attr("fill", themeColors.unaffected)
            .attr("stroke", themeColors.text)
            .attr("stroke-width", 2.5)
            .style("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))");
        } else {
          legendItem.append("circle")
            .attr("cx", item.x + 9)
            .attr("cy", item.y)
            .attr("r", 9)
            .attr("fill", themeColors.affected)
            .attr("stroke", themeColors.text)
            .attr("stroke-width", 2.5)
            .style("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))");
        }
        
        legendItem.append("text")
          .attr("x", item.x + 30)
          .attr("y", item.y + 5)
          .attr("font-size", "14px")
          .attr("font-weight", "600")
          .attr("fill", "#e2e8f0")
          .style("text-shadow", "0 1px 2px rgba(0, 0, 0, 0.8)")
          .text(item.label);
      });
    }

    // Add enhanced zoom and pan
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Add double-click to reset zoom
    svg.on("dblclick.zoom", () => {
      svg.transition()
        .duration(500)
        .call(zoom.transform as any, d3.zoomIdentity);
    });

    // Cleanup function
    return () => {
      if (tooltip) {
        tooltip.remove();
      }
    };
  }, [individuals, relationships, selectedIndividual, showInheritance, themeColors, width, height, showTooltips, showLegend]);

  // Render the component
  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* SVG Pedigree visualization */}
        <div className="relative">
          <div className="aspect-[4/3] bg-gradient-to-br from-sp-pale-green/20 to-sp-dark-blue/50 rounded-lg p-4 border border-sp-pale-green/20">
            <svg ref={svgRef} className="w-full h-full" />
          </div>
          <p className="text-xs text-sp-white/60 mt-3 text-center">
            <span className="inline-block mr-3">🖱️ Click to select</span>
            <span className="inline-block mr-3">🔍 Scroll to zoom</span>
            <span className="inline-block">↔️ Drag to pan</span>
          </p>
        </div>

        {/* Information panel */}
        {showInfoPanel && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sp-pale-green">{title}</h3>
            
            <div className="bg-sp-very-dark-blue/50 rounded-lg p-4 border border-sp-pale-green/10">
              {showInheritanceToggle && (
                <button
                  onClick={toggleInheritanceView}
                  className="w-full px-4 py-2 bg-sp-pale-green/20 hover:bg-sp-pale-green/30 rounded text-sp-pale-green font-medium transition-all duration-200 mb-3 border border-sp-pale-green/30"
                >
                  {showInheritance ? 'Hide' : 'Show'} Inheritance Pattern
                </button>
              )}
              
              {showInheritance && (
                <div className="mb-4 p-3 bg-yellow-400/10 rounded border-l-4 border-yellow-400">
                  <h4 className="font-semibold text-yellow-400 mb-1">Recessive Inheritance Pattern</h4>
                  <p className="text-xs text-sp-white/80">
                    Golden highlights mark carriers and affected individuals. Genotypes appear above symbols. Notice how the trait skips Generation II completely, then reappears in Generation III when two carriers have children!
                  </p>
                </div>
              )}

              {selectedIndividual ? (
                <div className="p-3 bg-sp-pale-green/10 rounded border border-sp-pale-green/20">
                  <h4 className="font-semibold text-sp-white mb-2">
                    {individuals[selectedIndividual as keyof typeof individuals].name} 
                    <span className="text-sm text-sp-white/60 ml-2">({selectedIndividual})</span>
                  </h4>
                  <div className="space-y-2 text-sm text-sp-white/80">
                    <p><strong>Gender:</strong> {individuals[selectedIndividual as keyof typeof individuals].gender}</p>
                    <p><strong>Genotype:</strong> <span className="font-mono bg-gray-700 px-2 py-1 rounded text-yellow-300">{individuals[selectedIndividual as keyof typeof individuals].genotype}</span></p>
                    <p><strong>Status:</strong> <span className={individuals[selectedIndividual as keyof typeof individuals].affected ? 'text-red-400' : 'text-green-400'}>{individuals[selectedIndividual as keyof typeof individuals].affected ? 'Affected' : 'Unaffected'}</span></p>
                    <p><strong>Generation:</strong> {individuals[selectedIndividual as keyof typeof individuals].generation}</p>
                  </div>
                  <div className="mt-3 p-2 bg-sp-pale-green/5 rounded border-l-2 border-sp-pale-green">
                    <p className="text-xs text-sp-white/70">
                      {individuals[selectedIndividual as keyof typeof individuals].genotype === 'AA' && 'Homozygous dominant - does not carry the recessive allele.'}
                      {individuals[selectedIndividual as keyof typeof individuals].genotype === 'Aa' && 'Heterozygous carrier - carries one recessive allele but is not affected.'}
                      {individuals[selectedIndividual as keyof typeof individuals].genotype === 'aa' && 'Homozygous recessive - has two recessive alleles and is affected.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-sp-white/5 rounded border border-sp-white/10">
                  <p className="text-sm text-sp-white/80 text-center">
                    Click on individuals in the pedigree to explore their genetic information and inheritance patterns.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-sp-very-dark-blue/50 rounded-lg p-4 border border-sp-pale-green/10">
              <h4 className="font-semibold text-sp-white mb-2">Interactive Features</h4>
              <ul className="text-xs text-sp-white/80 space-y-1">
                <li>• <strong>Click:</strong> Select individual for detailed information</li>
                <li>• <strong>Hover:</strong> Quick tooltip with genetic details</li>
                <li>• <strong>Scroll:</strong> Zoom in/out for better viewing</li>
                <li>• <strong>Drag:</strong> Pan around the pedigree</li>
                <li>• <strong>Double-click:</strong> Reset zoom to fit view</li>
                <li>• <strong>Toggle:</strong> Show/hide inheritance patterns</li>
              </ul>
            </div>

            <div className="bg-sp-very-dark-blue/50 rounded-lg p-4 border border-sp-pale-green/10">
              <h4 className="font-semibold text-sp-white mb-2">About This Pedigree</h4>
              <p className="text-xs text-sp-white/80 mb-2">{traitInfo.description}</p>
              <p className="text-xs text-sp-white/70 mb-2">{traitInfo.inheritance}</p>
              <div className="mt-3 p-2 bg-sp-pale-green/5 rounded border-l-2 border-sp-pale-green">
                <p className="text-xs text-sp-white/70">
                  <strong>Key Pattern:</strong> Gen I has affected individuals → Gen II are all carriers (unaffected) → Gen III shows the trait again when carriers reproduce.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Interactive Pedigree Preview Component - now uses the modular PedigreeExplorer
export function InteractivePedigreePreview() {
  // Enhanced pedigree data structure demonstrating trait skipping generations
  const individuals = {
    // Generation I - One affected person in each family
    'I-1': { generation: 1, position: 1, affected: true, gender: 'male' as const, name: 'John', genotype: 'aa', x: 0, y: 0 },
    'I-2': { generation: 1, position: 2, affected: false, gender: 'female' as const, name: 'Mary', genotype: 'AA', x: 0, y: 0 },
    'I-3': { generation: 1, position: 3, affected: false, gender: 'male' as const, name: 'Robert', genotype: 'AA', x: 0, y: 0 },
    'I-4': { generation: 1, position: 4, affected: true, gender: 'female' as const, name: 'Anna', genotype: 'aa', x: 0, y: 0 },
    
    // Generation II - All carriers, none affected (trait skips this generation)
    'II-1': { generation: 2, position: 1, affected: false, gender: 'male' as const, name: 'James', genotype: 'Aa', x: 0, y: 0 },
    'II-2': { generation: 2, position: 2, affected: false, gender: 'female' as const, name: 'Sarah', genotype: 'Aa', x: 0, y: 0 },
    'II-3': { generation: 2, position: 3, affected: false, gender: 'female' as const, name: 'Lisa', genotype: 'Aa', x: 0, y: 0 },
    'II-4': { generation: 2, position: 4, affected: false, gender: 'male' as const, name: 'David', genotype: 'Aa', x: 0, y: 0 },
    
    // Generation III - Trait reappears when two carriers have children
    'III-1': { generation: 3, position: 1, affected: false, gender: 'female' as const, name: 'Emma', genotype: 'AA', x: 0, y: 0 },
    'III-2': { generation: 3, position: 2, affected: true, gender: 'male' as const, name: 'William', genotype: 'aa', x: 0, y: 0 },
    'III-3': { generation: 3, position: 3, affected: false, gender: 'female' as const, name: 'Sophie', genotype: 'Aa', x: 0, y: 0 }
  };

  const relationships = [
    // Generation I marriages (unrelated individuals)
    { from: 'I-1', to: 'I-2', type: 'marriage' as const },
    { from: 'I-3', to: 'I-4', type: 'marriage' as const },
    
    // Generation I to II parent relationships
    { from: 'I-1', to: 'II-1', type: 'parent' as const },
    { from: 'I-1', to: 'II-2', type: 'parent' as const },
    { from: 'I-2', to: 'II-1', type: 'parent' as const },
    { from: 'I-2', to: 'II-2', type: 'parent' as const },
    { from: 'I-3', to: 'II-3', type: 'parent' as const },
    { from: 'I-3', to: 'II-4', type: 'parent' as const },
    { from: 'I-4', to: 'II-3', type: 'parent' as const },
    { from: 'I-4', to: 'II-4', type: 'parent' as const },
    
    // Generation II marriage (middle children from different families - no crossing lines)
    { from: 'II-2', to: 'II-3', type: 'marriage' as const },
    
    // Generation II to III parent relationships (all 3 children from one couple)
    { from: 'II-2', to: 'III-1', type: 'parent' as const },
    { from: 'II-2', to: 'III-2', type: 'parent' as const },
    { from: 'II-2', to: 'III-3', type: 'parent' as const },
    { from: 'II-3', to: 'III-1', type: 'parent' as const },
    { from: 'II-3', to: 'III-2', type: 'parent' as const },
    { from: 'II-3', to: 'III-3', type: 'parent' as const }
  ];

  const traitInfo = {
    name: 'Recessive Genetic Condition',
    description: 'A recessive trait where individuals with genotype "aa" are affected (filled symbols)',
    inheritance: 'Autosomal recessive - demonstrates how traits can skip generations and reappear when carriers have children'
  };

  return (
    <PedigreeExplorer
      individuals={individuals}
      relationships={relationships}
      traitInfo={traitInfo}
      title="Family Pedigree Explorer"
      subtitle="Interactive Family Tree"
      showInheritanceToggle={true}
      showTooltips={true}
      showLegend={true}
      showInfoPanel={true}
      width={500}
      height={350}
    />
  );
}

// Mendelian Inheritance Simulator Component
export function MendelianInheritanceSimulator() {
  const [parent1Genotype, setParent1Genotype] = useState('AA');
  const [parent2Genotype, setParent2Genotype] = useState('aa');
  const [showResults, setShowResults] = useState(false);
  const [selectedTrait, setSelectedTrait] = useState('flowerColor');
  const [crossCount, setCrossCount] = useState(0);

  const traits = {
    flowerColor: {
      name: 'Flower Color',
      dominantAllele: { symbol: 'R', trait: 'Red', color: '#DC2626' },
      recessiveAllele: { symbol: 'r', trait: 'White', color: '#F3F4F6' },
      description: 'Red flowers (R) are dominant over white flowers (r)'
    },
    plantHeight: {
      name: 'Plant Height',
      dominantAllele: { symbol: 'T', trait: 'Tall', color: '#059669' },
      recessiveAllele: { symbol: 't', trait: 'Short', color: '#DC2626' },
      description: 'Tall plants (T) are dominant over short plants (t)'
    },
    seedShape: {
      name: 'Seed Shape', 
      dominantAllele: { symbol: 'S', trait: 'Smooth', color: '#2563EB' },
      recessiveAllele: { symbol: 's', trait: 'Wrinkled', color: '#7C2D12' },
      description: 'Smooth seeds (S) are dominant over wrinkled seeds (s)'
    }
  };

  const currentTrait = traits[selectedTrait as keyof typeof traits];
  const D = currentTrait.dominantAllele.symbol; // Dominant allele
  const R = currentTrait.recessiveAllele.symbol; // Recessive allele

  // Convert generic genotypes to trait-specific ones
  const convertGenotype = (genotype: string) => {
    return genotype.replace(/A/g, D).replace(/a/g, R);
  };

  const getGenotypeOptions = () => [
    `${D}${D}`, `${D}${R}`, `${R}${R}`
  ];

  const performCross = () => {
    const p1 = convertGenotype(parent1Genotype);
    const p2 = convertGenotype(parent2Genotype);
    
    const p1Alleles = [p1[0], p1[1]];
    const p2Alleles = [p2[0], p2[1]];
    
    const offspring: string[] = [];
    p1Alleles.forEach(a1 => {
      p2Alleles.forEach(a2 => {
        // Sort alleles so dominant comes first
        const genotype = [a1, a2].sort((a, b) => {
          if (a === D && b === R) return -1;
          if (a === R && b === D) return 1;
          return 0;
        }).join('');
        offspring.push(genotype);
      });
    });

    return offspring;
  };

  const offspring = performCross();
  const genotypeCounts = offspring.reduce((acc, genotype) => {
    acc[genotype] = (acc[genotype] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const getPhenotype = (genotype: string) => {
    if (genotype.includes(D)) {
      return {
        trait: currentTrait.dominantAllele.trait,
        color: currentTrait.dominantAllele.color
      };
    } else {
      return {
        trait: currentTrait.recessiveAllele.trait,
        color: currentTrait.recessiveAllele.color
      };
    }
  };

  const phenotypeCounts = Object.entries(genotypeCounts).reduce((acc, [genotype, count]) => {
    const phenotype = getPhenotype(genotype);
    acc[phenotype.trait] = (acc[phenotype.trait] || 0) + count;
    return acc;
  }, {} as { [key: string]: number });

  const runCross = () => {
    setShowResults(true);
    setCrossCount(prev => prev + 1);
  };

  const resetCross = () => {
    setShowResults(false);
    setParent1Genotype('AA');
    setParent2Genotype('aa');
    setCrossCount(0);
  };

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Control Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Virtual Genetics Lab</h3>
          
          {/* Trait Selector */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Select Trait to Study</h4>
            <div className="space-y-2">
              {Object.entries(traits).map(([key, trait]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="trait"
                    value={key}
                    checked={selectedTrait === key}
                    onChange={(e) => setSelectedTrait(e.target.value)}
                    className="w-4 h-4 text-sp-pale-green"
                  />
                  <div>
                    <span className="text-sp-white font-medium">{trait.name}</span>
                    <p className="text-xs text-sp-white/70">{trait.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Parent Genotype Selection */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Parent Genotypes</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sp-white mb-2">Parent 1</label>
                <select 
                  value={parent1Genotype}
                  onChange={(e) => setParent1Genotype(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-sp-pale-green"
                >
                  {getGenotypeOptions().map(genotype => (
                    <option key={genotype} value={genotype.replace(new RegExp(D, 'g'), 'A').replace(new RegExp(R, 'g'), 'a')}>
                      {genotype}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-sp-white mb-2">Parent 2</label>
                <select 
                  value={parent2Genotype}
                  onChange={(e) => setParent2Genotype(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-sp-pale-green"
                >
                  {getGenotypeOptions().map(genotype => (
                    <option key={genotype} value={genotype.replace(new RegExp(D, 'g'), 'A').replace(new RegExp(R, 'g'), 'a')}>
                      {genotype}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={runCross}
              className="flex-1 px-4 py-2 bg-sp-pale-green hover:bg-sp-pale-green/80 text-sp-very-dark-blue font-semibold rounded transition-colors"
            >
              Perform Cross
            </button>
            <button
              onClick={resetCross}
              className="px-4 py-2 border border-gray-500 text-gray-300 hover:bg-gray-700 rounded transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Cross Results</h3>
          
          {!showResults ? (
            <div className="bg-sp-very-dark-blue/50 rounded-lg p-8 text-center">
              <p className="text-sp-white/60">Select parent genotypes and click "Perform Cross" to see Mendelian inheritance in action!</p>
            </div>
          ) : (
            <>
              {/* Punnett Square */}
              <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
                <h4 className="font-semibold text-sp-white mb-3">Punnett Square</h4>
                <div className="inline-block">
                  <div className="grid grid-cols-3 gap-1 text-center text-sm">
                    {/* Header row */}
                    <div></div>
                    <div className="font-semibold text-sp-pale-green p-2">{convertGenotype(parent2Genotype)[0]}</div>
                    <div className="font-semibold text-sp-pale-green p-2">{convertGenotype(parent2Genotype)[1]}</div>
                    
                    {/* First parent allele row */}
                    <div className="font-semibold text-sp-pale-green p-2">{convertGenotype(parent1Genotype)[0]}</div>
                    <div className="bg-gray-700 p-2 rounded font-mono">
                      {[convertGenotype(parent1Genotype)[0], convertGenotype(parent2Genotype)[0]].sort((a, b) => a === D ? -1 : 1).join('')}
                    </div>
                    <div className="bg-gray-700 p-2 rounded font-mono">
                      {[convertGenotype(parent1Genotype)[0], convertGenotype(parent2Genotype)[1]].sort((a, b) => a === D ? -1 : 1).join('')}
                    </div>
                    
                    {/* Second parent allele row */}
                    <div className="font-semibold text-sp-pale-green p-2">{convertGenotype(parent1Genotype)[1]}</div>
                    <div className="bg-gray-700 p-2 rounded font-mono">
                      {[convertGenotype(parent1Genotype)[1], convertGenotype(parent2Genotype)[0]].sort((a, b) => a === D ? -1 : 1).join('')}
                    </div>
                    <div className="bg-gray-700 p-2 rounded font-mono">
                      {[convertGenotype(parent1Genotype)[1], convertGenotype(parent2Genotype)[1]].sort((a, b) => a === D ? -1 : 1).join('')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Genotype Ratios */}
              <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
                <h4 className="font-semibold text-sp-white mb-3">Genotype Ratios</h4>
                <div className="space-y-2">
                  {Object.entries(genotypeCounts).map(([genotype, count]) => (
                    <div key={genotype} className="flex items-center justify-between">
                      <span className="font-mono text-sp-white">{genotype}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-700 rounded-full h-4 relative">
                          <div 
                            className="bg-sp-pale-green h-full rounded-full transition-all duration-500"
                            style={{ width: `${(count / offspring.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-sp-white/80 w-12">{count}/4</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phenotype Results */}
              <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
                <h4 className="font-semibold text-sp-white mb-3">Phenotype Results</h4>
                <div className="space-y-3">
                  {Object.entries(phenotypeCounts).map(([phenotype, count]) => {
                    const isReces = phenotype === currentTrait.recessiveAllele.trait;
                    const color = isReces ? currentTrait.recessiveAllele.color : currentTrait.dominantAllele.color;
                    return (
                      <div key={phenotype} className="flex items-center space-x-3">
                        <div 
                          className="w-6 h-6 rounded border-2 border-white"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex-1">
                          <span className="text-sp-white font-medium">{phenotype}</span>
                          <div className="w-full bg-gray-700 rounded-full h-3 mt-1">
                            <div 
                              className="bg-sp-pale-green h-full rounded-full transition-all duration-500"
                              style={{ width: `${(count / offspring.length) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-sp-white/80">{count}/4 ({Math.round((count / offspring.length) * 100)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Analysis */}
              <div className="bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20">
                <h4 className="font-semibold text-sp-pale-green mb-2">Mendelian Analysis</h4>
                <p className="text-sm text-sp-white/80">
                  This cross demonstrates {Object.keys(genotypeCounts).length === 1 ? 'uniform inheritance' : 
                  Object.keys(phenotypeCounts).length === 1 ? 'complete dominance' : 'classic Mendelian ratios'}
                  {Object.keys(phenotypeCounts).length === 2 && ` with a ${Object.values(phenotypeCounts)[0]}:${Object.values(phenotypeCounts)[1]} phenotypic ratio`}.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-xs text-sp-white/60 text-center">
        Experiment with different parent genotypes to observe various Mendelian inheritance patterns
      </div>
    </div>
  );
}

// Meiosis Simulation Component
export function MeiosisSimulation() {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCrossover, setShowCrossover] = useState(false);

  const phases = [
    { name: 'Interphase', description: 'DNA replication occurs, creating sister chromatids' },
    { name: 'Prophase I', description: 'Homologous chromosomes pair up and crossing over occurs' },
    { name: 'Metaphase I', description: 'Paired chromosomes align at the cell center' },
    { name: 'Anaphase I', description: 'Homologous chromosomes separate to opposite poles' },
    { name: 'Telophase I', description: 'First division completes, forming two haploid cells' },
    { name: 'Prophase II', description: 'Chromosomes condense in both cells' },
    { name: 'Metaphase II', description: 'Chromosomes align at cell centers' },
    { name: 'Anaphase II', description: 'Sister chromatids separate' },
    { name: 'Telophase II', description: 'Four haploid gametes are formed' }
  ];

  const nextPhase = () => {
    setCurrentPhase((prev) => (prev + 1) % phases.length);
  };

  const prevPhase = () => {
    setCurrentPhase((prev) => (prev - 1 + phases.length) % phases.length);
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(nextPhase, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Visual Simulation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Meiosis Phases</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4 aspect-square flex flex-col items-center justify-center">
            {/* Simple visual representation */}
            <div className="text-center mb-4">
              <h4 className="font-semibold text-sp-white mb-2">{phases[currentPhase].name}</h4>
              <div className="text-6xl">
                {currentPhase === 0 && '🔴'} {/* Interphase */}
                {currentPhase === 1 && '🧬'} {/* Prophase I */}
                {currentPhase === 2 && '⚪'} {/* Metaphase I */}
                {currentPhase === 3 && '↔️'} {/* Anaphase I */}
                {currentPhase === 4 && '🔵🔵'} {/* Telophase I */}
                {currentPhase === 5 && '🧬🧬'} {/* Prophase II */}
                {currentPhase === 6 && '⚪⚪'} {/* Metaphase II */}
                {currentPhase === 7 && '↔️↔️'} {/* Anaphase II */}
                {currentPhase === 8 && '🟢🟢🟢🟢'} {/* Telophase II */}
              </div>
            </div>
            
            {/* Phase progress indicator */}
            <div className="flex space-x-1 mb-4">
              {phases.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentPhase ? 'bg-sp-pale-green' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex space-x-2">
            <button
              onClick={prevPhase}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-1 px-3 py-2 bg-sp-pale-green hover:bg-sp-pale-green/80 text-sp-very-dark-blue font-semibold rounded transition-colors"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={nextPhase}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Information Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Phase Details</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-2">{phases[currentPhase].name}</h4>
            <p className="text-sm text-sp-white/80 mb-4">{phases[currentPhase].description}</p>
            
            {currentPhase === 1 && (
              <div className="p-3 bg-yellow-400/10 rounded border-l-4 border-yellow-400">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-yellow-400">Crossing Over</span>
                  <button
                    onClick={() => setShowCrossover(!showCrossover)}
                    className="text-xs px-2 py-1 bg-yellow-400/20 rounded"
                  >
                    {showCrossover ? 'Hide' : 'Show'} Details
                  </button>
                </div>
                {showCrossover && (
                  <p className="text-xs text-sp-white/70">
                    Homologous chromosomes exchange genetic material, creating new combinations of alleles. 
                    This process increases genetic diversity in gametes.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Key Outcomes</h4>
            <ul className="space-y-2 text-sm text-sp-white/80">
              <li>• <strong>Reduction Division:</strong> Diploid → Haploid</li>
              <li>• <strong>Genetic Recombination:</strong> New allele combinations</li>
              <li>• <strong>Independent Assortment:</strong> Random chromosome distribution</li>
              <li>• <strong>Four Unique Gametes:</strong> Each genetically different</li>
            </ul>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-2">Comparison</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium text-sp-pale-green">Mitosis</div>
                <div className="text-sp-white/70">• Produces diploid cells</div>
                <div className="text-sp-white/70">• Genetically identical</div>
                <div className="text-sp-white/70">• Growth & repair</div>
              </div>
              <div>
                <div className="font-medium text-sp-pale-green">Meiosis</div>
                <div className="text-sp-white/70">• Produces haploid gametes</div>
                <div className="text-sp-white/70">• Genetically diverse</div>
                <div className="text-sp-white/70">• Sexual reproduction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-sp-white/60 text-center">
        Use controls to step through meiosis phases or play the full animation
      </div>
    </div>
  );
}

// Pedigree Builder Component
export function PedigreeBuilder() {
  const [individuals, setIndividuals] = useState<Record<string, Individual>>({
    'I-1': { generation: 1, position: 1, affected: false, gender: 'male' as const, name: 'Individual 1', genotype: 'Aa', x: 0, y: 0 }
  });
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedTool, setSelectedTool] = useState<'add-male' | 'add-female' | 'connect' | 'delete'>('add-male');
  const [selectedIndividuals, setSelectedIndividuals] = useState<string[]>([]);
  const [nextId, setNextId] = useState(2);

  const addIndividual = (gender: 'male' | 'female') => {
    const generation = Math.max(...Object.values(individuals).map(i => i.generation), 0) + 1;
    const newId = `I-${nextId}`;
    
    setIndividuals(prev => ({
      ...prev,
      [newId]: {
        generation,
        position: 1,
        affected: false,
        gender,
        name: `Individual ${nextId}`,
        genotype: 'Aa',
        x: 0,
        y: 0
      }
    }));
    setNextId(prev => prev + 1);
  };

  const toggleAffected = (id: string) => {
    setIndividuals(prev => ({
      ...prev,
      [id]: { ...prev[id], affected: !prev[id].affected }
    }));
  };

  const deleteIndividual = (id: string) => {
    setIndividuals(prev => {
      const newInds = { ...prev };
      delete newInds[id];
      return newInds;
    });
    setRelationships(prev => prev.filter(rel => rel.from !== id && rel.to !== id));
  };

  const addRelationship = (type: 'marriage' | 'parent') => {
    if (selectedIndividuals.length === 2) {
      const [from, to] = selectedIndividuals;
      setRelationships(prev => [...prev, { from, to, type }]);
      setSelectedIndividuals([]);
    }
  };

  const handleIndividualClick = (id: string) => {
    if (selectedTool === 'delete') {
      deleteIndividual(id);
    } else if (selectedTool === 'connect') {
      if (selectedIndividuals.includes(id)) {
        setSelectedIndividuals(prev => prev.filter(sid => sid !== id));
      } else if (selectedIndividuals.length < 2) {
        setSelectedIndividuals(prev => [...prev, id]);
      }
    } else {
      toggleAffected(id);
    }
  };

  const clearPedigree = () => {
    setIndividuals({});
    setRelationships([]);
    setSelectedIndividuals([]);
    setNextId(1);
  };

  const traitInfo = {
    name: 'Custom Trait',
    description: 'Build your own pedigree to explore inheritance patterns',
    inheritance: 'Click individuals to toggle affected status, use tools to add family members and relationships'
  };

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tools Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Pedigree Builder Tools</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Add Individuals</h4>
            <div className="space-y-2">
              <button
                onClick={() => { setSelectedTool('add-male'); addIndividual('male'); }}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white font-medium transition-colors"
              >
                + Add Male (□)
              </button>
              <button
                onClick={() => { setSelectedTool('add-female'); addIndividual('female'); }}
                className="w-full px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded text-sm text-white font-medium transition-colors"
              >
                + Add Female (○)
              </button>
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Active Tool</h4>
            <div className="space-y-2">
              {[
                { id: 'add-male', label: 'Add Male', desc: 'Click to add males' },
                { id: 'add-female', label: 'Add Female', desc: 'Click to add females' },
                { id: 'connect', label: 'Connect', desc: 'Select 2 individuals to connect' },
                { id: 'delete', label: 'Delete', desc: 'Click individuals to delete' }
              ].map(tool => (
                <label key={tool.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tool"
                    value={tool.id}
                    checked={selectedTool === tool.id}
                    onChange={(e) => setSelectedTool(e.target.value as any)}
                    className="w-4 h-4 text-sp-pale-green"
                  />
                  <div>
                    <span className="text-sp-white text-sm font-medium">{tool.label}</span>
                    <div className="text-xs text-sp-white/60">{tool.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedTool === 'connect' && selectedIndividuals.length > 0 && (
            <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
              <h4 className="font-semibold text-sp-white mb-3">
                Connect ({selectedIndividuals.length}/2 selected)
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => addRelationship('marriage')}
                  disabled={selectedIndividuals.length !== 2}
                  className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm text-white transition-colors"
                >
                  Marriage
                </button>
                <button
                  onClick={() => addRelationship('parent')}
                  disabled={selectedIndividuals.length !== 2}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm text-white transition-colors"
                >
                  Parent-Child
                </button>
              </div>
            </div>
          )}

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Actions</h4>
            <button
              onClick={clearPedigree}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm text-white font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Pedigree Display */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-sp-pale-green mb-4">Your Pedigree</h3>
          
          {Object.keys(individuals).length === 0 ? (
            <div className="bg-sp-very-dark-blue/50 rounded-lg p-8 text-center">
              <p className="text-sp-white/60 mb-4">Your pedigree is empty</p>
              <p className="text-sm text-sp-white/40">Use the tools on the left to add individuals and build your family tree</p>
            </div>
          ) : (
            <PedigreeExplorer
              individuals={individuals}
              relationships={relationships}
              traitInfo={traitInfo}
              showInheritanceToggle={false}
              showTooltips={true}
              showLegend={true}
              showInfoPanel={false}
              width={500}
              height={400}
            />
          )}
        </div>
      </div>

      <div className="mt-6 bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20">
        <h4 className="font-semibold text-sp-white mb-2">Instructions</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-sp-white/80">
          <div>
            <p><strong>1. Add Individuals:</strong> Use the blue and pink buttons to add males and females</p>
            <p><strong>2. Toggle Status:</strong> Click on individuals to toggle affected/unaffected status</p>
          </div>
          <div>
            <p><strong>3. Connect:</strong> Select "Connect" tool, click 2 individuals, then choose relationship type</p>
            <p><strong>4. Delete:</strong> Select "Delete" tool and click individuals to remove them</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Genome-wide Genealogy Component
export function GenomeWideGenealogy() {
  const [selectedLocus, setSelectedLocus] = useState(0);
  const [showRecombination, setShowRecombination] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Simulate genome-wide inheritance with different genealogies at different loci
  const loci = [
    { name: 'Locus A', position: '1:1000', genealogy: 'Simple' },
    { name: 'Locus B', position: '1:2000', genealogy: 'Complex' },
    { name: 'Locus C', position: '2:500', genealogy: 'Recent' },
    { name: 'Locus D', position: '2:1500', genealogy: 'Ancient' }
  ];

  // Sample individuals across generations
  const individuals = {
    'Gen-3': ['A', 'B', 'C', 'D'],
    'Gen-2': ['E', 'F'],
    'Gen-1': ['G']
  };

  // Different genealogical relationships at different loci
  const genealogies = {
    'Simple': {
      'A': ['E'], 'B': ['E'], 'C': ['F'], 'D': ['F'],
      'E': ['G'], 'F': ['G']
    },
    'Complex': {
      'A': ['E'], 'B': ['F'], 'C': ['E'], 'D': ['F'],
      'E': ['G'], 'F': ['G']
    },
    'Recent': {
      'A': ['E'], 'B': ['E'], 'C': ['E'], 'D': ['F'],
      'E': ['G'], 'F': ['G']
    },
    'Ancient': {
      'A': ['F'], 'B': ['E'], 'C': ['F'], 'D': ['E'],
      'E': ['G'], 'F': ['G']
    }
  };

  const currentGenealogy = genealogies[loci[selectedLocus].genealogy as keyof typeof genealogies];

  const getConnectionColor = (from: string, to: string) => {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
    return colors[loci[selectedLocus].name.charCodeAt(loci[selectedLocus].name.length - 1) % colors.length];
  };

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Genome-wide View</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Select Genomic Locus</h4>
            <div className="space-y-2">
              {loci.map((locus, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="locus"
                    value={index}
                    checked={selectedLocus === index}
                    onChange={(e) => setSelectedLocus(parseInt(e.target.value))}
                    className="w-4 h-4 text-sp-pale-green"
                  />
                  <div>
                    <span className="text-sp-white font-medium">{locus.name}</span>
                    <div className="text-xs text-sp-white/60">Chr {locus.position}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Visualization Options</h4>
            <label className="flex items-center space-x-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={showRecombination}
                onChange={(e) => setShowRecombination(e.target.checked)}
                className="w-4 h-4 text-sp-pale-green"
              />
              <span className="text-sp-white text-sm">Show Recombination Events</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-sp-white mb-2">Animation Speed</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.5"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-2">Current Locus Info</h4>
            <div className="text-sm text-sp-white/80 space-y-1">
              <p><strong>Position:</strong> Chr {loci[selectedLocus].position}</p>
              <p><strong>Genealogy Type:</strong> {loci[selectedLocus].genealogy}</p>
              <p><strong>Pattern:</strong> {
                loci[selectedLocus].genealogy === 'Simple' ? 'Standard bifurcating tree' :
                loci[selectedLocus].genealogy === 'Complex' ? 'Multiple recombination events' :
                loci[selectedLocus].genealogy === 'Recent' ? 'Recent common ancestor' :
                'Ancient coalescence time'
              }</p>
            </div>
          </div>
        </div>

        {/* Genealogy Visualization */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">
            Genealogy at {loci[selectedLocus].name}
          </h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-6">
            <div className="space-y-8">
              {/* Generation labels and individuals */}
              {Object.entries(individuals).reverse().map(([generation, genIndividuals], genIndex) => (
                <div key={generation} className="flex items-center justify-between">
                  <div className="text-sm font-medium text-sp-white/60 w-16">{generation}</div>
                  <div className="flex-1 flex justify-center space-x-8">
                    {genIndividuals.map((individual, indIndex) => {
                      const isConnected = Object.entries(currentGenealogy).some(([from, toList]) => 
                        from === individual || toList.includes(individual)
                      );
                      
                      return (
                        <div
                          key={individual}
                          className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-500 ${
                            isConnected 
                              ? 'bg-sp-pale-green/20 border-sp-pale-green text-sp-pale-green scale-110' 
                              : 'bg-gray-600 border-gray-400 text-gray-300'
                          }`}
                          style={{
                            transitionDelay: `${genIndex * 200 + indIndex * 100}ms`
                          }}
                        >
                          {individual}
                          {showRecombination && genIndex > 0 && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full text-xs flex items-center justify-center text-black">
                              R
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* Connection lines (simplified representation) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                {Object.entries(currentGenealogy).map(([from, toList]) => (
                  toList.map((to, index) => (
                    <line
                      key={`${from}-${to}`}
                      x1="50%"
                      y1="20%"
                      x2="50%"
                      y2="80%"
                      stroke={getConnectionColor(from, to)}
                      strokeWidth="2"
                      strokeDasharray={showRecombination ? "5,5" : "none"}
                      opacity="0.7"
                      className="transition-all duration-500"
                      style={{
                        animationDuration: `${2 / animationSpeed}s`
                      }}
                    />
                  ))
                ))}
              </svg>
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Key Insights</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-sp-white/80">
              <div>
                <h5 className="font-medium text-sp-pale-green mb-2">Genome-wide Variation</h5>
                <ul className="space-y-1 text-xs">
                  <li>• Different loci have different genealogies</li>
                  <li>• Recombination creates genealogy boundaries</li>
                  <li>• Linkage patterns vary across genome</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-sp-pale-green mb-2">Applications</h5>
                <ul className="space-y-1 text-xs">
                  <li>• Population history inference</li>
                  <li>• Disease gene mapping</li>
                  <li>• Evolutionary genomics</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
            <h4 className="font-semibold text-blue-300 mb-2">Try This!</h4>
            <p className="text-sm text-sp-white/80">
              Switch between different loci to see how genealogical relationships vary across the genome. 
              Notice how recombination creates different inheritance patterns at nearby genetic positions.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-sp-white/60 text-center">
        Select different genomic loci to explore how inheritance patterns vary across the genome
      </div>
    </div>
  );
}

// Relatedness Calculator Component
export function RelatednessCalculator() {
  const [selectedRelationship, setSelectedRelationship] = useState('siblings');
  const [customPath, setCustomPath] = useState('');
  const [showCalculation, setShowCalculation] = useState(false);

  const relationships = {
    'parent-child': {
      name: 'Parent-Child',
      r: 0.5,
      description: 'Direct parent-child relationship',
      path: 'Parent → Child (1 step)',
      calculation: '(1/2)^1 = 0.5'
    },
    'siblings': {
      name: 'Full Siblings',
      r: 0.5,
      description: 'Siblings sharing both parents',
      path: 'Sibling 1 ← Parent → Sibling 2 (2 steps)',
      calculation: '(1/2)^2 = 0.25, but 2 paths (through each parent) = 2 × 0.25 = 0.5'
    },
    'half-siblings': {
      name: 'Half Siblings',
      r: 0.25,
      description: 'Siblings sharing one parent',
      path: 'Half-sibling 1 ← Shared Parent → Half-sibling 2 (2 steps)',
      calculation: '(1/2)^2 = 0.25'
    },
    'grandparent': {
      name: 'Grandparent-Grandchild',
      r: 0.25,
      description: 'Two generations apart',
      path: 'Grandparent → Parent → Grandchild (2 steps)',
      calculation: '(1/2)^2 = 0.25'
    },
    'aunt-uncle': {
      name: 'Aunt/Uncle-Niece/Nephew',
      r: 0.25,
      description: 'Parent\'s sibling and their child',
      path: 'Aunt/Uncle ← Grandparent → Parent → Niece/Nephew (3 steps)',
      calculation: '(1/2)^3 = 0.125, but 2 paths through both grandparents = 2 × 0.125 = 0.25'
    },
    'first-cousins': {
      name: 'First Cousins',
      r: 0.125,
      description: 'Children of siblings',
      path: 'Cousin 1 ← Parent 1 ← Grandparent → Parent 2 → Cousin 2 (4 steps)',
      calculation: '(1/2)^4 = 0.0625, but 2 paths through both grandparents = 2 × 0.0625 = 0.125'
    },
    'great-grandparent': {
      name: 'Great-Grandparent',
      r: 0.125,
      description: 'Three generations apart',
      path: 'Great-grandparent → Grandparent → Parent → Child (3 steps)',
      calculation: '(1/2)^3 = 0.125'
    },
    'second-cousins': {
      name: 'Second Cousins',
      r: 0.03125,
      description: 'Great-grandchildren of siblings',
      path: 'Through common great-grandparents (6 steps)',
      calculation: '(1/2)^6 = 0.015625, but 2 paths = 2 × 0.015625 = 0.03125'
    }
  };

  const currentRel = relationships[selectedRelationship as keyof typeof relationships];

  const getRelatednessDescription = (r: number) => {
    if (r >= 0.5) return { level: 'Very Close', color: 'text-red-400' };
    if (r >= 0.25) return { level: 'Close', color: 'text-orange-400' };
    if (r >= 0.125) return { level: 'Moderate', color: 'text-yellow-400' };
    if (r >= 0.05) return { level: 'Distant', color: 'text-blue-400' };
    return { level: 'Very Distant', color: 'text-gray-400' };
  };

  const relDesc = getRelatednessDescription(currentRel.r);

  const calculateCustomRelatedness = () => {
    // Simple parser for custom paths like "A-B-C-D"
    const steps = customPath.split('-').length - 1;
    if (steps > 0) {
      return Math.pow(0.5, steps);
    }
    return 0;
  };

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Relationship Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Relatedness Calculator</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Select Relationship Type</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(relationships).map(([key, rel]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-sp-pale-green/10">
                  <input
                    type="radio"
                    name="relationship"
                    value={key}
                    checked={selectedRelationship === key}
                    onChange={(e) => setSelectedRelationship(e.target.value)}
                    className="w-4 h-4 text-sp-pale-green"
                  />
                  <div className="flex-1">
                    <span className="text-sp-white font-medium">{rel.name}</span>
                    <div className="text-xs text-sp-white/60">{rel.description}</div>
                    <div className="text-xs font-mono text-sp-pale-green">r = {rel.r}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Custom Calculation</h4>
            <div className="space-y-2">
              <label className="block text-sm text-sp-white/80">
                Genealogical Path (e.g., "A-B-C-D"):
              </label>
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="A-B-C-D"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-sp-pale-green"
              />
              {customPath && (
                <div className="text-sm text-sp-white/80">
                  <p>Steps: {customPath.split('-').length - 1}</p>
                  <p>Relatedness: {calculateCustomRelatedness().toFixed(6)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Relationship Analysis</h3>
          
          {/* Main Result */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold mb-2">
              <span className={relDesc.color}>r = {currentRel.r}</span>
            </div>
            <div className="text-lg font-medium mb-2">
              <span className={relDesc.color}>{relDesc.level} Relationship</span>
            </div>
            <p className="text-sm text-sp-white/80">{currentRel.name}</p>
          </div>

          {/* Calculation Details */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sp-white">Calculation Steps</h4>
              <button
                onClick={() => setShowCalculation(!showCalculation)}
                className="text-sp-pale-green hover:text-sp-pale-green/80 transition-colors text-sm"
              >
                {showCalculation ? 'Hide' : 'Show'} Details
              </button>
            </div>
            
            <div className="text-sm text-sp-white/80 space-y-2">
              <p><strong>Genealogical Path:</strong></p>
              <p className="font-mono bg-gray-800 rounded p-2">{currentRel.path}</p>
              
              {showCalculation && (
                <div className="space-y-2">
                  <p><strong>Mathematical Calculation:</strong></p>
                  <p className="font-mono bg-gray-800 rounded p-2">{currentRel.calculation}</p>
                  <div className="bg-sp-pale-green/10 p-3 rounded border-l-4 border-sp-pale-green">
                    <p className="text-xs">
                      <strong>Formula:</strong> r = Σ(1/2)^n where n is the number of steps in each possible path between individuals through common ancestors.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interpretation */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Biological Interpretation</h4>
            <div className="text-sm text-sp-white/80 space-y-2">
              <p>
                <strong>Shared DNA:</strong> On average, these individuals share {(currentRel.r * 100).toFixed(1)}% of their DNA identical by descent.
              </p>
              <p>
                <strong>Probability Interpretation:</strong> The probability that a randomly chosen allele from one individual is identical by descent to the corresponding allele in the other individual.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <div className="font-medium text-sp-pale-green">Conservation</div>
                  <div className="text-xs text-sp-white/70">
                    {currentRel.r > 0.25 ? 'Important for breeding programs' : 'Useful for population management'}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sp-pale-green">Evolution</div>
                  <div className="text-xs text-sp-white/70">
                    {currentRel.r > 0.125 ? 'Strong kin selection effects' : 'Weak kin selection effects'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Quick Reference</h4>
            <div className="space-y-2 text-xs">
              {Object.entries(relationships).slice(0, 6).map(([key, rel]) => (
                <div 
                  key={key} 
                  className={`flex justify-between p-2 rounded ${
                    key === selectedRelationship ? 'bg-sp-pale-green/20 border border-sp-pale-green' : 'bg-gray-800'
                  }`}
                >
                  <span className="text-sp-white">{rel.name}</span>
                  <span className="font-mono text-sp-pale-green">r = {rel.r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-sp-white/60 text-center">
        Select different relationship types to explore how genetic relatedness varies with genealogical distance
      </div>
    </div>
  );
}

// Interactive Self-Check Component
export function InteractiveSelfCheck() {
  const questions = [
    {
      question: "Which process ensures genetic diversity in offspring?",
      options: [
        "DNA replication",
        "Meiosis and genetic recombination",
        "Mitosis",
        "Protein synthesis"
      ],
      correctAnswer: "Meiosis and genetic recombination",
      explanation: "Meiosis and genetic recombination create unique combinations of alleles in gametes, leading to genetic diversity in offspring."
    },
    {
      question: "What does a square symbol represent in a pedigree?",
      options: [
        "Female",
        "Male",
        "Unknown gender",
        "Affected individual"
      ],
      correctAnswer: "Male",
      explanation: "In standard pedigree notation, squares represent males and circles represent females."
    },
    {
      question: "How is genetic relatedness typically measured?",
      options: [
        "By physical appearance",
        "By shared genetic markers",
        "By age difference",
        "By geographical location"
      ],
      correctAnswer: "By shared genetic markers",
      explanation: "Genetic relatedness is measured by analyzing the proportion of genetic markers shared between individuals."
    }
  ];

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-sp-pale-green mb-4">Quick Self-Check</h3>
      <div className="space-y-6">
        {questions.map((q, index) => (
          <SelfCheckQuestion
            key={index}
            question={q.question}
            options={q.options}
            correctAnswer={q.correctAnswer}
            explanation={q.explanation}
          />
        ))}
      </div>
    </div>
  );
}

// Identity by Descent Explorer Component
export function IdentityByDescentExplorer() {
  const [selectedScenario, setSelectedScenario] = useState('siblings');
  const [generation, setGeneration] = useState(2);
  const [highlightIBD, setHighlightIBD] = useState(false);

  const scenarios = {
    'siblings': {
      name: 'Full Siblings',
      description: 'Two individuals sharing both parents',
      individuals: {
        'P1': { name: 'Parent 1', generation: 1, x: 100, y: 50, gender: 'male' },
        'P2': { name: 'Parent 2', generation: 1, x: 300, y: 50, gender: 'female' },
        'S1': { name: 'Sibling 1', generation: 2, x: 150, y: 150, gender: 'female' },
        'S2': { name: 'Sibling 2', generation: 2, x: 250, y: 150, gender: 'male' }
      },
      relationships: [
        { from: 'P1', to: 'P2', type: 'marriage' },
        { from: 'P1', to: 'S1', type: 'parent' },
        { from: 'P1', to: 'S2', type: 'parent' },
        { from: 'P2', to: 'S1', type: 'parent' },
        { from: 'P2', to: 'S2', type: 'parent' }
      ],
      ibdPaths: [
        { path: ['P1', 'S1', 'S2'], probability: 0.25, color: '#3b82f6', description: 'Through Parent 1' },
        { path: ['P2', 'S1', 'S2'], probability: 0.25, color: '#10b981', description: 'Through Parent 2' }
      ],
      totalIBD: 0.5
    },
    'cousins': {
      name: 'First Cousins',
      description: 'Children of siblings',
      individuals: {
        'G1': { name: 'Grandparent 1', generation: 1, x: 100, y: 30, gender: 'male' },
        'G2': { name: 'Grandparent 2', generation: 1, x: 300, y: 30, gender: 'female' },
        'P1': { name: 'Parent 1', generation: 2, x: 150, y: 100, gender: 'female' },
        'P2': { name: 'Parent 2', generation: 2, x: 250, y: 100, gender: 'male' },
        'C1': { name: 'Cousin 1', generation: 3, x: 150, y: 170, gender: 'male' },
        'C2': { name: 'Cousin 2', generation: 3, x: 250, y: 170, gender: 'female' }
      },
      relationships: [
        { from: 'G1', to: 'G2', type: 'marriage' },
        { from: 'G1', to: 'P1', type: 'parent' },
        { from: 'G1', to: 'P2', type: 'parent' },
        { from: 'G2', to: 'P1', type: 'parent' },
        { from: 'G2', to: 'P2', type: 'parent' },
        { from: 'P1', to: 'C1', type: 'parent' },
        { from: 'P2', to: 'C2', type: 'parent' }
      ],
      ibdPaths: [
        { path: ['G1', 'P1', 'C1', 'C2', 'P2'], probability: 0.0625, color: '#3b82f6', description: 'Through Grandparent 1' },
        { path: ['G2', 'P1', 'C1', 'C2', 'P2'], probability: 0.0625, color: '#10b981', description: 'Through Grandparent 2' }
      ],
      totalIBD: 0.125
    },
    'unrelated': {
      name: 'Unrelated Individuals',
      description: 'No recent common ancestor',
      individuals: {
        'I1': { name: 'Individual 1', generation: 1, x: 150, y: 100, gender: 'male' },
        'I2': { name: 'Individual 2', generation: 1, x: 250, y: 100, gender: 'female' }
      },
      relationships: [],
      ibdPaths: [],
      totalIBD: 0
    }
  };

  const currentScenario = scenarios[selectedScenario as keyof typeof scenarios];

  const getGenotypeVisualization = () => {
    // Simplified representation of chromosomes with IBD segments
    const chromosomes = ['Chr 1', 'Chr 2'];
    const segments = [
      { start: 0, end: 40, ibd: true, source: 'Parent 1' },
      { start: 40, end: 60, ibd: false, source: 'Different' },
      { start: 60, end: 100, ibd: true, source: 'Parent 2' }
    ];

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sp-white mb-2">Chromosome Segments (Simplified)</h4>
        {chromosomes.map((chr, chrIndex) => (
          <div key={chr} className="space-y-2">
            <div className="text-sm text-sp-white/80">{chr}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-xs text-sp-white/60">Individual 1</div>
                <div className="h-8 bg-gray-700 rounded flex">
                  {segments.map((segment, index) => (
                    <div
                      key={index}
                      className={`h-full transition-all duration-300 ${
                        highlightIBD && segment.ibd 
                          ? segment.source === 'Parent 1' 
                            ? 'bg-blue-500' 
                            : 'bg-green-500'
                          : 'bg-gray-600'
                      }`}
                      style={{ width: `${segment.end - segment.start}%` }}
                      title={segment.ibd ? `IBD from ${segment.source}` : 'Not IBD'}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-sp-white/60">Individual 2</div>
                <div className="h-8 bg-gray-700 rounded flex">
                  {segments.map((segment, index) => (
                    <div
                      key={index}
                      className={`h-full transition-all duration-300 ${
                        highlightIBD && segment.ibd 
                          ? segment.source === 'Parent 1' 
                            ? 'bg-blue-500' 
                            : 'bg-green-500'
                          : 'bg-gray-600'
                      }`}
                      style={{ width: `${segment.end - segment.start}%` }}
                      title={segment.ibd ? `IBD from ${segment.source}` : 'Not IBD'}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Identity by Descent</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Relationship Type</h4>
            <div className="space-y-2">
              {Object.entries(scenarios).map(([key, scenario]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="scenario"
                    value={key}
                    checked={selectedScenario === key}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-4 h-4 text-sp-pale-green"
                  />
                  <div>
                    <span className="text-sp-white font-medium">{scenario.name}</span>
                    <div className="text-xs text-sp-white/70">{scenario.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Visualization Options</h4>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={highlightIBD}
                onChange={(e) => setHighlightIBD(e.target.checked)}
                className="w-4 h-4 text-sp-pale-green"
              />
              <span className="text-sp-white text-sm">Highlight IBD Segments</span>
            </label>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">IBD vs IBS</h4>
            <div className="space-y-2 text-sm text-sp-white/80">
              <div>
                <span className="font-medium text-sp-pale-green">Identity by Descent (IBD):</span>
                <p className="text-xs">DNA segments inherited from a common ancestor</p>
              </div>
              <div>
                <span className="font-medium text-yellow-400">Identity by State (IBS):</span>
                <p className="text-xs">DNA segments that are identical but may not share recent ancestry</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pedigree Visualization */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">
            {currentScenario.name}
          </h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4 aspect-square relative">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Draw relationships */}
              {currentScenario.relationships.map((rel, index) => {
                const from = (currentScenario.individuals as any)[rel.from];
                const to = (currentScenario.individuals as any)[rel.to];
                
                if (rel.type === 'marriage') {
                  return (
                    <line
                      key={index}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#64748b"
                      strokeWidth="2"
                    />
                  );
                } else if (rel.type === 'parent') {
                  return (
                    <line
                      key={index}
                      x1={from.x}
                      y1={from.y + 10}
                      x2={to.x}
                      y2={to.y - 10}
                      stroke="#64748b"
                      strokeWidth="2"
                    />
                  );
                }
                return null;
              })}

              {/* Draw IBD paths if highlighted */}
              {highlightIBD && currentScenario.ibdPaths.map((path, index) => (
                <g key={index}>
                  {path.path.slice(0, -1).map((nodeId, i) => {
                    const from = (currentScenario.individuals as any)[nodeId];
                    const to = (currentScenario.individuals as any)[path.path[i + 1]];
                    return (
                      <line
                        key={i}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={path.color}
                        strokeWidth="4"
                        strokeDasharray="5,5"
                        opacity="0.7"
                      />
                    );
                  })}
                </g>
              ))}

              {/* Draw individuals */}
              {Object.entries(currentScenario.individuals).map(([id, individual]) => (
                <g key={id}>
                  {individual.gender === 'male' ? (
                    <rect
                      x={individual.x - 15}
                      y={individual.y - 15}
                      width="30"
                      height="30"
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="2"
                      rx="3"
                    />
                  ) : (
                    <circle
                      cx={individual.x}
                      cy={individual.y}
                      r="15"
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="2"
                    />
                  )}
                  <text
                    x={individual.x}
                    y={individual.y + 25}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#f1f5f9"
                  >
                    {individual.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">IBD Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sp-white">Expected IBD Proportion:</span>
                <span className="font-mono text-sp-pale-green">{currentScenario.totalIBD}</span>
              </div>
              {currentScenario.ibdPaths.map((path, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: path.color }}
                    />
                    <span className="text-sp-white/80">{path.description}</span>
                  </div>
                  <span className="font-mono text-sp-white/80">{path.probability}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Genomic Visualization */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Genomic IBD Segments</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            {getGenotypeVisualization()}
            {currentScenario.totalIBD > 0 && (
              <div className="mt-4 p-3 bg-sp-pale-green/10 rounded border-l-4 border-sp-pale-green">
                <p className="text-xs text-sp-white/80">
                  IBD segments (highlighted when enabled) represent DNA inherited from common ancestors. 
                  The proportion of IBD segments equals the coefficient of relatedness.
                </p>
              </div>
            )}
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Key Concepts</h4>
            <div className="space-y-3 text-sm text-sp-white/80">
              <div>
                <div className="font-medium text-sp-pale-green">IBD Detection</div>
                <div className="text-xs text-sp-white/70">
                  Long stretches of identical DNA that are unlikely to arise by chance alone
                </div>
              </div>
              <div>
                <div className="font-medium text-sp-pale-green">Recombination Effect</div>
                <div className="text-xs text-sp-white/70">
                  IBD segments get shorter each generation due to chromosome crossing over
                </div>
              </div>
              <div>
                <div className="font-medium text-sp-pale-green">Population Applications</div>
                <div className="text-xs text-sp-white/70">
                  Used in disease mapping, population structure, and demographic inference
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4 border border-purple-500/30">
            <h4 className="font-semibold text-purple-300 mb-2">Modern IBD Analysis</h4>
            <p className="text-sm text-sp-white/80">
              Genome-wide IBD detection uses statistical methods to identify shared segments, 
              enabling studies of population history, disease gene mapping, and relative finding 
              even among distantly related individuals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 