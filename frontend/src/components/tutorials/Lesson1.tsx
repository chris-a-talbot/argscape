import { useState, useEffect } from 'react';
import Navbar from '../ui/Navbar';
import LessonSlide, { 
  LearningObjective, 
  KeyTerm, 
  ContentBox, 
  ThinkAboutIt, 
  VisualElement 
} from './LessonSlide';
import { updateLessonProgress, getLessonProgress } from '../../lib/tutorialProgress';
import ClickableLogo from '../ui/ClickableLogo';
import LessonCompletionModal from './LessonCompletionModal';

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const MODULE_ID = 'module-1';
const LESSON_ID = 'lesson-1-1';

export default function Lesson1() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    const progress = getLessonProgress(MODULE_ID, LESSON_ID);
    if (progress) {
      setCurrentSectionIndex(progress.lastVisitedSection);
    }
  }, []);

  useEffect(() => {
    updateLessonProgress(MODULE_ID, LESSON_ID, {
      lastVisitedSection: currentSectionIndex
    });
  }, [currentSectionIndex]);

  const sections: Section[] = [
    {
      id: 'title',
      title: 'Title',
      content: (
        <LessonSlide
          title="Life's Code: DNA, Genes, Alleles, and Variation"
          subtitle="Understanding the Basic Units of Inheritance"
        >
          <div className="flex justify-center mb-8">
            <ClickableLogo size="small" className="opacity-50" />
          </div>
          <VisualElement className="max-w-2xl mx-auto">
            <div className="h-64 bg-gradient-to-br from-sp-pale-green/20 to-sp-dark-blue flex items-center justify-center">
              <div className="w-32 h-32 animate-spin-slow">
                {/* DNA helix visualization placeholder */}
              </div>
            </div>
          </VisualElement>
        </LessonSlide>
      )
    },
    {
      id: 'objectives',
      title: 'Learning Objectives',
      content: (
        <LessonSlide title="What You'll Learn in This Lesson">
          <ContentBox>
            <ul className="space-y-4">
              <LearningObjective
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Understand DNA structure and its role as the carrier of genetic information
              </LearningObjective>
              <LearningObjective
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Define genes as functional units and their relationship to traits
              </LearningObjective>
              <LearningObjective
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Explore alleles as variants of genes
              </LearningObjective>
              <LearningObjective
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Recognize the importance of genetic variation in populations
              </LearningObjective>
            </ul>
          </ContentBox>
        </LessonSlide>
      )
    },
    {
      id: 'key-terms',
      title: 'Key Terms',
      content: (
        <LessonSlide title="Key Terms We'll Cover">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KeyTerm term="DNA">
              The molecule that carries genetic instructions for development and functioning
            </KeyTerm>
            <KeyTerm term="Gene">
              A segment of DNA that codes for a specific protein or trait
            </KeyTerm>
            <KeyTerm term="Allele">
              Different versions or variants of the same gene
            </KeyTerm>
            <KeyTerm term="Genetic Variation">
              Differences in DNA sequences between individuals
            </KeyTerm>
            <KeyTerm term="Nucleotide">
              The building blocks of DNA (A, T, C, G)
            </KeyTerm>
            <KeyTerm term="Genome">
              The complete set of genetic material in an organism
            </KeyTerm>
          </div>
        </LessonSlide>
      )
    },
    {
      id: 'introduction',
      title: 'Introduction',
      content: (
        <LessonSlide title="The Building Blocks of Life">
          <ContentBox>
            <p className="text-sp-white/80 text-lg">
              Before we can understand how populations evolve and how we trace their histories, 
              we need to understand the basic units of inheritance. DNA is the molecule that 
              carries genetic information, passed down through generations and shaped by 
              evolutionary forces. This information is what tskit tracks as it reconstructs 
              ancestral relationships.
            </p>
          </ContentBox>
          <ThinkAboutIt
            question="Why do you think it's important to understand DNA and genes before studying their history?"
            hint="Consider how understanding the parts of a car helps you understand its maintenance history."
          />
        </LessonSlide>
      )
    }
  ];

  const nextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      setShowCompletionModal(true);
    }
  };

  const previousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-sp-very-dark-blue text-sp-white flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col">
        {sections[currentSectionIndex].content}
        
        {/* Navigation Controls */}
        <div className="fixed bottom-0 left-0 right-0 bg-sp-very-dark-blue/80 backdrop-blur-sm border-t border-sp-pale-green/10 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button
              onClick={previousSection}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentSectionIndex > 0
                  ? 'bg-sp-pale-green/10 hover:bg-sp-pale-green/20 text-sp-pale-green'
                  : 'bg-sp-pale-green/5 text-sp-pale-green/30 cursor-not-allowed'
              }`}
              disabled={currentSectionIndex === 0}
            >
              Previous
            </button>
            <div className="text-sp-white/50 text-sm">
              {currentSectionIndex + 1} / {sections.length}
            </div>
            <button
              onClick={nextSection}
              className="px-4 py-2 rounded-lg bg-sp-pale-green/10 hover:bg-sp-pale-green/20 text-sp-pale-green transition-colors"
            >
              {currentSectionIndex === sections.length - 1 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      <LessonCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        nextLessonId="lesson-1-2"
        lessonTitle="Life's Code: DNA, Genes, Alleles, and Variation"
      />
    </div>
  );
} 