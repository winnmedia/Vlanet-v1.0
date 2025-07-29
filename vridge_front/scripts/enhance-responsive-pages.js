const fs = require('fs');
const path = require('path');

let enhancedCount = 0;

const pageResponsiveEnhancements = {
  'CmsHomeMinimal.module.scss': `
/* Enhanced Responsive Design */
@media (max-width: 480px) {
  .dashboard {
    padding: $spacing-xs;
  }
  
  .statsGrid {
    grid-template-columns: 1fr;
    gap: $spacing-xs;
  }
  
  .card {
    padding: $spacing-sm;
  }
  
  .title {
    font-size: $font-size-xl;
  }
}

@media (max-width: 768px) {
  .videoGrid {
    grid-template-columns: 1fr;
  }
  
  .sidePanel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    
    &.open {
      transform: translateY(0);
    }
  }
}`,

  'VideoPlanning.scss': `
/* Enhanced Responsive Design */
@media (max-width: 768px) {
  .planning-container {
    padding: $spacing-sm;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }
  
  .scene-card {
    padding: $spacing-sm;
  }
  
  .button-group {
    flex-direction: column;
    width: 100%;
    
    button {
      width: 100%;
    }
  }
  
  .character-section {
    flex-direction: column;
    
    input {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .planning-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-sm;
  }
  
  .export-button {
    width: 100%;
  }
}`,

  'FeedbackButtonStyles.module.scss': `
/* Enhanced Responsive Design */
@media (max-width: 768px) {
  .feedbackButtons {
    flex-wrap: wrap;
    gap: $spacing-xs;
    
    button {
      flex: 1 1 45%;
      min-width: 120px;
      font-size: $font-size-sm;
      padding: $spacing-xs $spacing-sm;
    }
  }
  
  .videoContainer {
    height: auto;
    aspect-ratio: 16/9;
  }
}

@media (max-width: 480px) {
  .feedbackButtons button {
    flex: 1 1 100%;
  }
  
  .feedbackList {
    padding: $spacing-xs;
  }
  
  .feedbackItem {
    padding: $spacing-sm;
    font-size: $font-size-sm;
  }
}`,

  'MyPage.scss': `
/* Enhanced Responsive Design */
@media (max-width: 768px) {
  .mypage-container {
    padding: $spacing-md;
  }
  
  .profile-section {
    flex-direction: column;
    text-align: center;
    
    .avatar {
      margin: 0 auto $spacing-md;
    }
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: $spacing-sm;
    
    button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .stats-card {
    padding: $spacing-sm;
    
    .stat-value {
      font-size: $font-size-xl;
    }
  }
  
  .section-title {
    font-size: $font-size-lg;
  }
}`
};

// Process files
Object.entries(pageResponsiveEnhancements).forEach(([filename, styles]) => {
  // Find the file
  const possiblePaths = [
    path.join('src/page/Cms', filename),
    path.join('src/page/User', filename),
    path.join('src/css/Cms', filename),
    path.join('src/css/User', filename)
  ];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Add enhanced responsive styles
        const newContent = content + '\n' + styles;
        fs.writeFileSync(filePath, newContent);
        
        console.log(`✓ Enhanced responsive design for: ${filePath}`);
        enhancedCount++;
        break;
      } catch (error) {
        console.error(`✗ Error enhancing ${filePath}:`, error.message);
      }
    }
  }
});

console.log(`\n✅ Enhanced ${enhancedCount} files with responsive design`);