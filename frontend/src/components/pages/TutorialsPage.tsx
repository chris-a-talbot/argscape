import Navbar from '../layout/Navbar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProgress, clearProgress } from '../../lib/tutorialProgress';
import ClearProgressModal from '../tutorials/ClearProgressModal';
import ParticleBackground from '../ui/ParticleBackground';

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
      title: 'Genetics',
      description: 'Foundation of genetic principles.',
      lessons: [
        {
          id: 'lesson-1-1',
          title: 'DNA and Inheritance',
          description: 'Coming soon.',
          duration: '20 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-1-2',
          title: 'Mutation and Recombination',
          description: 'Coming soon.',
          duration: '25 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-1-3',
          title: 'Population Genetics',
          description: 'Coming soon.',
          duration: '25 min',
          status: 'coming-soon'
        }
      ]
    },
    {
      id: 'module-2',
      title: 'Coalescence',
      description: 'Tracing ancestry backward in time.',
      lessons: [
        {
          id: 'lesson-2-1',
          title: 'Introduction to Coalescent Theory',
          description: 'Coming soon.',
          duration: '25 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-2-2',
          title: 'The Wright-Fisher Model',
          description: 'Coming soon.',
          duration: '30 min',
          status: 'coming-soon'
        }
      ]
    },
    {
      id: 'module-3',
      title: 'Simulation',
      description: 'Simulating evolutionary histories.',
      lessons: [
        {
          id: 'lesson-3-1',
          title: 'Coalescent Simulation with msprime',
          description: 'Coming soon.',
          duration: '30 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-3-2',
          title: 'Forward Simulation with SLiM',
          description: 'Coming soon.',
          duration: '35 min',
          status: 'coming-soon'
        }
      ]
    },
    {
      id: 'module-4',
      title: 'ARGs',
      description: 'Understanding ancestral recombination graphs.',
      lessons: [
        {
          id: 'lesson-4-1',
          title: 'What is an ARG?',
          description: 'Coming soon.',
          duration: '25 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-4-2',
          title: 'Visualizing ARGs',
          description: 'Coming soon.',
          duration: '30 min',
          status: 'coming-soon'
        },
        {
          id: 'lesson-4-3',
          title: 'Working with Tree Sequences',
          description: 'Coming soon.',
          duration: '30 min',
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
        <div className="flex-grow px-4 pt-24 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="bg-sp-very-dark-blue/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sp-dark-blue overflow-hidden p-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Learn ARGs</h1>
                <p className="text-sp-white/70 text-lg max-w-2xl mx-auto">
                  Learn about ancestral recombination graphs through interactive tutorials.
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