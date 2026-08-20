#!/bin/bash
sed -i 's/onOpenAuthSyncModal/onOpenAuthSyncModal,\n  onChangeCourse/g' src/components/Navbar.tsx

# Add the button
sed -i '/<div className="flex items-center gap-2">/a \
            {onChangeCourse && (\n              <button\n                onClick={onChangeCourse}\n                title="Change Course"\n                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/50 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"\n              >\n                Change Course\n              </button>\n            )}' src/components/Navbar.tsx
