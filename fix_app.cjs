const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  "import { Navbar } from './components/Navbar';",
  "import { Navbar } from './components/Navbar';\nimport { CourseSelectionScreen } from './components/CourseSelectionScreen';\nimport { COURSES } from './data/courses';"
);

// 2. Add course variables inside component
code = code.replace(
  "const handleOpenApiKeyModal = useCallback(() => {",
  `const activeCourse = COURSES.find(c => c.id === stats.currentCourseId) || COURSES[0];
  const handleJoinCourse = (courseId: string) => {
    const newStats = { ...stats, currentCourseId: courseId, joinedCourseIds: [...(stats.joinedCourseIds || []), courseId] };
    setStats(newStats);
    saveUserStats(newStats);
  };
  const handleOpenApiKeyModal = useCallback(() => {`
);

// 3. Update Navbar usage
code = code.replace(
  "<Navbar",
  `<Navbar
        onChangeCourse={() => {
          const newStats = { ...stats, currentCourseId: undefined };
          setStats(newStats);
          saveUserStats(newStats);
        }}`
);

// 4. Conditional rendering for CourseSelectionScreen
code = code.replace(
  `<div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">`,
  `<div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      {!stats.currentCourseId ? (
        <CourseSelectionScreen onJoinCourse={handleJoinCourse} />
      ) : (
        <>`
);

// 5. Close conditional rendering at the bottom, before API Key Modal
code = code.replace(
  `{/* API Key Modal */}`,
  `</>
      )}
      {/* API Key Modal */}`
);

// 6. Update onStartCall
code = code.replace(
  "onStartCall={startCall}",
  "onStartCall={(pattern) => startCall(pattern, activeCourse.sourceLanguage, activeCourse.targetLanguage)}"
);

fs.writeFileSync('src/App.tsx', code);
