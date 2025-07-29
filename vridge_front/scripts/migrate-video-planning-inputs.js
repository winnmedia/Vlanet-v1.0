const fs = require('fs');
const path = require('path');

const filePath = '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/VideoPlanning.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Input import 추가
if (!content.includes("import { Input }") && !content.includes("from '../../components/unified/Input'")) {
  // Button import 뒤에 Input import 추가
  content = content.replace(
    "import { Button } from '../../components/unified/Button'",
    "import { Button } from '../../components/unified/Button'\nimport { Input } from '../../components/unified/Input'"
  );
}

// 톤앤매너 input 변환
content = content.replace(
  /<input\s+type="text"\s+placeholder="원하시는 톤앤매너를 자유롭게 입력해주세요"\s+value=\{planningOptions\.toneCustom\}\s+onChange=\{\(e\)\s*=>\s*setPlanningOptions\(prev\s*=>\s*\(\{\s*\.\.\.prev,\s*toneCustom:\s*e\.target\.value,\s*tone:\s*'custom'\s*\}\)\)\}\s+className="ty01"\s*\/>/g,
  `<Input
                        type="text"
                        placeholder="원하시는 톤앤매너를 자유롭게 입력해주세요"
                        value={planningOptions.toneCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, toneCustom: e.target.value, tone: 'custom' }))}
                        className="ty01"
                      />`
);

// 장르 input 변환
content = content.replace(
  /<input\s+type="text"\s+placeholder="원하시는 장르를 자유롭게 입력해주세요"\s+value=\{planningOptions\.genreCustom\}\s+onChange=\{\(e\)\s*=>\s*setPlanningOptions\(prev\s*=>\s*\(\{\s*\.\.\.prev,\s*genreCustom:\s*e\.target\.value,\s*genre:\s*'custom'\s*\}\)\)\}\s+className="ty01"\s*\/>/g,
  `<Input
                        type="text"
                        placeholder="원하시는 장르를 자유롭게 입력해주세요"
                        value={planningOptions.genreCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, genreCustom: e.target.value, genre: 'custom' }))}
                        className="ty01"
                      />`
);

// 컨셉 input 변환
content = content.replace(
  /<input\s+type="text"\s+placeholder="원하시는 컨셉을 자유롭게 입력해주세요"\s+value=\{planningOptions\.conceptCustom\}\s+onChange=\{\(e\)\s*=>\s*setPlanningOptions\(prev\s*=>\s*\(\{\s*\.\.\.prev,\s*conceptCustom:\s*e\.target\.value,\s*concept:\s*'custom'\s*\}\)\)\}\s+className="ty01"\s*\/>/g,
  `<Input
                        type="text"
                        placeholder="원하시는 컨셉을 자유롭게 입력해주세요"
                        value={planningOptions.conceptCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, conceptCustom: e.target.value, concept: 'custom' }))}
                        className="ty01"
                      />`
);

// 타겟 input 변환
content = content.replace(
  /<input\s+type="text"\s+placeholder="타겟층을 자유롭게 입력해주세요"\s+value=\{planningOptions\.targetCustom\}\s+onChange=\{\(e\)\s*=>\s*setPlanningOptions\(prev\s*=>\s*\(\{\s*\.\.\.prev,\s*targetCustom:\s*e\.target\.value,\s*target:\s*'custom'\s*\}\)\)\}\s+className="ty01"\s*\/>/g,
  `<Input
                        type="text"
                        placeholder="타겟층을 자유롭게 입력해주세요"
                        value={planningOptions.targetCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, targetCustom: e.target.value, target: 'custom' }))}
                        className="ty01"
                      />`
);

// 목적 input 변환
content = content.replace(
  /<input\s+type="text"\s+placeholder="영상의 목적을 자유롭게 입력해주세요"\s+value=\{planningOptions\.purposeCustom\}\s+onChange=\{\(e\)\s*=>\s*setPlanningOptions\(prev\s*=>\s*\(\{\s*\.\.\.prev,\s*purposeCustom:\s*e\.target\.value,\s*purpose:\s*'custom'\s*\}\)\)\}\s+className="ty01"\s*\/>/g,
  `<Input
                        type="text"
                        placeholder="영상의 목적을 자유롭게 입력해주세요"
                        value={planningOptions.purposeCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, purposeCustom: e.target.value, purpose: 'custom' }))}
                        className="ty01"
                      />`
);

