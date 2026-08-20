#!/bin/bash
# Insert imports
sed -i '/import { Navbar }/i import { CourseSelectionScreen } from "./components/CourseSelectionScreen";\nimport { COURSES } from "./data/courses";\n' src/App.tsx

# Create a variable for activeCourse
sed -i '/const handleOpenAuthSyncModal/i \
  const activeCourse = COURSES.find(c => c.id === stats.currentCourseId) || COURSES[0];\n\
  const handleJoinCourse = (courseId: string) => {\n\
    const newStats = { ...stats, currentCourseId: courseId, joinedCourseIds: [...(stats.joinedCourseIds || []), courseId] };\n\
    setStats(newStats);\n\
    saveUserStats(newStats);\n\
  };\n\
' src/App.tsx

# Wrap startCall
sed -i '/onStartCall={startCall}/c\
            onStartCall={(pattern) => startCall(pattern, activeCourse.sourceLanguage, activeCourse.targetLanguage)}' src/App.tsx

# Handle conditional rendering of CourseSelectionScreen
sed -i '/<div className="min-h-screen bg-\[#FDFBF7\] flex flex-col font-sans">/a \
      {(!stats.currentCourseId) ? (\n\
        <CourseSelectionScreen onJoinCourse={handleJoinCourse} />\n\
      ) : (\n\
        <>\n' src/App.tsx

# Close the conditional rendering before API key modal
sed -i '/{([^)]*API Key Modal[^)]*)}/i \
        </>\n      )}' src/App.tsx
