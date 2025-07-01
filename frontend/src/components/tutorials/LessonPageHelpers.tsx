import React from 'react';
import { LearningObjective, KeyTerm, ContentBox, ThinkAboutIt, VisualElement } from './LessonSlide';

// Helper components for creating consistent lesson content

// Intro Page Template
interface IntroPageProps {
  title: string;
  subtitle: string;
  description: string;
  objectives: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
  estimatedTime?: number;
  previewElement?: React.ReactNode;
  studyTip?: string;
}

export function IntroPageContent({ 
  title, 
  subtitle, 
  description, 
  objectives, 
  estimatedTime, 
  previewElement,
  studyTip 
}: IntroPageProps) {
  return (
    <>
      <ContentBox>
        <p>{description}</p>
      </ContentBox>
      
      {previewElement && (
        <VisualElement caption="Interactive preview of lesson content">
          {previewElement}
        </VisualElement>
      )}

      <ContentBox title="Learning Objectives">
        <ul className="space-y-3">
          {objectives.map((objective, index) => (
            <LearningObjective key={index} icon={objective.icon}>
              {objective.text}
            </LearningObjective>
          ))}
        </ul>
        {estimatedTime && (
          <div className="mt-4 text-sm text-sp-white/60">
            Estimated time: {estimatedTime} minutes
          </div>
        )}
      </ContentBox>

      {studyTip && (
        <div className="bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-sp-pale-green">Study Tip</span>
          </div>
          <p className="text-sp-white/80">{studyTip}</p>
        </div>
      )}
    </>
  );
}

// Resources Page Template
interface ResourcesPageProps {
  title?: string;
  subtitle?: string;
  congratsMessage: string;
  nextLessonDescription?: string;
  resources: {
    textbooks?: Array<{ title: string; author: string; description?: string }>;
    articles?: Array<{ title: string; description: string }>;
    databases?: Array<{ name: string; description: string; url?: string }>;
    software?: Array<{ name: string; description: string; url?: string }>;
  };
  practiceExercises?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export function ResourcesPageContent({ 
  title = "Additional Resources",
  subtitle = "Continue Your Learning Journey",
  congratsMessage,
  nextLessonDescription,
  resources,
  practiceExercises 
}: ResourcesPageProps) {
  return (
    <>
      <ContentBox>
        <p>{congratsMessage}</p>
      </ContentBox>

      <div className="grid md:grid-cols-2 gap-6">
        <ContentBox title="Recommended Reading">
          <div className="space-y-3 text-sm">
            {resources.textbooks && (
              <div className="border-l-4 border-sp-pale-green bg-sp-pale-green/10 p-3 rounded-r">
                <h5 className="font-semibold text-sp-pale-green">Textbooks</h5>
                <ul className="space-y-1 text-sp-white/80 mt-2">
                  {resources.textbooks.map((book, index) => (
                    <li key={index}>
                      • <strong>{book.title}</strong> - {book.author}
                      {book.description && <div className="text-xs text-sp-white/60">{book.description}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {resources.articles && (
              <div className="border-l-4 border-blue-400 bg-blue-400/10 p-3 rounded-r">
                <h5 className="font-semibold text-blue-400">Research Articles</h5>
                <ul className="space-y-1 text-sp-white/80 mt-2">
                  {resources.articles.map((article, index) => (
                    <li key={index}>• {article.title} - {article.description}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ContentBox>

        <ContentBox title="Interactive Tools & Databases">
          <div className="space-y-3 text-sm">
            {resources.databases && (
              <div className="border-l-4 border-yellow-400 bg-yellow-400/10 p-3 rounded-r">
                <h5 className="font-semibold text-yellow-400">Databases</h5>
                <ul className="space-y-1 text-sp-white/80 mt-2">
                  {resources.databases.map((db, index) => (
                    <li key={index}>
                      • <strong>{db.name}:</strong> {db.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {resources.software && (
              <div className="border-l-4 border-purple-400 bg-purple-400/10 p-3 rounded-r">
                <h5 className="font-semibold text-purple-400">Software Tools</h5>
                <ul className="space-y-1 text-sp-white/80 mt-2">
                  {resources.software.map((tool, index) => (
                    <li key={index}>
                      • <strong>{tool.name}:</strong> {tool.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ContentBox>
      </div>

      {practiceExercises && (
        <ContentBox title="Practice Exercises">
          <div className="grid md:grid-cols-3 gap-4">
            {practiceExercises.map((exercise, index) => (
              <div key={index} className="bg-sp-very-dark-blue/50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">{exercise.icon}</div>
                <h5 className="font-semibold text-sp-white mb-2">{exercise.title}</h5>
                <p className="text-xs text-sp-white/70">{exercise.description}</p>
              </div>
            ))}
          </div>
        </ContentBox>
      )}

      {nextLessonDescription && (
        <div className="bg-gradient-to-r from-sp-pale-green/20 to-blue-500/20 rounded-lg p-6 border border-sp-pale-green/30">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-6 h-6 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h4 className="text-lg font-semibold text-sp-pale-green">Ready for the Next Challenge?</h4>
          </div>
          <p className="text-sp-white/80 mb-4">{nextLessonDescription}</p>
        </div>
      )}
    </>
  );
}

// Interactive Element Wrapper
interface InteractiveElementProps {
  title: string;
  description: string;
  children: React.ReactNode;
  instructions?: string;
}

export function InteractiveElement({ title, description, children, instructions }: InteractiveElementProps) {
  return (
    <VisualElement caption={instructions || `Interactive ${title.toLowerCase()}`}>
      <div className="bg-sp-dark-blue/50 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-sp-pale-green mb-2">{title}</h3>
          <p className="text-sp-white/80 text-sm">{description}</p>
        </div>
        {children}
      </div>
    </VisualElement>
  );
}

// Self-Check Question Component
interface SelfCheckQuestionProps {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export function SelfCheckQuestion({ question, options, correctAnswer, explanation }: SelfCheckQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowFeedback(true);
  };

  return (
    <div className="bg-sp-very-dark-blue/50 rounded-lg p-4">
      <h4 className="font-medium text-sp-white mb-3">{question}</h4>
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === correctAnswer;
          const showingFeedback = showFeedback;
          
          let buttonClass = 'w-full text-left p-3 rounded transition-all border ';
          if (!showingFeedback) {
            buttonClass += isSelected 
              ? 'bg-sp-pale-green/20 border-sp-pale-green text-sp-white'
              : 'bg-gray-700 border-transparent text-sp-white/80 hover:bg-gray-600';
          } else {
            if (isCorrect) {
              buttonClass += 'bg-green-500/30 border-green-500 text-green-100';
            } else if (isSelected && !isCorrect) {
              buttonClass += 'bg-red-500/30 border-red-500 text-red-100';  
            } else {
              buttonClass += 'bg-gray-700/50 border-transparent text-sp-white/60';
            }
          }

          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={showingFeedback}
              className={buttonClass}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showingFeedback && isCorrect && (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {showingFeedback && isSelected && !isCorrect && (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {showFeedback && (
        <div className="mt-3 p-3 bg-sp-pale-green/10 rounded border-l-4 border-sp-pale-green">
          <p className="text-sm text-sp-white/80">{explanation}</p>
        </div>
      )}
    </div>
  );
}

// Multi-Column Layout Helper
interface MultiColumnLayoutProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

export function MultiColumnLayout({ children, columns = 2, gap = 'md' }: MultiColumnLayoutProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
  };
  
  const gridGap = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={`grid ${gridCols[columns]} ${gridGap[gap]}`}>
      {children}
    </div>
  );
} 