const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

code = code.replace(/ onClick=\{onOpenAuthSyncModal,\n   \}/g, " onClick={onOpenAuthSyncModal}");

fs.writeFileSync('src/components/Navbar.tsx', code);
