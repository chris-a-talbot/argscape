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
const LESSON_ID = 'lesson-1-2';

export default function Lesson2() {
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
          title="Passing the Torch: Inheritance, Meiosis, and Generations"
          subtitle="Understanding How Genetic Information Flows Through Time"
        >
          <div className="flex justify-center mb-8">
            <ClickableLogo size="small" className="opacity-50" />
          </div>
          <VisualElement className="max-w-2xl mx-auto">
            <div className="h-64 bg-gradient-to-br from-sp-pale-green/20 to-sp-dark-blue flex items-center justify-center">
              {/* Meiosis/inheritance visualization placeholder */}
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
                Understand the basic principles of Mendelian inheritance
              </LearningObjective>
              <LearningObjective
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Learn how meiosis creates gametes and shuffles genetic material
              </LearningObjective>
              <LearningObjective
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Define generations as discrete time steps in evolution
              </LearningObjective>
              <LearningObjective
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Connect inheritance patterns to tskit's modeling of transmission events
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
            <KeyTerm term="Inheritance">
              The passing of genetic material from parents to offspring
            </KeyTerm>
            <KeyTerm term="Meiosis">
              Cell division that produces gametes with half the normal chromosome number
            </KeyTerm>
            <KeyTerm term="Generation">
              A group of individuals of the same age in a population's lineage
            </KeyTerm>
            <KeyTerm term="Gamete">
              Reproductive cells (sperm or egg) containing half the genetic material
            </KeyTerm>
            <KeyTerm term="Dominant">
              An allele that masks the effect of its recessive partner
            </KeyTerm>
            <KeyTerm term="Recessive">
              An allele whose effect is masked by a dominant allele
            </KeyTerm>
          </div>
        </LessonSlide>
      )
    },
    {
      id: 'introduction',
      title: 'Introduction',
      content: (
        <LessonSlide title="The Flow of Genetic Information">
          <ContentBox>
            <p className="text-sp-white/80 text-lg">
              Understanding how genetic information passes from one generation to the next is crucial 
              for tracing ancestry. This transmission process, governed by the rules of inheritance 
              and shaped by meiosis, creates the patterns that tskit uses to reconstruct evolutionary 
              histories. Each generation represents a discrete time step in this journey through 
              evolutionary time.
            </p>
          </ContentBox>
          <ThinkAboutIt
            question="How is passing genetic information through generations similar to passing down family heirlooms?"
            hint="Consider how both carry information about the past and can be traced back through time."
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
        nextLessonId="lesson-1-3"
        lessonTitle="Passing the Torch: Inheritance, Meiosis, and Generations"
      />
    </div>
  );
} 