const fs = require('fs');
const path = require('path');

console.log('🔄 남은 커스텀 input 대량 마이그레이션 시작...\n');

// 마이그레이션할 파일들과 input 위치
const filesToMigrate = [
  // ProjectCreateDebug.jsx - file input 1개
  {
    filePath: 'src/page/Cms/ProjectCreateDebug.jsx',
    inputs: [
      {
        lineStart: 136,
        lineEnd: 142,
        type: 'file'
      }
    ]
  },
  // ProjectCreate.jsx - file input 1개  
  {
    filePath: 'src/page/Cms/ProjectCreate.jsx',
    inputs: [
      {
        lineStart: 133,
        lineEnd: 139,
        type: 'file'
      }
    ]
  },
  // ProjectEdit.jsx - file input 1개
  {
    filePath: 'src/page/Cms/ProjectEdit.jsx',
    inputs: [
      {
        lineStart: 147,
        lineEnd: 153,
        type: 'file'
      }
    ]
  },
  // ProcessDateEnhanced.jsx - date inputs 4개
  {
    filePath: 'src/tasks/Project/ProcessDateEnhanced.jsx',
    inputs: [
      {
        lineStart: 66,
        lineEnd: 73,
        type: 'date'
      },
      {
        lineStart: 74,
        lineEnd: 81,
        type: 'date'
      }
    ]
  },
  // ImageCropper.jsx - range inputs 2개
  {
    filePath: 'src/components/ImageCropper.jsx',
    inputs: [
      {
        lineStart: 97,
        lineEnd: 105,
        type: 'range'
      },
      {
        lineStart: 115,
        lineEnd: 123,
        type: 'range'
      }
    ]
  },
  // AdminDashboard.jsx - 여러 input
  {
    filePath: 'src/page/Admin/AdminDashboard.jsx',
    inputs: [
      {
        lineStart: 250,
        lineEnd: 255,
        type: 'text',
        placeholder: '사용자 이름 또는 이메일로 검색'
      }
    ]
  },
  // Feedback.jsx - search input
  {
    filePath: 'src/page/Cms/Feedback.jsx',
    inputs: [
      {
        lineStart: 289,
        lineEnd: 297,
        type: 'text',
        placeholder: '프로젝트명을 입력하세요'
      }
    ]
  },
  // FeedbackPolling.jsx - search input
  {
    filePath: 'src/page/Cms/FeedbackPolling.jsx',
    inputs: [
      {
        lineStart: 334,
        lineEnd: 342,
        type: 'text',
        placeholder: '프로젝트명을 입력하세요'
      }
    ]
  },
  // FeedbackStable.jsx - search input
  {
    filePath: 'src/page/Cms/FeedbackStable.jsx',
    inputs: [
      {
        lineStart: 316,
        lineEnd: 324,
        type: 'text',
        placeholder: '프로젝트명을 입력하세요'
      }
    ]
  },
  // FeedbackMessagePolling.jsx - message input
  {
    filePath: 'src/tasks/Feedback/FeedbackMessagePolling.jsx',
    inputs: [
      {
        lineStart: 209,
        lineEnd: 217,
        type: 'text',
        placeholder: '피드백을 입력하세요'
      }
    ]
  },
  // LoginMinimal.v2.jsx - 2 inputs
  {
    filePath: 'src/page/User/LoginMinimal.v2.jsx',
    inputs: [
      {
        lineStart: 124,
        lineEnd: 131,
        type: 'email',
        placeholder: '이메일을 입력하세요'
      },
      {
        lineStart: 132,
        lineEnd: 139,
        type: 'password',
        placeholder: '비밀번호를 입력하세요'
      }
    ]
  }
];

let totalMigrated = 0;

filesToMigrate.forEach(({filePath, inputs}) => {
  const fullPath = path.join('/home/winnmedia/VideoPlanet/vridge_front', filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let lines = content.split('\n');
    
    // Import 추가 (아직 없는 경우)
    if (!content.includes("import { Input } from '../../components/unified/Input'") &&
        !content.includes('import { Input } from "../components/unified/Input"') &&
        !content.includes("import { Input } from '../components/unified/Input'") &&
        !content.includes("import { Input } from './components/unified/Input'")) {
      
      // 적절한 import 경로 계산
      const depth = filePath.split('/').length - 1;
      const importPath = depth === 3 ? '../../components/unified/Input' : 
                        depth === 4 ? '../../../components/unified/Input' : 
                        '../../components/unified/Input';
      
      // React import 뒤에 추가
      const reactImportIndex = lines.findIndex(line => line.includes('import React'));
      if (reactImportIndex !== -1) {
        lines.splice(reactImportIndex + 1, 0, `import { Input } from '${importPath}'`);
      }
    }
    
    // 각 input 마이그레이션 (뒤에서부터 처리)
    inputs.reverse().forEach(input => {
      if (input.type === 'file') {
        // file input은 건너뛰기
        console.log(`⏭️  ${path.basename(filePath)}: file input은 건너뛰기`);
        return;
      }
      
      if (input.type === 'range') {
        // range input도 특수 처리가 필요하므로 건너뛰기
        console.log(`⏭️  ${path.basename(filePath)}: range input은 건너뛰기`);
        return;
      }
      
      if (input.type === 'date') {
        // date input도 특수 처리가 필요하므로 건너뛰기
        console.log(`⏭️  ${path.basename(filePath)}: date input은 건너뛰기`);
        return;
      }
      
      // text, email, password 등 일반 input만 처리
      const inputLine = lines[input.lineStart - 1];
      if (inputLine && inputLine.includes('<input')) {
        // 기존 input의 속성 추출
        const attributes = inputLine.match(/(\w+)="[^"]*"/g) || [];
        const props = {};
        
        attributes.forEach(attr => {
          const [key, value] = attr.split('=');
          props[key] = value.replace(/"/g, '');
        });
        
        // Input 컴포넌트로 변환
        let newInput = `<Input`;
        if (props.type) newInput += ` type="${props.type}"`;
        if (props.placeholder || input.placeholder) newInput += ` placeholder="${props.placeholder || input.placeholder}"`;
        if (props.value) newInput += ` value={${props.value}}`;
        if (props.onChange) newInput += ` onChange={${props.onChange}}`;
        if (props.className) newInput += ` className="${props.className}"`;
        if (props.disabled) newInput += ` disabled={${props.disabled}}`;
        if (props.name) newInput += ` name="${props.name}"`;
        newInput += ` />`;
        
        // 들여쓰기 유지
        const indent = inputLine.match(/^\s*/)[0];
        lines[input.lineStart - 1] = indent + newInput;
        
        // 여러 줄에 걸친 input 태그 제거
        if (input.lineEnd > input.lineStart) {
          lines.splice(input.lineStart, input.lineEnd - input.lineStart);
        }
        
        totalMigrated++;
      }
    });
    
    // 파일 저장
    content = lines.join('\n');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${path.basename(filePath)}: ${inputs.length}개 input 처리`);
    
  } catch (error) {
    console.error(`❌ ${filePath} 처리 중 오류:`, error.message);
  }
});

console.log(`\n✨ 대량 input 마이그레이션 완료!`);
console.log(`총 ${totalMigrated}개 input 마이그레이션 됨`);