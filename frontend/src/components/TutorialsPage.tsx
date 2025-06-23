import Navbar from './ui/Navbar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProgress, clearProgress } from '../lib/tutorialProgress';
import ClearProgressModal from './tutorials/ClearProgressModal';
import ParticleBackground from './ui/ParticleBackground';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'available' | 'coming-soon';
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export default function TutorialsPage() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [progress, setProgress] = useState(getProgress());
  const [showClearProgressModal, setShowClearProgressModal] = useState(false);

  useEffect(() => {
    // Update progress when the component mounts
    setProgress(getProgress());

    // Set up an interval to check for progress updates
    const interval = setInterval(() => {
      setProgress(getProgress());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const modules: Module[] = [
    {
      id: 'module-1',
      title: 'Genetic Foundations & Evolutionary Processes',
      description: 'Start your journey by understanding the fundamental concepts of genetics and evolution that form the basis of ancestral recombination graphs.',
      lessons: [
        {
          id: 'lesson-1-1',
          title: "Life's Code: DNA, Genes, Alleles, and Variation",
          description: 'Discover the basics of DNA, genes, and how genetic variation shapes diversity within populations.',
          duration: '20 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-1-2',
          title: 'Passing the Torch: Inheritance, Meiosis, and Generations',
          description: 'Learn about Mendelian inheritance, meiosis, and how genetic information flows through generations.',
          duration: '25 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-1-3',
          title: 'The Origins of Novelty & Diversity: Mutation and Recombination',
          description: 'Explore how mutations create new alleles and recombination shuffles existing variation.',
          duration: '25 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-1-4',
          title: 'Populations, Gene Pools, and Allele Frequencies',
          description: 'Understand populations, shared gene pools, and how to describe variation using allele frequencies.',
          duration: '20 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-1-5',
          title: 'Forces Shaping Populations: Drift, Selection, and Gene Flow',
          description: 'Learn about key evolutionary mechanisms: genetic drift, natural selection, and gene flow.',
          duration: '30 min',
          status: 'coming-soon'
        }
      ]
    },
    {
      id: 'module-2',
      title: 'Thinking Backwards – The Coalescent Framework',
      description: 'Learn about coalescent theory and how it helps us understand ancestral relationships in populations.',
      lessons: [
        {
          id: 'lesson-2-1',
          title: 'A Retrospective View: Introduction to Coalescent Theory',
          description: 'Understand the concept of tracing ancestry backward in time and how lineages merge in common ancestors.',
          duration: '25 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-2-2',
          title: 'The Coalescent Process: Probability and Timing',
          description: 'Learn about coalescence probabilities and timing in relation to population size.',
          duration: '30 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-2-3',
          title: 'The Wright-Fisher Model and Effective Population Size',
          description: 'Explore the Wright-Fisher model and understand the crucial concept of effective population size.',
          duration: '30 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-2-4',
          title: 'Impact of Recombination on Coalescent Histories',
          description: 'Discover how recombination affects the coalescent process and creates independent histories.',
          duration: '25 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-2-5',
          title: 'Genealogies Along the Chromosome: Marginal Trees and Tree Sequences',
          description: 'Learn about marginal trees and how tree sequences efficiently store genealogical information.',
          duration: '25 min',
          status: 'coming-soon'
        }
      ]
    },
    {
      id: 'module-3',
      title: 'Simulating Evolutionary Histories',
      description: 'Master the tools in the tskit ecosystem for simulating and analyzing evolutionary histories.',
      lessons: [
        {
          id: 'lesson-3-1',
          title: 'Simulating Coalescent Histories with msprime',
          description: 'Deep dive into msprime for generating tree sequences through coalescent simulation.',
          duration: '35 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-3-2',
          title: 'Simulating Forward with SLiM',
          description: 'Learn about forward-time simulation with SLiM for modeling selection and complex ecology.',
          duration: '35 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-3-3',
          title: 'Bridging Simulators: The Power of pyslim and Recapitation',
          description: 'Understand how to combine SLiM and msprime simulations using pyslim.',
          duration: '30 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-3-4',
          title: 'Adding Mutations to Simulated Genealogies',
          description: 'Learn how mutations are added to tree sequences in different simulation frameworks.',
          duration: '25 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-3-5',
          title: 'Understanding Tree Sequence Data: Nodes, Edges, and Tables',
          description: 'Explore the internal structure of tree sequences in tskit.',
          duration: '30 min',
          status: 'coming-soon'
        }
      ]
    },
    {
      id: 'module-4',
      title: 'The Ancestral Recombination Graph (ARG) and tskit Interaction',
      description: 'Understand ARGs in depth and how they are represented and analyzed using tskit.',
      lessons: [
        {
          id: 'lesson-4-1',
          title: 'Defining the Ancestral Recombination Graph',
          description: 'Learn what an ARG is and how it relates to marginal trees and recombination events.',
          duration: '25 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-4-2',
          title: "Visualizing ARGs: Challenges and ARGscape's Approaches",
          description: 'Explore different approaches to visualizing complex ARG structures.',
          duration: '30 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-4-3',
          title: 'Extracting Information: Querying Tree Sequences with tskit',
          description: 'Learn how to extract useful information from tree sequences using ARGscape.',
          duration: '30 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-4-4',
          title: 'Inferring ARGs from Real Data: tsinfer and Its Output',
          description: 'Understand how ARGs are inferred from real sequence data using tsinfer.',
          duration: '35 min',
          status: 'coming-soon'
        }
      ]
    },
    {
      id: 'module-5',
      title: 'Temporal and Spatial Dimensions of Ancestry',
      description: 'Add temporal and spatial context to ancestral relationships using advanced inference methods.',
      lessons: [
        {
          id: 'lesson-5-1',
          title: 'Dating the Past: Temporal Inference with tsdate',
          description: 'Learn how to estimate node ages in tree sequences using tsdate.',
          duration: '30 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-5-2',
          title: 'Placing Ancestry in Space: Introduction to Spatial Population Genetics',
          description: 'Understand the importance of geography in evolutionary history.',
          duration: '25 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-5-3',
          title: 'Methods for Inferring Ancestral Locations',
          description: 'Explore different algorithms for inferring ancestral geographic locations.',
          duration: '35 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-5-4',
          title: 'Hands-on Spatial Inference and Visualization in ARGscape',
          description: 'Practice using spatial inference and visualization tools in ARGscape.',
          duration: '40 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-5-5',
          title: 'Comparing Spatial Inferences and Exploring Discrete Spaces',
          description: 'Learn to compare different spatial inference methods and work with discrete spaces.',
          duration: '35 min',
          status: 'coming-soon'
        }
      ]
    },
    {
      id: 'module-6',
      title: 'Extending Skills and the tskit Horizon',
      description: 'Learn how to extend your analysis beyond ARGscape using the broader tskit ecosystem.',
      lessons: [
        {
          id: 'lesson-6-1',
          title: 'The tskit Ecosystem and Your Journey Forward',
          description: 'Explore the tskit ecosystem and learn how to extend your analysis programmatically.',
          duration: '40 min',
          status: 'coming-soon'
        }
      ]
    }
  ];

  const handleModuleClick = (moduleId: string) => {
    setSelectedModule(selectedModule === moduleId ? null : moduleId);
  };

  const handleClearProgress = () => {
    const newProgress = clearProgress();
    setProgress(newProgress);
    setShowClearProgressModal(false);
  };

  const getLessonProgress = (moduleId: string, lessonId: string) => {
    const moduleProgress = progress.find(m => m.id === moduleId);
    if (moduleProgress) {
      const lessonProgress = moduleProgress.lessons.find(l => l.id === lessonId);
      return lessonProgress?.completed || false;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-sp-very-dark-blue relative">
      <ParticleBackground />
      <div className="text-sp-white min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow px-4 pt-24 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-sp-very-dark-blue/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sp-dark-blue overflow-hidden p-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Learn ARGs</h1>
                <p className="text-sp-white/70 text-lg max-w-2xl mx-auto">
                  Master the concepts of ancestral recombination graphs through our carefully crafted tutorials, 
                  starting with fundamental principles and progressing to advanced applications.
                </p>
                <button
                  onClick={() => setShowClearProgressModal(true)}
                  className="mt-6 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors text-sm"
                >
                  Clear Progress
                </button>
              </div>

              {/* Module Cards */}
              <div className="space-y-8">
                {modules.map((module) => (
                  <div 
                    key={module.id}
                    className="bg-sp-dark-blue/30 rounded-2xl border border-sp-pale-green/10 overflow-hidden cursor-pointer transition-all duration-300 hover:border-sp-pale-green/30"
                    onClick={() => handleModuleClick(module.id)}
                  >
                    {/* Module Header */}
                    <div className="p-6 border-b border-sp-pale-green/10">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">{module.title}</h2>
                          <p className="text-sp-white/70">{module.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Progress indicator */}
                          <div className="text-sm text-sp-white/50">
                            {module.lessons.filter(l => getLessonProgress(module.id, l.id)).length} / {module.lessons.length} completed
                          </div>
                          <button
                            className="flex-shrink-0 w-10 h-10 rounded-lg bg-sp-pale-green/10 hover:bg-sp-pale-green/20 transition-colors flex items-center justify-center"
                          >
                            <svg
                              className={`w-6 h-6 text-sp-pale-green transition-transform duration-200 ${
                                selectedModule === module.id ? 'transform rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lesson List */}
                    <div className={`transition-all duration-300 ${
                      selectedModule === module.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}>
                      <div className="p-6 space-y-4">
                        {module.lessons.map((lesson, index) => (
                          <div
                            key={lesson.id}
                            className={`group relative rounded-xl p-6 transition-all duration-200 ${
                              lesson.status === 'available'
                                ? 'bg-sp-dark-blue hover:bg-sp-dark-blue/80 cursor-pointer'
                                : 'bg-sp-dark-blue/50 cursor-not-allowed'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (lesson.status === 'available') {
                                navigate(`/tutorials/${lesson.id}`);
                              }
                            }}
                          >
                            <div className="flex items-start gap-4">
                              {/* Lesson Number */}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                getLessonProgress(module.id, lesson.id)
                                  ? 'bg-green-500 text-white'
                                  : lesson.status === 'available'
                                    ? 'bg-sp-pale-green text-sp-very-dark-blue'
                                    : 'bg-sp-pale-green/20 text-sp-pale-green/50'
                              }`}>
                                {getLessonProgress(module.id, lesson.id) ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  index + 1
                                )}
                              </div>

                              {/* Lesson Content */}
                              <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className={`font-semibold ${
                                    lesson.status === 'available' ? 'text-sp-white' : 'text-sp-white/50'
                                  }`}>{lesson.title}</h3>
                                  {lesson.status === 'coming-soon' && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-sp-pale-green/10 text-sp-pale-green">
                                      Coming Soon
                                    </span>
                                  )}
                                  {getLessonProgress(module.id, lesson.id) && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500">
                                      Completed
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm ${
                                  lesson.status === 'available' ? 'text-sp-white/70' : 'text-sp-white/30'
                                }`}>{lesson.description}</p>
                              </div>

                              {/* Duration */}
                              <div className={`flex items-center gap-2 text-sm ${
                                lesson.status === 'available' ? 'text-sp-white/50' : 'text-sp-white/30'
                              }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {lesson.duration}
                              </div>
                            </div>

                            {/* Progress indicator for available lessons */}
                            {lesson.status === 'available' && !getLessonProgress(module.id, lesson.id) && (
                              <div className="absolute bottom-0 left-0 w-full h-1 bg-sp-pale-green/20 rounded-b-xl overflow-hidden">
                                <div className="w-0 group-hover:w-full h-full bg-sp-pale-green transition-all duration-500 ease-out" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Progress Modal */}
      <ClearProgressModal
        isOpen={showClearProgressModal}
        onClose={() => setShowClearProgressModal(false)}
        onConfirm={handleClearProgress}
      />
    </div>
  );
} 