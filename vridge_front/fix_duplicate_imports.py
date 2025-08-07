#!/usr/bin/env python3
import re
import os
import glob

def fix_react_imports(file_path):
    """Fix duplicate React imports in a file"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to match React import line
    pattern = r'^import React,\s*\{([^}]+)\}\s*from\s*[\'"]react[\'"]\s*$'
    
    # Find the first line
    lines = content.split('\n')
    if not lines:
        return False
    
    first_line = lines[0]
    match = re.match(pattern, first_line)
    
    if match:
        # Extract all imports
        imports_str = match.group(1)
        # Split and clean up imports
        imports = [i.strip() for i in imports_str.split(',')]
        
        # Remove duplicates while preserving order
        seen = set()
        unique_imports = []
        for imp in imports:
            if imp and imp not in seen:
                seen.add(imp)
                unique_imports.append(imp)
        
        # Rebuild the import line
        new_import = f"import React, {{ {', '.join(unique_imports)} }} from 'react'"
        lines[0] = new_import
        
        # Write back
        with open(file_path, 'w') as f:
            f.write('\n'.join(lines))
        
        print(f"✅ Fixed: {file_path}")
        return True
    
    return False

# Files to fix
files_to_fix = [
    'src/page/Cms/FeedbackPolling.jsx',
    'src/page/Cms/FeedbackStable.jsx',
    'src/page/Cms/FeedbackV2.jsx',
    'src/page/Cms/FrameworkManagement.jsx',
    'src/page/Cms/InvitationAccept.jsx',
    'src/page/Cms/ProjectCreate.jsx',
    'src/page/Cms/ProjectCreateDebug.jsx',
    'src/page/Cms/ProjectView-fixed.jsx',
    'src/page/Cms/ProjectView.jsx',
    'src/page/Cms/VideoPlanning-working.jsx',
    'src/page/Cms/VideoPlanning.jsx'
]

fixed_count = 0
for file_path in files_to_fix:
    if os.path.exists(file_path):
        if fix_react_imports(file_path):
            fixed_count += 1
    else:
        print(f"⚠️  File not found: {file_path}")

print(f"\n✨ Fixed {fixed_count} files")