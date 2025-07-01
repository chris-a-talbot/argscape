import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../ui/Navbar';
import ParticleBackground from '../ui/ParticleBackground';
import LessonSlide from './LessonSlide';
import LessonCompletionModal from './LessonCompletionModal';
import { getProgress, updateLessonProgress } from '../../lib/tutorialProgress';

// Types for lesson configuration
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface LessonPage {
  type: 'intro' | 'content' | 'quiz' | 'resources';
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

export interface LessonConfig {
  id: string;
  moduleId: string;
  title: string;
  pages: LessonPage[];
  quizQuestions: QuizQuestion[];
  passingScore: number; // Percentage (e.g., 75 for 75%)
  nextLessonId?: string;
  estimatedTimeMinutes?: number;
}

// Scratch Pad Component - now more modular
interface ScratchPadProps {
  lessonId: string;
  isVisible: boolean;
  isQuizPage: boolean;
  quizPassed: boolean;
}

function ModularScratchPad({ lessonId, isVisible, isQuizPage, quizPassed }: ScratchPadProps) {
  const [notes, setNotes] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-minimize and lock on quiz page
  useEffect(() => {
    if (isQuizPage && !quizPassed) {
      setIsExpanded(false);
    }
  }, [isQuizPage, quizPassed]);

  // Load notes from sessionStorage on mount (lesson-specific)
  useEffect(() => {
    const savedNotes = sessionStorage.getItem(`lesson-${lessonId}-notes`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [lessonId]);

  // Save notes to sessionStorage whenever notes change
  useEffect(() => {
    sessionStorage.setItem(`lesson-${lessonId}-notes`, notes);
  }, [notes, lessonId]);

  if (!isVisible) return null;

  const isLockedOut = isQuizPage && !quizPassed;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg transition-all duration-300 ${
        isExpanded ? 'w-80 h-64' : 'w-12 h-12'
      }`}>
        {!isExpanded ? (
          <button
            onClick={() => !isLockedOut && setIsExpanded(true)}
            disabled={isLockedOut}
            className={`w-full h-full flex items-center justify-center rounded-lg transition-colors ${
              isLockedOut 
                ? 'text-gray-500 bg-gray-200 cursor-not-allowed' 
                : 'text-yellow-800 hover:bg-yellow-200'
            }`}
            title={isLockedOut ? "Scratch pad locked during quiz" : "Open Scratch Pad"}
          >
            {isLockedOut ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
          </button>
        ) : (
          <div className="p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-yellow-800">Scratch Pad</h4>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-yellow-600 hover:text-yellow-800 transition-colors"
                title="Minimize"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take notes here..."
              className="flex-1 w-full text-sm text-gray-800 bg-transparent border-none outline-none resize-none placeholder-yellow-600/60"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Quiz Page Component
interface QuizPageProps {
  questions: QuizQuestion[];
  answers: (string | null)[];
  score: number | null;
  onSelectAnswer: (questionIndex: number, answer: string) => void;
  onSubmit: () => void;
  passingScore: number;
}

function QuizPage({ questions, answers, score, onSelectAnswer, onSubmit, passingScore }: QuizPageProps) {
  return (
    <LessonSlide title="Interactive Quiz" subtitle="Test Your Understanding">
      <div className="space-y-6">
        {score !== null && (
          <div className={`p-4 mb-4 rounded-lg ${score >= passingScore ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            <h3 className="font-bold">Your Score: {score.toFixed(0)}%</h3>
            {score < passingScore && <p>You need {passingScore}% or higher to pass. Please review the lesson and try again.</p>}
            {score >= passingScore && <p>Excellent work! You've successfully completed this lesson.</p>}
          </div>
        )}
        
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index}>
              <p className="font-semibold mb-2">{index + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map(option => {
                  const isSelected = answers[index] === option;
                  const isCorrect = q.correctAnswer === option;
                  let optionClass = 'bg-sp-dark-blue/50 hover:bg-sp-dark-blue';

                  if (score !== null) {
                    if (isCorrect) {
                      optionClass = 'bg-green-500/30 border-green-500';
                    } else if (isSelected && !isCorrect) {
                      optionClass = 'bg-red-500/30 border-red-500';
                    } else {
                      optionClass = 'border-transparent';
                    }
                  } else if (isSelected) {
                    optionClass = 'bg-sp-pale-green/20 border-sp-pale-green';
                  } else {
                    optionClass = 'border-transparent';
                  }

                  return (
                    <label 
                      key={option} 
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border ${optionClass}`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={isSelected}
                        onChange={() => onSelectAnswer(index, option)}
                        disabled={score !== null}
                        className="w-4 h-4 text-sp-pale-green bg-gray-700 border-gray-600 focus:ring-sp-pale-green ring-offset-gray-800 focus:ring-2"
                      />
                      <span className="ml-3">{option}</span>
                      {score !== null && isCorrect && (
                        <svg className="ml-auto w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {score !== null && isSelected && !isCorrect && (
                        <svg className="ml-auto w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </label>
                  );
                })}
              </div>
              {score !== null && q.explanation && (
                <div className="mt-3 p-3 bg-sp-pale-green/10 rounded border-l-4 border-sp-pale-green">
                  <p className="text-sm text-sp-white/80">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-center">
          <button
            onClick={onSubmit}
            disabled={answers.includes(null) || score !== null}
            className="px-8 py-3 rounded-lg bg-sp-pale-green text-sp-very-dark-blue font-semibold hover:bg-sp-pale-green/90 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Submit Answers
          </button>
        </div>
      </div>
    </LessonSlide>
  );
}

// Main Base Lesson Component
interface BaseLessonProps {
  config: LessonConfig;
}

export default function BaseLessonComponent({ config }: BaseLessonProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(string | null)[]>(Array(config.quizQuestions.length).fill(null));
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const topOfPageRef = useRef<HTMLDivElement>(null);

  // Validate lesson structure
  useEffect(() => {
    const pageTypes = config.pages.map(p => p.type);
    const requiredTypes: Array<'intro' | 'quiz' | 'resources'> = ['intro', 'quiz', 'resources'];
    const hasAllRequired = requiredTypes.every(type => pageTypes.includes(type));
    const hasContent = pageTypes.includes('content');
    
    if (!hasAllRequired || !hasContent) {
      console.error('Lesson must have intro, at least one content page, quiz, and resources pages');
    }
  }, [config.pages]);

  // Load lesson progress
  useEffect(() => {
    const progress = getProgress();
    const moduleProgress = progress.find(m => m.id === config.moduleId);
    const lessonProgress = moduleProgress?.lessons.find(l => l.id === config.id);
    if (lessonProgress?.completed) {
      setIsCompleted(true);
    }
  }, [config.id, config.moduleId]);

  // Find quiz and resources page indices
  const quizPageIndex = config.pages.findIndex(p => p.type === 'quiz');
  const resourcesPageIndex = config.pages.findIndex(p => p.type === 'resources');
  const totalSlides = config.pages.length;

  // Determine page states
  const isQuizPage = currentSlide === quizPageIndex;
  const isResourcesPage = currentSlide === resourcesPageIndex;

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    if (quizScore !== null) return;
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answer;
    setQuizAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    config.quizQuestions.forEach((q, index) => {
      if (quizAnswers[index] === q.correctAnswer) {
        score++;
      }
    });
    const finalScore = (score / config.quizQuestions.length) * 100;
    setQuizScore(finalScore);

    if (finalScore >= config.passingScore) {
      updateLessonProgress(config.moduleId, config.id, { completed: true });
      setIsCompleted(true);
      setShowCompletionModal(true);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
      topOfPageRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      topOfPageRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderCurrentPage = () => {
    const currentPage = config.pages[currentSlide];
    
    if (currentPage.type === 'quiz') {
      return (
        <QuizPage
          questions={config.quizQuestions}
          answers={quizAnswers}
          score={quizScore}
          onSelectAnswer={handleSelectAnswer}
          onSubmit={handleSubmitQuiz}
          passingScore={config.passingScore}
        />
      );
    }
    
    return (
      <LessonSlide title={currentPage.title} subtitle={currentPage.subtitle}>
        {currentPage.content}
      </LessonSlide>
    );
  };

  const getNextButtonText = () => {
    if (isResourcesPage) return "Continue to Next Lesson";
    if (currentSlide === quizPageIndex - 1) return "Take the Quiz";
    return "Next";
  };

  return (
    <div className="min-h-screen bg-sp-very-dark-blue text-sp-white" ref={topOfPageRef}>
      <ParticleBackground />
      <Navbar />
      <div className="relative max-w-4xl mx-auto px-4 pt-28 pb-20">
        <div className="bg-sp-very-dark-blue/90 backdrop-blur-sm rounded-2xl shadow-xl border border-sp-dark-blue p-8 md:p-12">
          {renderCurrentPage()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="px-6 py-2 rounded-lg bg-sp-dark-blue hover:bg-sp-pale-green/20 text-sp-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center text-sm text-sp-white/50">
            Page {currentSlide + 1} of {totalSlides}
            {config.estimatedTimeMinutes && (
              <span className="ml-4">• ~{config.estimatedTimeMinutes} min</span>
            )}
          </div>
          {isResourcesPage ? (
            <button
              onClick={() => config.nextLessonId ? window.location.href = `/tutorials/${config.nextLessonId}` : null}
              disabled={!config.nextLessonId}
              className="px-8 py-3 rounded-lg bg-sp-pale-green text-sp-very-dark-blue font-semibold hover:bg-sp-pale-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {config.nextLessonId ? "Continue to Next Lesson" : "Course Complete"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={currentSlide === totalSlides - 1}
              className="px-6 py-2 rounded-lg bg-sp-dark-blue hover:bg-sp-pale-green/20 text-sp-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getNextButtonText()}
            </button>
          )}
        </div>
        
        {/* Completion button on quiz page after passing */}
        {isCompleted && isQuizPage && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowCompletionModal(true)}
              className="px-8 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600/90 transition-colors"
            >
              Finish Lesson
            </button>
          </div>
        )}
      </div>
      
      {/* Completion Modal */}
      <LessonCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        lessonTitle={config.title}
        nextLessonId={config.nextLessonId}
        onGamesToResources={() => {
          setCurrentSlide(resourcesPageIndex);
          topOfPageRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
      
      {/* Scratch Pad */}
      <ModularScratchPad 
        lessonId={config.id}
        isVisible={true} 
        isQuizPage={isQuizPage} 
        quizPassed={quizScore !== null && quizScore >= config.passingScore} 
      />
    </div>
  );
} 