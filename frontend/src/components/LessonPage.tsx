import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Using React.lazy for code-splitting lessons
const Lesson1_1 = React.lazy(() => import('./tutorials/Lesson1_1'));
const Lesson1_2 = React.lazy(() => import('./tutorials/Lesson1_2'));

// A map of lesson IDs to their components
const lessons: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> | undefined } = {
  'lesson-1-1': Lesson1_1,
  'lesson-1-2': Lesson1_2,
};

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // Get the component based on the URL parameter
  const LessonComponent = lessonId ? lessons[lessonId] : undefined;

  // If the lesson component doesn't exist, redirect to the main tutorials page
  React.useEffect(() => {
    if (!LessonComponent) {
      navigate('/tutorials');
    }
  }, [LessonComponent, navigate]);

  // Return null while redirecting
  if (!LessonComponent) {
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