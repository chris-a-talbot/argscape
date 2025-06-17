import React from 'react';

interface LessonSlideProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function LessonSlide({ title, subtitle, children, className = '' }: LessonSlideProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-sp-pale-green">{title}</h2>
        {subtitle && (
          <p className="text-lg text-sp-white/70">{subtitle}</p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

interface LearningObjectiveProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function LearningObjective({ icon, children }: LearningObjectiveProps) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 text-sp-pale-green">
        {icon}
      </div>
      <span className="text-sp-white/70">{children}</span>
    </li>
  );
}

interface KeyTermProps {
  term: string;
  children: React.ReactNode;
}

export function KeyTerm({ term, children }: KeyTermProps) {
  return (
    <div className="bg-sp-dark-blue rounded-lg p-4">
      <h4 className="font-semibold text-sp-pale-green mb-1">{term}</h4>
      <p className="text-sm text-sp-white/70">{children}</p>
    </div>
  );
}

interface ContentBoxProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function ContentBox({ title, children, className = '' }: ContentBoxProps) {
  return (
    <div className={`bg-sp-dark-blue/30 rounded-xl p-6 border border-sp-pale-green/10 ${className}`}>
      {title && (
        <h3 className="text-xl font-semibold mb-4 text-sp-pale-green">{title}</h3>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface ThinkAboutItProps {
  question: string;
  hint?: string;
}

export function ThinkAboutIt({ question, hint }: ThinkAboutItProps) {
  return (
    <div className="bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="font-semibold text-sp-pale-green">Think About It</span>
      </div>
      <p className="text-sp-white/80 mb-2">{question}</p>
      {hint && (
        <p className="text-sm text-sp-white/60 italic">Hint: {hint}</p>
      )}
    </div>
  );
}

interface VisualElementProps {
  children: React.ReactNode;
  caption?: string;
  className?: string;
}

export function VisualElement({ children, caption, className = '' }: VisualElementProps) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <div className="bg-sp-dark-blue/50 p-4">
        {children}
      </div>
      {caption && (
        <p className="text-sm text-sp-white/60 text-center mt-2">{caption}</p>
      )}
    </div>
  );
} 