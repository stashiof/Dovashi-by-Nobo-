const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

code = code.replace(`  onChangeCourse?: () => void;
  onOpenAuthSyncModal,
  onChangeCourse: () => void;`, `  onOpenAuthSyncModal?: () => void;
  onChangeCourse: () => void;`);

code = code.replace(`  onOpenAuthSyncModal,
  onChangeCourse
} : {`, `  onOpenAuthSyncModal,
  onChangeCourse
}) => {`);

code = code.replace(/94:  onChangeCourse\}/g, "");

fs.writeFileSync('src/components/Navbar.tsx', code);
