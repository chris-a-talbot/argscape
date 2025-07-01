import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Using React.lazy for code-splitting lessons
const Lesson1_1 = React.lazy(() => import('./tutorials/Lesson1_1'));
const Lesson1_2 = React.lazy(() => import('./tutorials/Lesson1_2'));

// A map of lesson IDs to their components and status
const lessons: { [key: string]: { component: React.LazyExoticComponent<React.ComponentType<any>>; status: 'available' | 'coming-soon' } | undefined } = {
  'lesson-1-1': { component: Lesson1_1, status: 'coming-soon' },
  'lesson-1-2': { component: Lesson1_2, status: 'coming-soon' },
};

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // Get the lesson data based on the URL parameter
  const lessonData = lessonId ? lessons[lessonId] : undefined;
  const LessonComponent = lessonData?.component;

  // If the lesson doesn't exist or is coming soon, redirect to the main tutorials page
  React.useEffect(() => {
    if (!lessonData || lessonData.status === 'coming-soon') {
      navigate('/tutorials');
    }
  }, [lessonData, navigate]);

  // Return null while redirecting
  if (!lessonData || lessonData.status === 'coming-soon' || !LessonComponent) {
    return null;
  }

  return (
    <React.Suspense fallback={
      <div className="bg-sp-very-dark-blue text-white min-h-screen flex items-center justify-center">
        <p className="text-2xl text-sp-pale-green">Loading Lesson...</p>
      </div>
    }>
      <LessonComponent />
    </React.Suspense>
  );
} 