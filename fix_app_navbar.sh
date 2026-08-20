#!/bin/bash
sed -i '/<Navbar/a \
        onChangeCourse={() => {\n          const newStats = { ...stats, currentCourseId: undefined };\n          setStats(newStats);\n          saveUserStats(newStats);\n        }}' src/App.tsx
