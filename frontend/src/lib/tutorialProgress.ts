interface LessonProgress {
  id: string;
  completed: boolean;
  lastVisitedSection: number;
  completedSections: string[];
}

interface ModuleProgress {
  id: string;
  completed: boolean;
  lessons: LessonProgress[];
}

const STORAGE_KEY = 'argscape_tutorial_progress';

export function getProgress(): ModuleProgress[] {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : initializeProgress();
}

export function saveProgress(progress: ModuleProgress[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function updateLessonProgress(
  moduleId: string,
  lessonId: string,
  update: Partial<LessonProgress>
) {
  const progress = getProgress();
  const module = progress.find(m => m.id === moduleId);
  if (module) {
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (lesson) {
      Object.assign(lesson, update);
      // Check if all lessons in module are complete
      module.completed = module.lessons.every(l => l.completed);
      saveProgress(progress);
    }
  }
}

export function getLessonProgress(moduleId: string, lessonId: string): LessonProgress | null {
  const progress = getProgress();
  const module = progress.find(m => m.id === moduleId);
  if (module) {
    return module.lessons.find(l => l.id === lessonId) || null;
  }
  return null;
}

export function clearProgress() {
  sessionStorage.removeItem(STORAGE_KEY);
  return initializeProgress();
}

function initializeProgress(): ModuleProgress[] {
  const initialProgress: ModuleProgress[] = [
    {
      id: 'module-1',
      completed: false,
      lessons: [
        {
          id: 'lesson-1-1',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-1-2',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-1-3',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-1-4',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-1-5',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        }
      ]
    },
    {
      id: 'module-2',
      completed: false,
      lessons: [
        {
          id: 'lesson-2-1',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-2-2',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-2-3',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-2-4',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-2-5',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        }
      ]
    },
    {
      id: 'module-3',
      completed: false,
      lessons: [
        {
          id: 'lesson-3-1',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-3-2',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-3-3',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-3-4',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-3-5',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        }
      ]
    },
    {
      id: 'module-4',
      completed: false,
      lessons: [
        {
          id: 'lesson-4-1',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-4-2',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-4-3',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-4-4',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        }
      ]
    },
    {
      id: 'module-5',
      completed: false,
      lessons: [
        {
          id: 'lesson-5-1',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-5-2',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-5-3',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-5-4',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        },
        {
          id: 'lesson-5-5',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        }
      ]
    },
    {
      id: 'module-6',
      completed: false,
      lessons: [
        {
          id: 'lesson-6-1',
          completed: false,
          lastVisitedSection: 0,
          completedSections: []
        }
      ]
    }
  ];
  saveProgress(initialProgress);
  return initialProgress;
} 