#!/bin/bash

echo "🔍 Finding and fixing all duplicate React imports..."

# Find all JSX/JS files with duplicate React imports
find src pages -type f \( -name "*.jsx" -o -name "*.js" \) -exec grep -l "import.*from.*'react'" {} \; | while read file; do
  # Check if file has duplicate React imports
  if grep -c "import.*from.*'react'" "$file" > /dev/null 2>&1; then
    count=$(grep -c "import.*from.*'react'" "$file")
    if [ "$count" -gt 1 ]; then
      echo "Fixing: $file"
      
      # Create a temporary file
      temp_file=$(mktemp)
      
      # Extract all React imports and combine them
      react_imports=$(grep "import.*from.*'react'" "$file" | sed "s/import//" | sed "s/from.*$//" | tr -d '{}' | tr ',' '\n' | sort -u | tr '\n' ',' | sed 's/,$//')
      
      # Check if React is imported
      has_react=false
      if echo "$react_imports" | grep -q "React"; then
        has_react=true
        react_imports=$(echo "$react_imports" | sed 's/React,*//' | sed 's/,React//' | sed 's/^,//' | sed 's/,$//')
      fi
      
      # Remove all React import lines
      grep -v "import.*from.*'react'" "$file" > "$temp_file"
      
      # Add the combined import at the beginning
      if [ "$has_react" = true ]; then
        if [ -n "$react_imports" ]; then
          echo "import React, { $react_imports } from 'react'" | cat - "$temp_file" > "$file"
        else
          echo "import React from 'react'" | cat - "$temp_file" > "$file"
        fi
      else
        if [ -n "$react_imports" ]; then
          echo "import { $react_imports } from 'react'" | cat - "$temp_file" > "$file"
        fi
      fi
      
      rm "$temp_file"
      echo "✅ Fixed: $file"
    fi
  fi
done

echo "✨ All duplicate imports fixed!"