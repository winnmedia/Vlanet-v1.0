const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 파일에서 MinimalCard 사용 분석
function analyzeMinimalCardUsage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const usage = [];
  
  lines.forEach((line, index) => {
    // MinimalCard import 찾기
    if (line.includes('import') && line.includes('MinimalCard')) {
      usage.push({
        type: 'import',
        line: index + 1,
        content: line
      });
    }
    
    // MinimalCard 사용 찾기
    if (line.includes('<MinimalCard') || line.includes('</MinimalCard>')) {
      usage.push({
        type: 'usage',
        line: index + 1,
        content: line,
        props: extractProps(line)
      });
    }
    
    // CardHeader, CardContent, CardFooter 사용 찾기
    if (line.includes('<CardHeader') || line.includes('<CardContent') || line.includes('<CardFooter')) {
      usage.push({
        type: 'subcomponent',
        line: index + 1,
        content: line
      });
    }
  });
  
  return usage;
}

// props 추출
function extractProps(line) {
  const props = [];
  
  // className prop
  const classMatch = line.match(/className=\{([^}]+)\}|className="([^"]+)"/);
  if (classMatch) {
    props.push(`className: ${classMatch[1] || classMatch[2]}`);
  }
  
  // hover prop
  if (line.includes('hover')) {
    props.push('hover');
  }
  
  // onClick prop
  if (line.includes('onClick')) {
    props.push('onClick');
  }
  
  // padding prop
  const paddingMatch = line.match(/padding="([^"]+)"/);
  if (paddingMatch) {
    props.push(`padding: ${paddingMatch[1]}`);
  }
  
  return props;
}

// 마이그레이션 제안 생성
function generateMigrationSuggestions(usage) {
  const suggestions = [];
  
  usage.forEach(item => {
    if (item.type === 'import') {
      suggestions.push({
        line: item.line,
        action: 'Replace import',
        from: item.content,
        to: "import { Card } from '../../components/unified/Card'"
      });
    } else if (item.type === 'usage') {
      let variant = 'default';
      let hoverable = false;
      let clickable = false;
      
      // props 분석
      if (item.props.includes('hover')) {
        hoverable = true;
      }
      if (item.props.includes('onClick')) {
        clickable = true;
      }
      
      // className 기반 variant 추론
      if (item.content.includes('invitationAlert')) {
        variant = 'highlight';
      } else if (item.content.includes('activityCard') || item.content.includes('statsCard')) {
        variant = 'default';
      }
      
      const newTag = item.content
        .replace('<MinimalCard', '<Card')
        .replace('</MinimalCard>', '</Card>');
      
      // variant, hoverable, clickable props 추가
      if (variant !== 'default' || hoverable || clickable) {
        const propsToAdd = [];
        if (variant !== 'default') propsToAdd.push(`variant="${variant}"`);
        if (hoverable) propsToAdd.push('hoverable');
        if (clickable) propsToAdd.push('clickable');
        
        // 태그에 props 추가
        const insertPos = newTag.indexOf('>');
        if (insertPos > 0) {
          const modifiedTag = newTag.slice(0, insertPos) + ' ' + propsToAdd.join(' ') + newTag.slice(insertPos);
          suggestions.push({
            line: item.line,
            action: 'Replace MinimalCard',
            from: item.content,
            to: modifiedTag
          });
        }
      } else {
        suggestions.push({
          line: item.line,
          action: 'Replace MinimalCard',
          from: item.content,
          to: newTag
        });
      }
    } else if (item.type === 'subcomponent') {
      // CardHeader, CardContent, CardFooter는 그대로 사용 가능
      suggestions.push({
        line: item.line,
        action: 'Keep subcomponent',
        note: 'CardHeader, CardContent, CardFooter는 통합 Card 컴포넌트와 함께 사용 가능'
      });
    }
  });
  
  return suggestions;
}

// 메인 실행
function main() {
  const targetFiles = [
    '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/CmsHomeMinimal.jsx',
    '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/VideoPlanningMinimal.jsx'
  ];
  
  console.log('MinimalCard to Unified Card Migration Guide');
  console.log('==========================================\n');
  
  targetFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`\n📄 File: ${path.basename(filePath)}`);
      console.log('─'.repeat(50));
      
      const usage = analyzeMinimalCardUsage(filePath);
      const suggestions = generateMigrationSuggestions(usage);
      
      console.log(`Found ${usage.length} MinimalCard-related items\n`);
      
      suggestions.forEach(suggestion => {
        console.log(`Line ${suggestion.line}: ${suggestion.action}`);
        if (suggestion.from && suggestion.to) {
          console.log(`  From: ${suggestion.from.trim()}`);
          console.log(`  To:   ${suggestion.to.trim()}`);
        }
        if (suggestion.note) {
          console.log(`  Note: ${suggestion.note}`);
        }
        console.log();
      });
    }
  });
  
  console.log('\n📋 Migration Steps:');
  console.log('1. Replace MinimalCard imports with Card imports');
  console.log('2. Change <MinimalCard> to <Card>');
  console.log('3. Add appropriate variant prop based on usage');
  console.log('4. Add hoverable/clickable props where needed');
  console.log('5. Keep CardHeader, CardContent, CardFooter as is');
  console.log('6. Test each card for visual consistency');
}

main();