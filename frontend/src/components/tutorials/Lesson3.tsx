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
const LESSON_ID = 'lesson-1-3';

export default function Lesson3() {
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
          title="The Spark of Change: Mutation"
          subtitle="Understanding How New Genetic Variations Arise"
        >
          <div className="flex justify-center mb-8">
            <ClickableLogo size="small" className="opacity-50" />
          </div>
          <VisualElement className="max-w-2xl mx-auto">
            <div className="h-64 bg-gradient-to-br from-sp-pale-green/20 to-sp-dark-blue flex items-center justify-center">
              {/* Placeholder for mutation visualization */}
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
                What mutations are and how they occur
              </LearningObjective>
              <LearningObjective
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Different types of mutations and their effects
              </LearningObjective>
              <LearningObjective
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                How mutations create new alleles
              </LearningObjective>
              <LearningObjective
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                The role of mutations in evolution
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
            <KeyTerm term="Mutation">
              A change in DNA sequence
            </KeyTerm>
            <KeyTerm term="Point Mutation">
              A change in a single DNA base
            </KeyTerm>
            <KeyTerm term="Neutral Mutation">
              A mutation that doesn't affect fitness
            </KeyTerm>
            <KeyTerm term="Beneficial Mutation">
              A mutation that increases fitness
            </KeyTerm>
            <KeyTerm term="Deleterious Mutation">
              A mutation that decreases fitness
            </KeyTerm>
            <KeyTerm term="Mutation Rate">
              The frequency at which mutations occur
            </KeyTerm>
          </div>
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
        moduleId={MODULE_ID}
        lessonId={LESSON_ID}
        nextLessonId="lesson-1-4"
      />
    </div>
  );
} 