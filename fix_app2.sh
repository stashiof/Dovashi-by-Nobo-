#!/bin/bash
sed -i '/{([^)]*API Key Modal[^)]*)}/d' src/App.tsx
sed -i '/{\/\* API Key Modal \*\//i \
        </>\n      )}' src/App.tsx
