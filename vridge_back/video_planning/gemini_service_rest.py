import os
import json
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class GeminiServiceREST:
    """Gemini REST API를 사용하는 서비스 - 403 오류 해결"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'GOOGLE_API_KEY', None) or os.environ.get('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in settings or environment variables")
        
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.headers = {
            "Content-Type": "application/json",
            "Referer": "http://localhost:3000",
            "Origin": "http://localhost:3000"
        }
        
        # 토큰 사용량 추적
        self.token_usage = {
            'total': 0,
            'prompt': 0,
            'response': 0,
            'by_feature': {
                'story': {'prompt': 0, 'response': 0, 'total': 0},
                'scene': {'prompt': 0, 'response': 0, 'total': 0},
                'shot': {'prompt': 0, 'response': 0, 'total': 0}
            }
        }
    
    def _make_request(self, model_name, prompt, temperature=0.9, max_tokens=None):
        """REST API 호출"""
        url = f"{self.base_url}/{model_name}:generateContent?key={self.api_key}"
        
        data = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": temperature,
                "topP": 0.95,
                "topK": 40
            }
        }
        
        if max_tokens:
            data["generationConfig"]["maxOutputTokens"] = max_tokens
        
        try:
            response = requests.post(url, headers=self.headers, json=data)
            
            if response.status_code == 200:
                result = response.json()
                
                # 토큰 사용량 추출
                if 'usageMetadata' in result:
                    usage = result['usageMetadata']
                    prompt_tokens = usage.get('promptTokenCount', 0)
                    response_tokens = usage.get('candidatesTokenCount', 0)
                    total_tokens = usage.get('totalTokenCount', 0)
                    
                    self.token_usage['prompt'] += prompt_tokens
                    self.token_usage['response'] += response_tokens
                    self.token_usage['total'] += total_tokens
                    
                    logger.info(f"Token usage - Prompt: {prompt_tokens}, Response: {response_tokens}, Total: {total_tokens}")
                
                # 응답 텍스트 추출
                if result.get('candidates') and len(result['candidates']) > 0:
                    return result['candidates'][0]['content']['parts'][0]['text']
                else:
                    logger.error("No candidates in response")
                    return None
                    
            else:
                logger.error(f"API request failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"API request error: {str(e)}")
            return None
    
    def _update_token_usage(self, feature, prompt_tokens, response_tokens):
        """토큰 사용량 업데이트"""
        total = prompt_tokens + response_tokens
        self.token_usage['by_feature'][feature]['prompt'] += prompt_tokens
        self.token_usage['by_feature'][feature]['response'] += response_tokens
        self.token_usage['by_feature'][feature]['total'] += total
    
    def get_token_usage(self):
        """토큰 사용량 반환"""
        return self.token_usage
    
    def generate_content(self, prompt, temperature=0.9, model="gemini-1.5-flash"):
        """범용 콘텐츠 생성"""
        return self._make_request(model, prompt, temperature)
    
    def generate_stories_from_planning(self, planning_text, context=None):
        """기획안으로부터 스토리 생성"""
        if context is None:
            context = {}
        
        # 컨텍스트에서 옵션 추출
        tone = context.get('tone', '')
        genre = context.get('genre', '')
        concept = context.get('concept', '')
        target = context.get('target', '')
        purpose = context.get('purpose', '')
        duration = context.get('duration', '')
        story_framework = context.get('story_framework', 'classic')
        
        # 프레임워크별 구조
        framework_structures = {
            'classic': "기승전결 구조",
            'hook_immersion': "훅-몰입-반전-떡밥 구조",
            'pixar': "픽사 스토리텔링",
            'deductive': "연역식 전개",
            'inductive': "귀납식 전개",
            'documentary': "다큐멘터리 형식"
        }
        
        prompt = f"""
        당신은 전문 영상 스토리 작가입니다. 다음 기획안을 기반으로 {framework_structures.get(story_framework, '기승전결')} 형식의 스토리를 작성해주세요.
        
        타겟: {target if target else '일반 시청자'}
        장르: {genre if genre else '일반'}
        톤앤매너: {tone if tone else '중립적'}
        콘셉트: {concept if concept else '기본'}
        목적: {purpose if purpose else '정보 전달'}
        길이: {duration if duration else '3-5분'}
        
        기획안:
        {planning_text}
        
        다음 JSON 형식으로 정확히 4개의 스토리를 생성하세요:
        {{
            "stories": [
                {{
                    "title": "제목",
                    "stage": "단계명",
                    "stage_name": "단계 설명",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "핵심 내용",
                    "summary": "스토리 요약"
                }}
            ]
        }}
        
        응답은 반드시 유효한 JSON 형식이어야 하며, 추가 설명 없이 JSON만 반환하세요.
        """
        
        try:
            response_text = self._make_request("gemini-1.5-flash", prompt)
            
            if response_text:
                # JSON 블록 제거
                if response_text.startswith('```json'):
                    response_text = response_text[7:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                
                result = json.loads(response_text.strip())
                
                if 'stories' in result:
                    # 토큰 사용량 업데이트 (추정치)
                    self._update_token_usage('story', len(prompt)//4, len(response_text)//4)
                    return result
                    
            return None
            
        except Exception as e:
            logger.error(f"Story generation error: {str(e)}")
            return None