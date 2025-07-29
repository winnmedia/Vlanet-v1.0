# Button Migration Guide

This guide provides comprehensive instructions for migrating all button implementations to use the unified Button component located at `src/components/unified/Button`.

## Table of Contents
1. [Button Component API](#button-component-api)
2. [Migration Patterns](#migration-patterns)
3. [Common Migrations](#common-migrations)
4. [Using the Migration Scripts](#using-the-migration-scripts)
5. [Manual Migration Checklist](#manual-migration-checklist)

## Button Component API

The unified Button component supports the following props:

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  onClick?: () => void;
  // ... all standard HTML button attributes
}
```

## Migration Patterns

### 1. Native HTML Button → Unified Button

**Before:**
```jsx
<button className="save-btn" onClick={handleSave}>
  Save
</button>
```

**After:**
```jsx
import { Button } from '../components/unified/Button';

<Button variant="primary" onClick={handleSave}>
  Save
</Button>
```

### 2. Antd Button → Unified Button

**Before:**
```jsx
import { Button } from 'antd';

<Button type="primary" size="large">
  Submit
</Button>
```

**After:**
```jsx
import { Button } from '../components/unified/Button';

<Button variant="primary" size="lg">
  Submit
</Button>
```

### 3. Icon Buttons

**Before:**
```jsx
<button className="delete-btn">
  <svg>...</svg>
</button>
```

**After:**
```jsx
<Button variant="danger" icon={<DeleteIcon />} />
```

### 4. Buttons with Text and Icon

**Before:**
```jsx
<button className="upload-btn">
  <UploadIcon /> Upload File
</button>
```

**After:**
```jsx
<Button variant="primary" icon={<UploadIcon />}>
  Upload File
</Button>
```

## Common Migrations

### Class Name → Variant Mapping

| Old Class | New Variant | Notes |
|-----------|-------------|-------|
| `save-btn`, `submit-btn` | `primary` | Primary actions |
| `cancel-btn`, `edit-btn` | `secondary` | Secondary actions |
| `delete-btn`, `remove-btn` | `danger` | Destructive actions |
| `accept-btn`, `confirm-btn` | `success` | Positive actions |
| `back-btn` | `ghost` | Navigation |
| `btn-link` | `link` | Link style |

### Size Mapping

| Old Class/Attribute | New Size |
|--------------------|----------|
| `small`, `btn-sm` | `sm` |
| `medium`, `btn-md` | `md` |
| `large`, `btn-lg` | `lg` |

### Special Cases

#### Full Width Buttons
**Before:**
```jsx
<button className="btn-primary full-width">Submit</button>
```

**After:**
```jsx
<Button fullWidth>Submit</Button>
```

#### Loading State
**Before:**
```jsx
<button disabled>{loading ? 'Loading...' : 'Submit'}</button>
```

**After:**
```jsx
<Button loading={loading}>Submit</Button>
```

#### Custom Styled Buttons
**Before:**
```jsx
<button style={{ marginTop: '10px', width: '200px' }}>
  Custom Button
</button>
```

**After:**
```jsx
<Button style={{ marginTop: '10px', width: '200px' }}>
  Custom Button
</Button>
```

## Using the Migration Scripts

### 1. Analysis Script

First, run the analyzer to understand current button usage:

```bash
node scripts/button-migration-analyzer.js
```

This will generate `button-migration-analysis.json` with:
- All button occurrences
- Class name patterns
- Inline styles usage
- Icon button patterns

### 2. Migration Script

Run the migration script in dry-run mode first:

```bash
# Dry run (no changes)
node scripts/migrate-buttons.js

# Execute migration
node scripts/migrate-buttons.js --execute

# Specific pattern
node scripts/migrate-buttons.js --pattern="src/page/**/*.jsx" --execute
```

## Manual Migration Checklist

For complex cases that require manual migration:

1. **Import Statement**
   - [ ] Remove `import { Button } from 'antd'`
   - [ ] Add `import { Button } from '../components/unified/Button'`
   - [ ] Adjust relative path based on file location

2. **Button Props**
   - [ ] Map `type` to `variant`
   - [ ] Map `size` values (small → sm, large → lg)
   - [ ] Convert `shape="circle"` to icon-only button
   - [ ] Handle `danger` prop → `variant="danger"`

3. **Event Handlers**
   - [ ] Ensure all event handlers are preserved
   - [ ] Check for custom attributes

4. **Styling**
   - [ ] Remove button-specific CSS classes
   - [ ] Use component props instead of classes
   - [ ] Preserve necessary inline styles

5. **Testing**
   - [ ] Visual regression test
   - [ ] Functionality test
   - [ ] Accessibility check

## Examples from VideoPlanet Codebase

### VideoPlanning.jsx Buttons
```jsx
// Before
<button className="generate-btn" onClick={generateContent}>
  AI 생성
</button>

// After
<Button variant="primary" onClick={generateContent}>
  AI 생성
</Button>
```

### Feedback.jsx Icon Buttons
```jsx
// Before
<button className="feedbackButtonIconOnly" title="스크린샷">
  <svg>...</svg>
</button>

// After
<Button 
  variant="ghost" 
  icon={<CameraIcon />} 
  title="스크린샷"
/>
```

### MyPage.jsx Action Buttons
```jsx
// Before
<button className="save-btn" onClick={handleSave}>
  저장
</button>

// After
<Button variant="primary" onClick={handleSave}>
  저장
</Button>
```

## Post-Migration Cleanup

After migration:

1. **Remove Unused Styles**
   ```bash
   # Find and remove unused button styles
   grep -r "\.save-btn\|\.cancel-btn\|\.delete-btn" src/css/
   ```

2. **Update Tests**
   - Update component tests to use new Button props
   - Update E2E tests if they rely on class names

3. **Documentation**
   - Update component documentation
   - Add migration notes to MEMORY.md

## Troubleshooting

### Common Issues

1. **Import Path Issues**
   - Use correct relative path to Button component
   - Consider creating an alias for easier imports

2. **Style Differences**
   - The unified Button has consistent styling
   - Some custom styles may need adjustment

3. **TypeScript Errors**
   - Ensure props match ButtonProps interface
   - Remove Antd-specific props

### Getting Help

- Check existing Button usage in successfully migrated components
- Refer to Button.stories.tsx for examples
- Test thoroughly in development before committing