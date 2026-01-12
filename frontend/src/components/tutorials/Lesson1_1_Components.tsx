import { useState } from 'react';
import DNAAnimation from './DNAAnimation';
import { SelfCheckQuestion } from './LessonPageHelpers';

// Interactive DNA Preview Component
export function InteractiveDNAPreview() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features: { [key: string]: { title: string; description: string } } = {
    'double-helix': {
      title: 'Double Helix Structure',
      description: 'Two antiparallel strands wound around each other, providing stability and protection for genetic information.'
    },
    'base-pairs': {
      title: 'Base Pairing',
      description: 'A-T and G-C base pairs held together by hydrogen bonds, enabling accurate replication.'
    },
    'backbone': {
      title: 'Sugar-Phosphate Backbone',
      description: 'Provides structural support and directional polarity (5\' to 3\') essential for DNA function.'
    },
    'nucleotides': {
      title: 'Nucleotides',
      description: 'Building blocks of DNA consisting of a base, sugar, and phosphate group.'
    }
  };

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative">
          <div className="aspect-square bg-gradient-to-br from-sp-pale-green/20 to-sp-dark-blue/50 rounded-lg flex items-center justify-center">
            <DNAAnimation />
            {/* Clickable hotspots */}
            <div className="absolute inset-0">
              <button
                onClick={() => setSelectedFeature('double-helix')}
                className="absolute top-1/4 left-1/2 w-4 h-4 bg-sp-pale-green rounded-full hover:scale-125 transition-transform"
                title="Double Helix"
              />
              <button
                onClick={() => setSelectedFeature('base-pairs')}
                className="absolute top-1/2 left-1/3 w-4 h-4 bg-blue-400 rounded-full hover:scale-125 transition-transform"
                title="Base Pairs"
              />
              <button
                onClick={() => setSelectedFeature('backbone')}
                className="absolute top-1/3 left-1/4 w-4 h-4 bg-red-400 rounded-full hover:scale-125 transition-transform"
                title="Backbone"
              />
              <button
                onClick={() => setSelectedFeature('nucleotides')}
                className="absolute top-2/3 left-2/3 w-4 h-4 bg-yellow-400 rounded-full hover:scale-125 transition-transform"
                title="Nucleotides"
              />
            </div>
          </div>
          <p className="text-xs text-sp-white/60 mt-2 text-center">Click the colored dots to explore DNA structure</p>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">DNA Structure Explorer</h3>
          {selectedFeature ? (
            <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
              <h4 className="font-semibold text-sp-white mb-2">{features[selectedFeature].title}</h4>
              <p className="text-sm text-sp-white/80">{features[selectedFeature].description}</p>
            </div>
          ) : (
            <p className="text-sp-white/60 text-sm">Click on the highlighted points in the DNA structure to learn about different components.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Interactive DNA Structure Component for Page 2
export function InteractiveDNAStructure() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [highlightedBases, setHighlightedBases] = useState<string[]>([]);

  const components: { [key: string]: { title: string; description: string; color: string } } = {
    'phosphate': {
      title: 'Phosphate Group',
      description: 'Negatively charged group that forms the backbone of DNA and creates the molecule\'s polarity.',
      color: 'bg-red-400'
    },
    'sugar': {
      title: 'Deoxyribose Sugar',
      description: 'Five-carbon sugar that lacks one hydroxyl group, making DNA more stable than RNA.',
      color: 'bg-blue-400'
    },
    'adenine': {
      title: 'Adenine (A)',
      description: 'Purine base that pairs with thymine via 2 hydrogen bonds. Essential for ATP and genetic coding.',
      color: 'bg-green-400'
    },
    'thymine': {
      title: 'Thymine (T)',
      description: 'Pyrimidine base that pairs with adenine. Unique to DNA (RNA uses uracil instead).',
      color: 'bg-yellow-400'
    },
    'guanine': {
      title: 'Guanine (G)',
      description: 'Purine base that pairs with cytosine via 3 hydrogen bonds, creating stronger base pairs.',
      color: 'bg-purple-400'
    },
    'cytosine': {
      title: 'Cytosine (C)',
      description: 'Pyrimidine base that pairs with guanine. Important in epigenetic modifications.',
      color: 'bg-orange-400'
    }
  };

  const handleBaseClick = (base: string) => {
    if (highlightedBases.includes(base)) {
      setHighlightedBases(highlightedBases.filter(b => b !== base));
    } else {
      setHighlightedBases([...highlightedBases, base]);
    }
  };

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">DNA Components</h3>
          
          {/* Nucleotide Base Selector */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Highlight Nucleotides:</h4>
            <div className="grid grid-cols-2 gap-2">
              {['adenine', 'thymine', 'guanine', 'cytosine'].map(base => (
                <button
                  key={base}
                  onClick={() => handleBaseClick(base)}
                  className={`p-2 rounded text-sm font-semibold transition-all ${
                    highlightedBases.includes(base) 
                      ? `${components[base].color} text-gray-900 scale-105` 
                      : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  {base.charAt(0).toUpperCase() + base.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Component Details */}
          {selectedComponent && (
            <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
              <h4 className="font-semibold text-sp-white mb-2">{components[selectedComponent].title}</h4>
              <p className="text-sm text-sp-white/80">{components[selectedComponent].description}</p>
            </div>
          )}
        </div>

        {/* DNA Structure Visualization */}
        <div className="relative">
          <div className="aspect-square bg-gradient-to-br from-sp-pale-green/20 to-sp-dark-blue/50 rounded-lg p-4">
            <div className="h-full flex flex-col justify-center items-center space-y-2">
              {/* Simplified DNA ladder representation */}
              <div className="text-center space-y-1">
                <div className="text-sm text-sp-white/60 mb-2">5' → 3'</div>
                {['A-T', 'G-C', 'T-A', 'C-G', 'A-T'].map((pair, index) => (
                  <div key={index} className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setSelectedComponent(pair.split('-')[0].toLowerCase() === 'a' ? 'adenine' : pair.split('-')[0].toLowerCase() === 'g' ? 'guanine' : pair.split('-')[0].toLowerCase() === 't' ? 'thymine' : 'cytosine')}
                      className={`w-8 h-8 rounded font-bold text-sm transition-all ${
                        highlightedBases.includes(pair.split('-')[0].toLowerCase() === 'a' ? 'adenine' : pair.split('-')[0].toLowerCase() === 'g' ? 'guanine' : pair.split('-')[0].toLowerCase() === 't' ? 'thymine' : 'cytosine')
                          ? `${components[pair.split('-')[0].toLowerCase() === 'a' ? 'adenine' : pair.split('-')[0].toLowerCase() === 'g' ? 'guanine' : pair.split('-')[0].toLowerCase() === 't' ? 'thymine' : 'cytosine'].color} scale-110 shadow-lg`
                          : 'bg-gray-600 hover:bg-gray-500'
                      } text-white`}
                    >
                      {pair.split('-')[0]}
                    </button>
                    <div className="text-sp-white/40">—</div>
                    <button
                      onClick={() => setSelectedComponent(pair.split('-')[1].toLowerCase() === 'a' ? 'adenine' : pair.split('-')[1].toLowerCase() === 'g' ? 'guanine' : pair.split('-')[1].toLowerCase() === 't' ? 'thymine' : 'cytosine')}
                      className={`w-8 h-8 rounded font-bold text-sm transition-all ${
                        highlightedBases.includes(pair.split('-')[1].toLowerCase() === 'a' ? 'adenine' : pair.split('-')[1].toLowerCase() === 'g' ? 'guanine' : pair.split('-')[1].toLowerCase() === 't' ? 'thymine' : 'cytosine')
                          ? `${components[pair.split('-')[1].toLowerCase() === 'a' ? 'adenine' : pair.split('-')[1].toLowerCase() === 'g' ? 'guanine' : pair.split('-')[1].toLowerCase() === 't' ? 'thymine' : 'cytosine'].color} scale-110 shadow-lg`
                          : 'bg-gray-600 hover:bg-gray-500'
                      } text-white`}
                    >
                      {pair.split('-')[1]}
                    </button>
                  </div>
                ))}
                <div className="text-sm text-sp-white/60 mt-2">3' ← 5'</div>
              </div>
            </div>
          </div>
          
          {/* Structural component buttons */}
          <div className="absolute top-2 left-2 space-y-1">
            <button
              onClick={() => setSelectedComponent('phosphate')}
              className="w-3 h-3 bg-red-400 rounded-full hover:scale-125 transition-transform"
              title="Phosphate Group"
            />
            <button
              onClick={() => setSelectedComponent('sugar')}
              className="w-3 h-3 bg-blue-400 rounded-full hover:scale-125 transition-transform"
              title="Sugar"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-sp-white/60 text-center">
        Click on nucleotides to highlight them, or click the colored dots to learn about DNA components
      </div>
    </div>
  );
}

// Virtual Organism Lab Component for Page 3
export function VirtualOrganismLab() {
  const [selectedTraits, setSelectedTraits] = useState<{ [key: string]: string }>({
    flowerColor: 'red',
    petalShape: 'round',
    plantHeight: 'medium'
  });

  const traitOptions: { [key: string]: { name: string; alleles: { [key: string]: any } } } = {
    flowerColor: {
      name: 'Flower Color',
      alleles: {
        'red': { genotype: 'RR', phenotype: 'Red Flowers', color: '#DC2626' },
        'pink': { genotype: 'Rr', phenotype: 'Pink Flowers', color: '#EC4899' },
        'white': { genotype: 'rr', phenotype: 'White Flowers', color: '#F3F4F6' }
      }
    },
    petalShape: {
      name: 'Petal Shape',
      alleles: {
        'round': { genotype: 'SS', phenotype: 'Round Petals', shape: 'round' },
        'pointed': { genotype: 'Ss', phenotype: 'Pointed Petals', shape: 'pointed' },
        'wavy': { genotype: 'ss', phenotype: 'Wavy Petals', shape: 'wavy' }
      }
    },
    plantHeight: {
      name: 'Plant Height',
      alleles: {
        'tall': { genotype: 'HH', phenotype: 'Tall Plant (>4ft)', size: 'tall' },
        'medium': { genotype: 'Hh', phenotype: 'Medium Plant (2-4ft)', size: 'medium' },
        'short': { genotype: 'hh', phenotype: 'Short Plant (<2ft)', size: 'short' }
      }
    }
  };

  const handleTraitChange = (trait: string, value: string) => {
    setSelectedTraits({ ...selectedTraits, [trait]: value });
  };

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trait Selectors */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Select Genotypes</h3>
          
          {Object.entries(traitOptions).map(([traitKey, trait]) => (
            <div key={traitKey} className="bg-sp-very-dark-blue/50 rounded-lg p-4">
              <h4 className="font-semibold text-sp-white mb-3">{trait.name}</h4>
              <div className="space-y-2">
                {Object.entries(trait.alleles).map(([alleleKey, allele]) => (
                  <label key={alleleKey} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={traitKey}
                      value={alleleKey}
                      checked={selectedTraits[traitKey] === alleleKey}
                      onChange={(e) => handleTraitChange(traitKey, e.target.value)}
                      className="w-4 h-4 text-sp-pale-green"
                    />
                    <div>
                      <span className="text-sp-white font-medium">{allele.genotype}</span>
                      <span className="text-sp-white/70 text-sm ml-2">→ {allele.phenotype}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Virtual Flower Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Resulting Phenotype</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-6 text-center">
            {/* Simplified flower representation */}
            <div className="relative mx-auto flex flex-col items-center" style={{ width: '200px', height: '240px' }}>
              
              {/* Flower head */}
              <div className="relative mb-2">
                {selectedTraits.petalShape === 'round' ? (
                  <div className="relative w-16 h-16">
                    {/* Round petals */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="absolute w-6 h-6 rounded-full"
                        style={{
                          backgroundColor: traitOptions.flowerColor.alleles[selectedTraits.flowerColor].color,
                          transform: `rotate(${i * 72}deg) translate(20px) rotate(-${i * 72}deg)`,
                          left: '50%',
                          top: '50%',
                          marginLeft: '-12px',
                          marginTop: '-12px'
                        }}
                      />
                    ))}
                    {/* Center */}
                    <div className="absolute w-4 h-4 bg-yellow-400 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                ) : selectedTraits.petalShape === 'pointed' ? (
                  <div className="relative w-16 h-16">
                    {/* Pointed petals */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="absolute w-0 h-0"
                        style={{
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderBottom: `16px solid ${traitOptions.flowerColor.alleles[selectedTraits.flowerColor].color}`,
                          transform: `rotate(${i * 72}deg) translate(18px) rotate(-${i * 72}deg)`,
                          left: '50%',
                          top: '50%',
                          marginLeft: '-8px',
                          marginTop: '-8px'
                        }}
                      />
                    ))}
                    {/* Center */}
                    <div className="absolute w-4 h-4 bg-yellow-400 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  <div className="relative w-16 h-16">
                    {/* Wavy petals */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="absolute w-5 h-8 rounded-full"
                        style={{
                          backgroundColor: traitOptions.flowerColor.alleles[selectedTraits.flowerColor].color,
                          transform: `rotate(${i * 72}deg) translate(20px) rotate(-${i * 72}deg) skew(10deg)`,
                          left: '50%',
                          top: '50%',
                          marginLeft: '-10px',
                          marginTop: '-16px'
                        }}
                      />
                    ))}
                    {/* Center */}
                    <div className="absolute w-4 h-4 bg-yellow-400 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                )}
              </div>

              {/* Stem */}
              <div 
                className="w-1 bg-green-600 rounded"
                style={{ 
                  height: selectedTraits.plantHeight === 'tall' ? '140px' : 
                          selectedTraits.plantHeight === 'medium' ? '100px' : '60px'
                }}
              />

              {/* Leaves */}
              <div className="absolute" style={{ top: '80px', left: '85px' }}>
                <div className="w-4 h-2 bg-green-500 rounded-full transform rotate-45" />
              </div>
              <div className="absolute" style={{ top: '100px', left: '105px' }}>
                <div className="w-4 h-2 bg-green-500 rounded-full transform -rotate-45" />
              </div>

              {/* Pot */}
              <div className="w-20 h-8 bg-amber-800 rounded-b-lg mt-2" />
            </div>
          </div>

          {/* Phenotype Summary */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-2">Current Phenotype:</h4>
            <ul className="space-y-1 text-sm text-sp-white/80">
              {Object.entries(selectedTraits).map(([trait, value]) => (
                <li key={trait}>
                  • {traitOptions[trait].alleles[value].phenotype}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-sp-white/60 text-center">
        Change the genotype selections to see how different allele combinations produce different flower phenotypes
      </div>
    </div>
  );
}

// Interactive Mutation Visualization Component for Page 4
export function MutationVisualization() {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [mutationOccurred, setMutationOccurred] = useState(false);
  const [generationData, setGenerationData] = useState([
    { generation: 0, diversity: 0.15, individuals: 5 },
    { generation: 1, diversity: 0.18, individuals: 8 },
    { generation: 2, diversity: 0.22, individuals: 12 },
    { generation: 3, diversity: 0.19, individuals: 10 },
    { generation: 4, diversity: 0.25, individuals: 15 }
  ]);
  
  const originalSequence = "ATCGATCGTAGC";
  const mutatedSequence = "ATCGATCGTGGC"; // A->G mutation at position 9
  
  const [currentSequence, setCurrentSequence] = useState(originalSequence);
  
  const handlePositionClick = (position: number) => {
    setSelectedPosition(position);
    if (position === 9) { // Position where mutation can occur
      setMutationOccurred(!mutationOccurred);
      setCurrentSequence(mutationOccurred ? originalSequence : mutatedSequence);
    }
  };

  const diversityFactors = [
    { name: 'Mutation', description: 'Creates new alleles through DNA replication errors', impact: '+', color: 'bg-red-400' },
    { name: 'Recombination', description: 'Shuffles existing alleles into new combinations', impact: '+', color: 'bg-blue-400' },
    { name: 'Gene Flow', description: 'Introduces alleles from other populations', impact: '+', color: 'bg-green-400' },
    { name: 'Genetic Drift', description: 'Random sampling can reduce diversity', impact: '±', color: 'bg-yellow-400' }
  ];

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mutation at Nucleotide Level */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Mutation at the DNA Level</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <p className="text-sm text-sp-white/80 mb-3">Click position 10 (A) to simulate a point mutation:</p>
            <div className="font-mono text-lg text-center bg-gray-800 rounded p-3">
              {currentSequence.split('').map((base, index) => (
                <button
                  key={index}
                  onClick={() => handlePositionClick(index)}
                  className={`mx-1 px-2 py-1 rounded transition-all ${
                    index === 9 
                      ? 'bg-red-500 text-white hover:bg-red-600 cursor-pointer' 
                      : selectedPosition === index
                      ? 'bg-sp-pale-green text-sp-very-dark-blue'
                      : 'hover:bg-gray-700'
                  } ${
                    index === 9 && mutationOccurred ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  title={index === 9 ? 'Click to mutate A→G' : `Position ${index + 1}: ${base}`}
                >
                  {base}
                </button>
              ))}
            </div>
            {selectedPosition !== null && (
              <div className="mt-3 text-sm text-sp-white/80">
                <p><strong>Position {selectedPosition + 1}:</strong> {currentSequence[selectedPosition]}</p>
                {selectedPosition === 9 && (
                  <p className="text-yellow-400 mt-1">
                    💡 {mutationOccurred ? 'Mutation occurred! A→G creates a new allele.' : 'Click to create a point mutation.'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sources of Variation */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Sources of Genetic Variation</h4>
            <div className="space-y-2">
              {diversityFactors.map((factor, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded bg-gray-800/50">
                  <div className={`w-3 h-3 ${factor.color} rounded-full`} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sp-white">{factor.name}</span>
                      <span className={`text-sm px-1 rounded ${
                        factor.impact === '+' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                      }`}>
                        {factor.impact}
                      </span>
                    </div>
                    <p className="text-xs text-sp-white/70">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Genetic Diversity Across Generations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Diversity Across Generations</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <div className="space-y-3">
              {generationData.map((gen, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-sp-white w-16">Gen {gen.generation}</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-6 relative">
                    <div 
                      className="bg-gradient-to-r from-sp-pale-green to-green-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${gen.diversity * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      π = {gen.diversity.toFixed(3)}
                    </div>
                  </div>
                  <div className="text-xs text-sp-white/60 w-12">{gen.individuals} ind.</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-sp-pale-green/10 rounded border-l-4 border-sp-pale-green">
              <p className="text-sm text-sp-white/80">
                <strong>Notice:</strong> Genetic diversity (π) fluctuates due to the balance between processes that increase variation (mutation, gene flow) and those that decrease it (drift, selection).
              </p>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Simulate Population Events</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const newData = [...generationData];
                  newData.push({
                    generation: newData.length,
                    diversity: Math.min(0.30, newData[newData.length - 1].diversity + 0.03),
                    individuals: newData[newData.length - 1].individuals + Math.floor(Math.random() * 5)
                  });
                  setGenerationData(newData);
                }}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm text-white font-medium transition-colors"
              >
                + Add Migration Event (↑ Diversity)
              </button>
              <button
                onClick={() => {
                  const newData = [...generationData];
                  newData.push({
                    generation: newData.length,
                    diversity: Math.max(0.05, newData[newData.length - 1].diversity - 0.05),
                    individuals: Math.max(3, newData[newData.length - 1].individuals - Math.floor(Math.random() * 3))
                  });
                  setGenerationData(newData);
                }}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm text-white font-medium transition-colors"
              >
                - Add Bottleneck Event (↓ Diversity)
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-sp-white/60 text-center">
        Interact with the DNA sequence above and simulate population events to see how genetic diversity changes
      </div>
    </div>
  );
}

// Nucleotide Diversity Calculator Component for Page 5
export function NucleotideDiversityCalculator() {
  const [selectedDataset, setSelectedDataset] = useState('human');
  const [showCalculation, setShowCalculation] = useState(false);
  
  const datasets = {
    human: {
      name: 'Human Population',
      sequences: [
        'ATCGATCGTAGC',
        'ATCGATCGTGGC',
        'ATCGACCGTAGC',
        'ATCGATCGTAGC',
        'TTCGATCGTAGC'
      ],
      description: 'Sample from human genomic region',
      realWorldContext: 'Human genome-wide average π ≈ 0.001'
    },
    drosophila: {
      name: 'Drosophila Population',
      sequences: [
        'ATCGATCGTAGC',
        'GTCGATCGTAGC',
        'ATCGTTCGTAGC',
        'ATCGATGGTAGC',
        'ATCGATCGTAAC'
      ],
      description: 'Sample from fruit fly population',
      realWorldContext: 'Drosophila typically has π ≈ 0.01-0.02'
    },
    bacteria: {
      name: 'Bacterial Strain',
      sequences: [
        'ATCGATCGTAGC',
        'ATCGATCGTAGC',
        'ATCGATCGTAGC',
        'ATCGATCGTGGC',
        'ATCGATCGTAGC'
      ],
      description: 'Clonal bacterial population',
      realWorldContext: 'Bacteria show low π due to clonal reproduction'
    }
  };

  const calculateNucleotideDiversity = (sequences: string[]) => {
    const n = sequences.length;
    const seqLength = sequences[0].length;
    let totalDifferences = 0;
    let totalComparisons = 0;

    // Compare all pairs of sequences
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        totalComparisons++;
        // Count differences between sequences i and j
        for (let pos = 0; pos < seqLength; pos++) {
          if (sequences[i][pos] !== sequences[j][pos]) {
            totalDifferences++;
          }
        }
      }
    }

    const pi = totalComparisons > 0 ? totalDifferences / (totalComparisons * seqLength) : 0;
    return { pi, totalDifferences, totalComparisons, seqLength };
  };

  const currentDataset = datasets[selectedDataset as keyof typeof datasets];
  const diversity = calculateNucleotideDiversity(currentDataset.sequences);

  const getDiversityColor = (pi: number) => {
    if (pi < 0.05) return 'text-red-400';
    if (pi < 0.15) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getDiversityDescription = (pi: number) => {
    if (pi < 0.05) return 'Low genetic diversity';
    if (pi < 0.15) return 'Moderate genetic diversity';
    return 'High genetic diversity';
  };

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dataset Selection and Visualization */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Nucleotide Diversity Calculator</h3>
          
          {/* Dataset Selector */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Select Dataset:</h4>
            <div className="space-y-2">
              {Object.entries(datasets).map(([key, dataset]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="dataset"
                    value={key}
                    checked={selectedDataset === key}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    className="w-4 h-4 text-sp-pale-green"
                  />
                  <div>
                    <span className="text-sp-white font-medium">{dataset.name}</span>
                    <p className="text-xs text-sp-white/70">{dataset.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sequence Alignment Visualization */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Sequence Alignment</h4>
            <div className="font-mono text-sm space-y-1">
              {currentDataset.sequences.map((seq, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sp-white/60 w-8">#{index + 1}</span>
                  <div className="flex">
                    {seq.split('').map((base, pos) => {
                      // Check if this position varies across sequences
                      const allBasesAtPos = currentDataset.sequences.map(s => s[pos]);
                      const isVariable = new Set(allBasesAtPos).size > 1;
                      const isThisBaseDifferent = allBasesAtPos[0] !== base;
                      
                      return (
                        <span
                          key={pos}
                          className={`px-1 ${
                            isVariable && isThisBaseDifferent
                              ? 'bg-yellow-600 text-white rounded'
                              : isVariable
                              ? 'bg-yellow-600/30 text-yellow-200'
                              : 'text-sp-white/80'
                          }`}
                        >
                          {base}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-sp-white/60 mt-2">
              Yellow highlighting shows variable positions
            </p>
          </div>
        </div>

        {/* Calculation Results and Explanation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Diversity Analysis</h3>
          
          {/* Results Display */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                <span className={getDiversityColor(diversity.pi)}>
                  π = {diversity.pi.toFixed(4)}
                </span>
              </div>
              <p className={`text-sm font-medium ${getDiversityColor(diversity.pi)}`}>
                {getDiversityDescription(diversity.pi)}
              </p>
            </div>
            
            <div className="mt-4 space-y-2 text-sm text-sp-white/80">
              <div className="flex justify-between">
                <span>Total differences:</span>
                <span className="font-mono">{diversity.totalDifferences}</span>
              </div>
              <div className="flex justify-between">
                <span>Pairwise comparisons:</span>
                <span className="font-mono">{diversity.totalComparisons}</span>
              </div>
              <div className="flex justify-between">
                <span>Sequence length:</span>
                <span className="font-mono">{diversity.seqLength}</span>
              </div>
            </div>
          </div>

          {/* Calculation Steps */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sp-white">Calculation Steps</h4>
              <button
                onClick={() => setShowCalculation(!showCalculation)}
                className="text-sp-pale-green hover:text-sp-pale-green/80 transition-colors"
              >
                {showCalculation ? 'Hide' : 'Show'} Formula
              </button>
            </div>
            
            {showCalculation && (
              <div className="space-y-3 text-sm">
                <div className="bg-gray-800 rounded p-3 font-mono text-center">
                  π = Σ(differences) / (comparisons × sequence_length)
                </div>
                <div className="space-y-2 text-sp-white/80">
                  <p><strong>Step 1:</strong> Compare all pairs of sequences</p>
                  <p><strong>Step 2:</strong> Count nucleotide differences at each position</p>
                  <p><strong>Step 3:</strong> Divide by total possible differences</p>
                  <div className="bg-sp-pale-green/10 p-2 rounded border-l-4 border-sp-pale-green">
                    <p className="text-xs">
                      π = {diversity.totalDifferences} / ({diversity.totalComparisons} × {diversity.seqLength}) = {diversity.pi.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-world Context */}
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-2">Real-world Context</h4>
            <p className="text-sm text-sp-white/80 mb-2">{currentDataset.realWorldContext}</p>
            <div className="text-xs text-sp-white/60">
              <p><strong>Applications:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Conservation genetics (population health)</li>
                <li>Medical genetics (disease susceptibility)</li>
                <li>Evolutionary biology (selection signatures)</li>
                <li>Agriculture (crop breeding programs)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-sp-white/60 text-center">
        Try different datasets to see how nucleotide diversity varies across species and populations
      </div>
    </div>
  );
}

// Interactive Self-Check Component for Page 6
export function InteractiveSelfCheck() {
  const questions = [
    {
      question: "What provides DNA with its structural stability and allows for accurate replication?",
      options: [
        "Random base arrangement",
        "Complementary base pairing (A-T, G-C)",
        "Single-strand structure",
        "Protein coating"
      ],
      correctAnswer: "Complementary base pairing (A-T, G-C)",
      explanation: "The complementary base pairing rules create a stable double helix and enable each strand to serve as a template for accurate replication."
    },
    {
      question: "What is the relationship between genes and alleles?",
      options: [
        "They are the same thing",
        "Genes are locations; alleles are the different versions found there",
        "Alleles are larger than genes",
        "Genes create alleles through translation"
      ],
      correctAnswer: "Genes are locations; alleles are the different versions found there",
      explanation: "A gene is a specific location (locus) on DNA, while alleles are the different variants of DNA sequence that can exist at that location."
    },
    {
      question: "Why is genetic variation crucial for populations?",
      options: [
        "It makes individuals identical",
        "It provides raw material for evolution and adaptation",
        "It prevents reproduction",
        "It eliminates mutations"
      ],
      correctAnswer: "It provides raw material for evolution and adaptation",
      explanation: "Genetic variation gives populations the flexibility to adapt to changing environments and survive challenges through natural selection."
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
      <div className="mt-4 text-xs text-sp-white/60 text-center">
        Answer each question to receive immediate feedback and explanations
      </div>
    </div>
  );
}

// Allele Frequency Calculator Component
export function AlleleFrequencyCalculator() {
  const [populationData, setPopulationData] = useState([
    { id: 1, genotype: 'AA', count: 25, description: 'Homozygous dominant' },
    { id: 2, genotype: 'Aa', count: 50, description: 'Heterozygous' },
    { id: 3, genotype: 'aa', count: 25, description: 'Homozygous recessive' }
  ]);
  
  const [selectedExample, setSelectedExample] = useState('balanced');
  
  const examples = {
    'balanced': [
      { id: 1, genotype: 'AA', count: 25, description: 'Homozygous dominant' },
      { id: 2, genotype: 'Aa', count: 50, description: 'Heterozygous' },
      { id: 3, genotype: 'aa', count: 25, description: 'Homozygous recessive' }
    ],
    'dominant': [
      { id: 1, genotype: 'AA', count: 64, description: 'Homozygous dominant' },
      { id: 2, genotype: 'Aa', count: 32, description: 'Heterozygous' },
      { id: 3, genotype: 'aa', count: 4, description: 'Homozygous recessive' }
    ],
    'rare': [
      { id: 1, genotype: 'AA', count: 90, description: 'Homozygous dominant' },
      { id: 2, genotype: 'Aa', count: 9, description: 'Heterozygous' },
      { id: 3, genotype: 'aa', count: 1, description: 'Homozygous recessive' }
    ]
  };

  const handleExampleChange = (example: string) => {
    setSelectedExample(example);
    setPopulationData(examples[example as keyof typeof examples]);
  };

  const updateCount = (id: number, newCount: number) => {
    setPopulationData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, count: Math.max(0, newCount) } : item
      )
    );
  };

  // Calculate allele frequencies
  const totalIndividuals = populationData.reduce((sum, item) => sum + item.count, 0);
  const totalAlleles = totalIndividuals * 2;
  
  const nAA = populationData.find(item => item.genotype === 'AA')?.count || 0;
  const nAa = populationData.find(item => item.genotype === 'Aa')?.count || 0;
  const naa = populationData.find(item => item.genotype === 'aa')?.count || 0;
  
  const pAllele = totalAlleles > 0 ? (2 * nAA + nAa) / totalAlleles : 0;
  const qAllele = 1 - pAllele;
  
  const fAA = totalIndividuals > 0 ? nAA / totalIndividuals : 0;
  const fAa = totalIndividuals > 0 ? nAa / totalIndividuals : 0;
  const faa = totalIndividuals > 0 ? naa / totalIndividuals : 0;

  const getAlleleType = (frequency: number) => {
    if (frequency > 0.5) return { type: 'Major', color: 'text-green-400' };
    if (frequency > 0.05) return { type: 'Minor', color: 'text-yellow-400' };
    return { type: 'Rare', color: 'text-red-400' };
  };

  const pType = getAlleleType(pAllele);
  const qType = getAlleleType(qAllele);

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Population Data</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Example Populations</h4>
            <div className="space-y-2">
              {Object.entries(examples).map(([key, data]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="example"
                    value={key}
                    checked={selectedExample === key}
                    onChange={(e) => handleExampleChange(e.target.value)}
                    className="w-4 h-4 text-sp-pale-green"
                  />
                  <span className="text-sp-white capitalize">{key} Population</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Genotype Counts</h4>
            <div className="space-y-3">
              {populationData.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="w-8 text-sp-white font-mono font-bold">{item.genotype}</div>
                  <input
                    type="number"
                    value={item.count}
                    onChange={(e) => updateCount(item.id, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-gray-700 text-white rounded"
                    min="0"
                  />
                  <div className="text-sm text-sp-white/70">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Allele Frequency Analysis</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Calculations</h4>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-800 rounded p-3">
                <div className="font-mono text-sp-pale-green mb-2">p = (2N₁₁ + N₁₂) / 2N</div>
                <div className="text-sp-white/80">
                  p = (2×{nAA} + {nAa}) / (2×{totalIndividuals}) = {pAllele.toFixed(4)}
                </div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="font-mono text-sp-pale-green mb-2">q = 1 - p</div>
                <div className="text-sp-white/80">
                  q = 1 - {pAllele.toFixed(4)} = {qAllele.toFixed(4)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Allele Classification</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sp-white">A allele frequency:</span>
                <div className="text-right">
                  <div className="font-mono text-sp-white">{pAllele.toFixed(4)}</div>
                  <div className={`text-xs ${pType.color}`}>{pType.type} Allele</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sp-white">a allele frequency:</span>
                <div className="text-right">
                  <div className="font-mono text-sp-white">{qAllele.toFixed(4)}</div>
                  <div className={`text-xs ${qType.color}`}>{qType.type} Allele</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Genotype Frequencies</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sp-white">f₁₁ (AA):</span>
                <span className="font-mono text-sp-white">{fAA.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sp-white">f₁₂ (Aa):</span>
                <span className="font-mono text-sp-white">{fAa.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sp-white">f₂₂ (aa):</span>
                <span className="font-mono text-sp-white">{faa.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20">
            <h4 className="font-semibold text-sp-pale-green mb-2">Key Insights</h4>
                         <ul className="text-xs text-sp-white/80 space-y-1">
               <li>• Allele frequencies sum to 1.0</li>
               <li>• Major alleles (&gt;50%) are most common</li>
               <li>• Minor alleles (5-50%) provide diversity</li>
               <li>• Rare alleles (&lt;5%) may be lost over time</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Site Frequency Spectrum Visualizer Component
export function SiteFrequencySpectrum() {
  const [selectedDataset, setSelectedDataset] = useState('neutral');
  const [sampleSize, setSampleSize] = useState(10);
  
  const datasets = {
    'neutral': {
      name: 'Neutral Evolution',
      description: 'Expected pattern under neutral evolution',
      data: [8, 4, 3, 2, 2, 1, 1, 1, 0, 0],
      color: '#3b82f6'
    },
    'expansion': {
      name: 'Population Expansion',
      description: 'Excess of rare variants from recent growth',
      data: [15, 8, 4, 2, 1, 1, 0, 0, 0, 0],
      color: '#10b981'
    },
    'bottleneck': {
      name: 'Population Bottleneck',
      description: 'Reduced diversity from population crash',
      data: [3, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      color: '#ef4444'
    },
    'selection': {
      name: 'Balancing Selection',
      description: 'Elevated intermediate frequencies',
      data: [5, 2, 2, 3, 4, 4, 3, 2, 1, 0],
      color: '#f59e0b'
    }
  };

  const currentDataset = datasets[selectedDataset as keyof typeof datasets];
  
  const generateData = () => {
    // Simulate SFS data based on sample size
    const adjustedData = currentDataset.data.slice(0, sampleSize - 1);
    return adjustedData.map((count, index) => ({
      frequency: index + 1,
      count: Math.round(count * (sampleSize / 10))
    }));
  };

  const sfsData = generateData();
  const maxCount = Math.max(...sfsData.map(d => d.count));

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Site Frequency Spectrum</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Dataset Selection</h4>
            <div className="space-y-2">
              {Object.entries(datasets).map(([key, dataset]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="dataset"
                    value={key}
                    checked={selectedDataset === key}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    className="w-4 h-4 text-sp-pale-green"
                  />
                  <div>
                    <span className="text-sp-white font-medium">{dataset.name}</span>
                    <div className="text-xs text-sp-white/70">{dataset.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Sample Size</h4>
            <div className="space-y-2">
              <input
                type="range"
                min="5"
                max="20"
                value={sampleSize}
                onChange={(e) => setSampleSize(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sp-white">{sampleSize} chromosomes</div>
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">About the SFS</h4>
            <div className="text-sm text-sp-white/80 space-y-2">
              <p>The Site Frequency Spectrum shows how many sites have derived alleles at each frequency.</p>
              <p>The x-axis represents the number of chromosomes carrying the derived allele.</p>
              <p>The y-axis represents the count of sites with that frequency.</p>
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">
            {currentDataset.name} Pattern
          </h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <div className="h-64 flex items-end space-x-2">
              {sfsData.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full transition-all duration-500"
                    style={{
                      height: `${(point.count / maxCount) * 200}px`,
                      backgroundColor: currentDataset.color,
                      minHeight: '2px'
                    }}
                  />
                  <div className="text-xs text-sp-white/70 mt-1">{point.frequency}</div>
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-sp-white/60 mt-2">
              Derived Allele Frequency (number of chromosomes)
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Pattern Interpretation</h4>
            <div className="text-sm text-sp-white/80">
              <p className="mb-2">{currentDataset.description}</p>
              <div className="space-y-1">
                {selectedDataset === 'neutral' && (
                  <p>• Neutral evolution shows declining frequencies (1/f pattern)</p>
                )}
                {selectedDataset === 'expansion' && (
                  <p>• Population expansion creates excess rare variants</p>
                )}
                {selectedDataset === 'bottleneck' && (
                  <p>• Bottlenecks remove rare variants, flatten the spectrum</p>
                )}
                {selectedDataset === 'selection' && (
                  <p>• Balancing selection maintains intermediate frequencies</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
            <h4 className="font-semibold text-blue-300 mb-2">Applications</h4>
            <ul className="text-sm text-sp-white/80 space-y-1">
              <li>• Detect population demographic changes</li>
              <li>• Identify signatures of natural selection</li>
              <li>• Estimate mutation rates and effective population size</li>
              <li>• Compare populations and species</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Polymorphism Explorer Component
export function PolymorphismExplorer() {
  const [selectedLocus, setSelectedLocus] = useState(0);
  const [populationSize, setPopulationSize] = useState(100);
  
  const loci = [
    {
      name: 'Locus A',
      alleles: ['A1', 'A2'],
      frequencies: [0.8, 0.2],
      type: 'Low Diversity',
      description: 'Common in essential genes under purifying selection'
    },
    {
      name: 'Locus B', 
      alleles: ['B1', 'B2', 'B3'],
      frequencies: [0.6, 0.3, 0.1],
      type: 'Moderate Diversity',
      description: 'Typical pattern in most coding regions'
    },
    {
      name: 'Locus C',
      alleles: ['C1', 'C2', 'C3', 'C4', 'C5'],
      frequencies: [0.35, 0.25, 0.2, 0.15, 0.05],
      type: 'High Diversity',
      description: 'Often seen in immune system genes'
    },
    {
      name: 'Locus D',
      alleles: ['D1'],
      frequencies: [1.0],
      type: 'Monomorphic',
      description: 'Fixed allele - no variation in population'
    }
  ];

  const currentLocus = loci[selectedLocus];
  const isPolymorphic = currentLocus.alleles.length > 1;
  const majorAllele = currentLocus.alleles[0];
  const majorFreq = currentLocus.frequencies[0];

  const getExpectedGenotypes = () => {
    const genotypes = [];
    for (let i = 0; i < currentLocus.alleles.length; i++) {
      for (let j = i; j < currentLocus.alleles.length; j++) {
        const allele1 = currentLocus.alleles[i];
        const allele2 = currentLocus.alleles[j];
        const freq1 = currentLocus.frequencies[i];
        const freq2 = currentLocus.frequencies[j];
        
        const expectedFreq = i === j ? freq1 * freq2 : 2 * freq1 * freq2;
        const expectedCount = Math.round(expectedFreq * populationSize);
        
        genotypes.push({
          genotype: i === j ? `${allele1}${allele1}` : `${allele1}${allele2}`,
          frequency: expectedFreq,
          count: expectedCount,
          type: i === j ? 'Homozygote' : 'Heterozygote'
        });
      }
    }
    return genotypes.sort((a, b) => b.frequency - a.frequency);
  };

  const expectedGenotypes = getExpectedGenotypes();

  return (
    <div className="bg-sp-dark-blue/50 rounded-lg p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">Polymorphism Explorer</h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Select Locus</h4>
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
                    <div className="text-xs text-sp-white/70">{locus.type}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Population Size</h4>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={populationSize}
              onChange={(e) => setPopulationSize(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sp-white mt-2">{populationSize} individuals</div>
          </div>

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Locus Classification</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sp-white">Status:</span>
                <span className={`font-medium ${isPolymorphic ? 'text-green-400' : 'text-red-400'}`}>
                  {isPolymorphic ? 'Polymorphic' : 'Monomorphic'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sp-white">Allele Count:</span>
                <span className="text-sp-white">{currentLocus.alleles.length}</span>
              </div>
              {isPolymorphic && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sp-white">Major Allele:</span>
                    <span className="text-sp-pale-green">{majorAllele} ({(majorFreq * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sp-white">Minor Alleles:</span>
                    <span className="text-sp-white">{currentLocus.alleles.length - 1}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sp-pale-green">
            {currentLocus.name} Analysis
          </h3>
          
          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Allele Frequencies</h4>
            <div className="space-y-2">
              {currentLocus.alleles.map((allele, index) => {
                const freq = currentLocus.frequencies[index];
                const isAncestral = index === 0; // Assume first allele is ancestral
                return (
                  <div key={allele} className="flex items-center space-x-3">
                    <div className="w-8 text-sp-white font-mono">{allele}</div>
                    <div className="flex-1 bg-gray-700 rounded-full h-4 relative">
                      <div 
                        className="bg-sp-pale-green h-full rounded-full transition-all duration-500"
                        style={{ width: `${freq * 100}%` }}
                      />
                    </div>
                    <div className="text-sm text-sp-white w-16">{(freq * 100).toFixed(1)}%</div>
                    <div className="text-xs text-sp-white/60 w-20">
                      {freq > 0.5 ? 'Major' : freq > 0.05 ? 'Minor' : 'Rare'}
                    </div>
                    <div className="text-xs text-sp-white/60 w-20">
                      {isAncestral ? 'Ancestral' : 'Derived'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isPolymorphic && (
            <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
              <h4 className="font-semibold text-sp-white mb-3">Expected Genotypes</h4>
              <div className="space-y-2">
                {expectedGenotypes.map((genotype, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sp-white">{genotype.genotype}</span>
                      <span className="text-xs text-sp-white/70">{genotype.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-sp-white">{genotype.count} individuals</div>
                      <div className="text-xs text-sp-white/70">{(genotype.frequency * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
            <h4 className="font-semibold text-sp-white mb-3">Biological Context</h4>
            <p className="text-sm text-sp-white/80 mb-2">{currentLocus.description}</p>
            <div className="space-y-1 text-xs text-sp-white/70">
              {currentLocus.type === 'Monomorphic' && (
                <p>• No genetic variation - all individuals have identical genotype</p>
              )}
              {currentLocus.type === 'Low Diversity' && (
                <p>• Limited variation - one allele predominates</p>
              )}
              {currentLocus.type === 'Moderate Diversity' && (
                <p>• Balanced variation - multiple alleles present</p>
              )}
              {currentLocus.type === 'High Diversity' && (
                <p>• Extensive variation - many alleles maintained</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 