// 길이 input 변환
content = content.replace(
  /<input\s+type="text"\s+placeholder="원하시는 영상 길이를 입력해주세요 \(예: 2분 30초\)"\s+value=\{planningOptions\.durationCustom\}\s+onChange=\{\(e\)\s*=>\s*setPlanningOptions\(prev\s*=>\s*\(\{\s*\.\.\.prev,\s*durationCustom:\s*e\.target\.value,\s*duration:\s*'custom'\s*\}\)\)\}\s+className="ty01"\s*\/>/g,
  `<Input
                        type="text"
                        placeholder="원하시는 영상 길이를 입력해주세요 (예: 2분 30초)"
                        value={planningOptions.durationCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, durationCustom: e.target.value, duration: 'custom' }))}
                        className="ty01"
                      />`
);

// 기획 제목 input 변환
content = content.replace(
  /<input\s+type="text"\s+placeholder="기획 제목을 입력하세요"\s+className="planning-title-input"\s+value=\{planningTitle\}\s+onChange=\{\(e\)\s*=>\s*setPlanningTitle\(e\.target\.value\)\}\s*\/>/g,
  `<Input
                    type="text"
                    placeholder="기획 제목을 입력하세요"
                    className="planning-title-input"
                    value={planningTitle}
                    onChange={(e) => setPlanningTitle(e.target.value)}
                  />`
);

// 캐릭터 이름 input 변환
content = content.replace(
  /<input\s+type="text"\s+placeholder="캐릭터 이름 입력"\s+value=\{planningOptions\.characterName\s*\|\|\s*''\}\s+onChange=\{\(e\)\s*=>\s*setPlanningOptions\(prev\s*=>\s*\(\{\s*\.\.\.prev,\s*characterName:\s*e\.target\.value\s*\}\)\)\}\s+className="character-name-input"\s*\/>/g,
  `<Input
                      type="text"
                      placeholder="캐릭터 이름 입력"
                      value={planningOptions.characterName || ''}
                      onChange={(e) => setPlanningOptions(prev => ({ ...prev, characterName: e.target.value }))}
                      className="character-name-input"
                    />`
);

// 씬 제목 input 변환 - 더 정확한 패턴으로 수정
content = content.replace(
  /<input\s+type="text"\s+placeholder="씬 제목 입력"\s+value=\{scene\.scene_title\s*\|\|\s*''\}\s+onChange=\{\(e\)\s*=>\s*handleUpdateScene\(scene\.scene_id,\s*'scene_title',\s*e\.target\.value\)\}\s+className="scene-title-input"\s*\/>/g,
  `<Input
                    type="text"
                    placeholder="씬 제목 입력"
                    value={scene.scene_title || ''}
                    onChange={(e) => handleUpdateScene(scene.scene_id, 'scene_title', e.target.value)}
                    className="scene-title-input"
                  />`
);

// 프롬프트 input 변환
content = content.replace(
  /<input\s+type="text"\s+placeholder="프롬프트를 입력하세요"\s+value=\{storyboard\.prompt\s*\|\|\s*''\}\s+onChange=\{\(e\)\s*=>\s*handleStoryboardUpdate\(scene\.scene_id,\s*storyboardIndex,\s*'prompt',\s*e\.target\.value\)\}\s+onKeyPress=\{\(e\)\s*=>\s*\{\s*if\s*\(e\.key\s*===\s*'Enter'\)\s*\{\s*handleGenerateImage\(scene\.scene_id,\s*storyboardIndex,\s*storyboard\.prompt\s*\|\|\s*scene\.action\);\s*\}\s*\}\}\s*\/>/g,
  `<Input
                                    type="text"
                                    placeholder="프롬프트를 입력하세요"
                                    value={storyboard.prompt || ''}
                                    onChange={(e) => handleStoryboardUpdate(scene.scene_id, storyboardIndex, 'prompt', e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        handleGenerateImage(scene.scene_id, storyboardIndex, storyboard.prompt || scene.action);
                                      }
                                    }}
                                  />`
);

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ VideoPlanning.jsx Input 마이그레이션 완료');
console.log('- 톤앤매너 input 변환');
console.log('- 장르 input 변환');
console.log('- 컨셉 input 변환');
console.log('- 타겟 input 변환');
console.log('- 목적 input 변환');
console.log('- 길이 input 변환');
console.log('- 기획 제목 input 변환');
console.log('- 캐릭터 이름 input 변환');
console.log('- 씬 제목 input 변환');
console.log('- 프롬프트 input 변환');