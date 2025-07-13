"""
고급 PDF 내보내기 서비스
Google Gemini API를 활용하여 모든 내용을 코드 형태로 구조화하고 디자인된 PDF로 내보내기
"""

import os
import io
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
import google.generativeai as genai
from django.conf import settings
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
    Image, PageBreak, KeepTogether, Frame, PageTemplate,
    BaseDocTemplate, NextPageTemplate, FrameBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.platypus.flowables import Flowable
import requests
from PIL import Image as PILImage
from io import BytesIO
import tempfile
from datetime import datetime

logger = logging.getLogger(__name__)


class DesignedHeaderFooter(Flowable):
    """커스텀 헤더/푸터 디자인"""
    
    def __init__(self, title="", page_num=1, total_pages=1, is_header=True):
        Flowable.__init__(self)
        self.title = title
        self.page_num = page_num
        self.total_pages = total_pages
        self.is_header = is_header
        self.width = landscape(A4)[0] - 2*cm
        self.height = 1.5*cm
        
    def draw(self):
        canvas = self.canv
        
        if self.is_header:
            # 헤더 디자인
            canvas.setStrokeColor(HexColor('#1631F8'))
            canvas.setLineWidth(2)
            canvas.line(0, 0, self.width, 0)
            
            # 로고 영역
            canvas.setFillColor(HexColor('#1631F8'))
            canvas.setFont('HYGothic-Medium', 10)
            canvas.drawString(0, 5, "VideoPlanet")
            
            # 제목
            canvas.setFillColor(HexColor('#333333'))
            canvas.setFont('HYGothic-Medium', 12)
            canvas.drawCentredString(self.width/2, 5, self.title)
            
            # 날짜
            canvas.setFillColor(HexColor('#666666'))
            canvas.setFont('HYGothic-Medium', 9)
            canvas.drawRightString(self.width, 5, datetime.now().strftime("%Y.%m.%d"))
        else:
            # 푸터 디자인
            canvas.setStrokeColor(HexColor('#E0E0E0'))
            canvas.setLineWidth(1)
            canvas.line(0, self.height-2, self.width, self.height-2)
            
            # 페이지 번호
            canvas.setFillColor(HexColor('#666666'))
            canvas.setFont('HYGothic-Medium', 9)
            page_text = f"{self.page_num} / {self.total_pages}"
            canvas.drawCentredString(self.width/2, 5, page_text)
            
            # 카피라이트
            canvas.setFillColor(HexColor('#999999'))
            canvas.setFont('HYGothic-Medium', 8)
            canvas.drawString(0, 5, "© 2024 VideoPlanet. All rights reserved.")


class AdvancedPDFExportService:
    """Gemini API를 활용한 고급 PDF 내보내기 서비스"""
    
    # 브랜드 색상 팔레트
    COLORS = {
        'primary': '#1631F8',
        'primary_dark': '#0F23C9',
        'secondary': '#E8EBFF',
        'danger': '#dc3545',
        'success': '#28a745',
        'warning': '#ffc107',
        'info': '#17a2b8',
        'dark': '#333333',
        'gray': '#666666',
        'light_gray': '#E0E0E0',
        'background': '#F8F9FA'
    }
    
    def __init__(self):
        # Gemini API 초기화
        api_key = getattr(settings, 'GOOGLE_API_KEY', None) or os.environ.get('GOOGLE_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            logger.warning("GOOGLE_API_KEY가 설정되지 않았습니다. AI 기능이 제한됩니다.")
            self.gemini_model = None
            
        self.setup_fonts()
        self.styles = self.setup_advanced_styles()
    
    def setup_fonts(self):
        """한글 폰트 설정"""
        try:
            # CID 폰트 등록 (한글 지원)
            pdfmetrics.registerFont(UnicodeCIDFont('HYSMyeongJo-Medium'))
            pdfmetrics.registerFont(UnicodeCIDFont('HYGothic-Medium'))
            logger.info("고급 PDF: CID 폰트 등록 완료")
        except Exception as e:
            logger.error(f"고급 PDF: 폰트 설정 오류: {str(e)}")
    
    def setup_advanced_styles(self):
        """고급 PDF 스타일 설정"""
        styles = getSampleStyleSheet()
        font_name = 'HYGothic-Medium'
        
        # 표지 스타일
        styles.add(ParagraphStyle(
            name='CoverTitle',
            fontName=font_name,
            fontSize=36,
            textColor=HexColor(self.COLORS['primary']),
            spaceAfter=20,
            alignment=TA_CENTER,
            leading=44
        ))
        
        styles.add(ParagraphStyle(
            name='CoverSubtitle',
            fontName=font_name,
            fontSize=20,
            textColor=HexColor(self.COLORS['dark']),
            spaceAfter=40,
            alignment=TA_CENTER,
            leading=28
        ))
        
        # 섹션 스타일
        styles.add(ParagraphStyle(
            name='SectionTitle',
            fontName=font_name,
            fontSize=24,
            textColor=HexColor(self.COLORS['primary']),
            spaceAfter=20,
            spaceBefore=30,
            alignment=TA_LEFT,
            borderWidth=0,
            borderPadding=0,
            borderColor=HexColor(self.COLORS['primary']),
            borderRadius=0
        ))
        
        # 콘텐츠 스타일
        styles.add(ParagraphStyle(
            name='ContentHeading',
            fontName=font_name,
            fontSize=16,
            textColor=HexColor(self.COLORS['dark']),
            spaceAfter=12,
            spaceBefore=16,
            leading=20
        ))
        
        styles.add(ParagraphStyle(
            name='ContentBody',
            fontName=font_name,
            fontSize=11,
            textColor=HexColor(self.COLORS['gray']),
            spaceAfter=8,
            leading=16,
            alignment=TA_JUSTIFY
        ))
        
        # 강조 스타일
        styles.add(ParagraphStyle(
            name='Highlight',
            fontName=font_name,
            fontSize=12,
            textColor=HexColor(self.COLORS['primary']),
            backColor=HexColor(self.COLORS['secondary']),
            spaceAfter=10,
            spaceBefore=10,
            leading=18,
            borderWidth=1,
            borderColor=HexColor(self.COLORS['primary']),
            borderPadding=8,
            borderRadius=4
        ))
        
        # 씬 스타일
        styles.add(ParagraphStyle(
            name='SceneHeader',
            fontName=font_name,
            fontSize=14,
            textColor=HexColor('#FFFFFF'),
            backColor=HexColor(self.COLORS['primary']),
            spaceAfter=8,
            leading=20,
            alignment=TA_CENTER,
            borderPadding=6
        ))
        
        # 코드 블록 스타일
        styles.add(ParagraphStyle(
            name='CodeBlock',
            fontName='Courier',
            fontSize=10,
            textColor=HexColor('#2E3440'),
            backColor=HexColor('#F8F9FA'),
            spaceAfter=12,
            spaceBefore=12,
            leading=14,
            leftIndent=10,
            rightIndent=10,
            borderWidth=1,
            borderColor=HexColor('#E0E0E0'),
            borderPadding=10
        ))
        
        return styles
    
    def create_ai_structured_content(self, planning_data: Dict[str, Any]) -> Dict[str, Any]:
        """Gemini API를 사용하여 콘텐츠를 구조화하고 디자인 요소 추가"""
        if not self.gemini_model:
            return planning_data
            
        try:
            prompt = self._create_design_structuring_prompt(planning_data)
            response = self.gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # JSON 파싱
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
                
            structured = json.loads(response_text)
            return structured
            
        except Exception as e:
            logger.error(f"AI 구조화 실패: {e}")
            return planning_data
    
    def _create_design_structuring_prompt(self, data: Dict[str, Any]) -> str:
        """디자인 구조화를 위한 프롬프트 생성"""
        return f"""
당신은 전문 영상 기획서 디자이너입니다. 다음 영상 기획 데이터를 아름답고 전문적인 PDF 문서로 변환하기 위한 구조를 만들어주세요.

입력 데이터:
{json.dumps(data, ensure_ascii=False, indent=2)}

다음 JSON 구조로 응답해주세요:

{{
    "document": {{
        "title": "문서 제목",
        "subtitle": "부제목",
        "version": "v1.0",
        "date": "2024-01-01",
        "author": "작성자",
        "summary": "한 줄 요약"
    }},
    "sections": [
        {{
            "type": "overview",
            "title": "프로젝트 개요",
            "content": {{
                "intro": "프로젝트 소개 문단",
                "key_points": [
                    {{"icon": "🎯", "title": "목표", "description": "주요 목표 설명"}},
                    {{"icon": "👥", "title": "타겟", "description": "타겟 오디언스"}},
                    {{"icon": "📊", "title": "기대효과", "description": "예상 성과"}}
                ],
                "visual_style": {{
                    "layout": "grid",
                    "color_scheme": "primary"
                }}
            }}
        }},
        {{
            "type": "story_structure",
            "title": "스토리 구성",
            "content": {{
                "narrative_arc": [
                    {{"stage": "기", "percentage": 25, "description": "도입부 설명", "color": "#FF6B6B"}},
                    {{"stage": "승", "percentage": 25, "description": "전개부 설명", "color": "#4ECDC4"}},
                    {{"stage": "전", "percentage": 25, "description": "절정부 설명", "color": "#45B7D1"}},
                    {{"stage": "결", "percentage": 25, "description": "결말부 설명", "color": "#96CEB4"}}
                ],
                "visual_representation": "pie_chart"
            }}
        }},
        {{
            "type": "scenes",
            "title": "씬 구성",
            "content": {{
                "total_scenes": 10,
                "scenes": [
                    {{
                        "number": 1,
                        "title": "씬 제목",
                        "location": "장소",
                        "time": "시간대",
                        "description": "씬 설명",
                        "duration": "30초",
                        "key_elements": ["요소1", "요소2"],
                        "mood": "분위기",
                        "color_palette": ["#color1", "#color2"]
                    }}
                ],
                "timeline_view": true
            }}
        }},
        {{
            "type": "production_plan",
            "title": "제작 계획",
            "content": {{
                "schedule": {{
                    "pre_production": {{"duration": "2주", "tasks": ["기획", "시나리오", "콘티"]}},
                    "production": {{"duration": "1주", "tasks": ["촬영", "현장 연출"]}},
                    "post_production": {{"duration": "2주", "tasks": ["편집", "색보정", "사운드"]}}
                }},
                "budget_breakdown": {{
                    "visualization": "bar_chart",
                    "categories": [
                        {{"name": "인건비", "amount": 5000000, "percentage": 40}},
                        {{"name": "장비", "amount": 3000000, "percentage": 24}},
                        {{"name": "후반작업", "amount": 2500000, "percentage": 20}},
                        {{"name": "기타", "amount": 2000000, "percentage": 16}}
                    ]
                }}
            }}
        }},
        {{
            "type": "visual_reference",
            "title": "비주얼 레퍼런스",
            "content": {{
                "mood_board": {{
                    "primary_color": "#1631F8",
                    "secondary_colors": ["#E8EBFF", "#333333"],
                    "style_keywords": ["모던", "미니멀", "감성적"],
                    "reference_images": []
                }},
                "storyboards": []
            }}
        }}
    ],
    "design_guidelines": {{
        "use_brand_colors": true,
        "include_charts": true,
        "page_numbers": true,
        "header_footer": true,
        "table_of_contents": true
    }}
}}

중요 사항:
1. 모든 텍스트는 한글로 작성
2. 시각적 요소(차트, 그래프, 아이콘)를 최대한 활용
3. 정보의 계층구조를 명확히
4. 전문적이면서도 창의적인 레이아웃
5. 브랜드 컬러(#1631F8) 일관성 있게 사용
"""
    
    def create_cover_page(self, doc_info: Dict[str, Any]) -> List[Any]:
        """표지 페이지 생성"""
        elements = []
        
        # 상단 여백
        elements.append(Spacer(1, 10*cm))
        
        # 메인 타이틀
        title = Paragraph(doc_info.get('title', '영상 기획안'), self.styles['CoverTitle'])
        elements.append(title)
        
        # 부제목
        if doc_info.get('subtitle'):
            subtitle = Paragraph(doc_info['subtitle'], self.styles['CoverSubtitle'])
            elements.append(subtitle)
        
        # 중간 여백
        elements.append(Spacer(1, 5*cm))
        
        # 메타 정보 테이블
        meta_data = [
            ['작성일', doc_info.get('date', datetime.now().strftime('%Y-%m-%d'))],
            ['버전', doc_info.get('version', 'v1.0')],
            ['작성자', doc_info.get('author', 'VideoPlanet')]
        ]
        
        meta_table = Table(meta_data, colWidths=[5*cm, 10*cm])
        meta_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('TEXTCOLOR', (0, 0), (0, -1), HexColor(self.COLORS['primary'])),
            ('TEXTCOLOR', (1, 0), (1, -1), HexColor(self.COLORS['gray'])),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        elements.append(meta_table)
        elements.append(PageBreak())
        
        return elements
    
    def create_table_of_contents(self, sections: List[Dict[str, Any]]) -> List[Any]:
        """목차 페이지 생성"""
        elements = []
        
        # 목차 타이틀
        elements.append(Paragraph('목차', self.styles['SectionTitle']))
        elements.append(Spacer(1, 20))
        
        # 목차 항목
        toc_data = []
        for i, section in enumerate(sections, 1):
            toc_data.append([
                f"{i}.",
                section['title'],
                f"{i + 1}"  # 페이지 번호 (실제로는 동적으로 계산 필요)
            ])
        
        toc_table = Table(toc_data, colWidths=[1.5*cm, 20*cm, 2*cm])
        toc_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('TEXTCOLOR', (0, 0), (0, -1), HexColor(self.COLORS['primary'])),
            ('TEXTCOLOR', (1, 0), (1, -1), HexColor(self.COLORS['dark'])),
            ('TEXTCOLOR', (2, 0), (2, -1), HexColor(self.COLORS['gray'])),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, HexColor(self.COLORS['light_gray'])),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
        ]))
        
        elements.append(toc_table)
        elements.append(PageBreak())
        
        return elements
    
    def create_overview_section(self, content: Dict[str, Any]) -> List[Any]:
        """개요 섹션 생성"""
        elements = []
        
        # 섹션 타이틀
        elements.append(Paragraph('프로젝트 개요', self.styles['SectionTitle']))
        
        # 소개 문단
        if content.get('intro'):
            elements.append(Paragraph(content['intro'], self.styles['ContentBody']))
            elements.append(Spacer(1, 20))
        
        # 핵심 포인트 그리드
        if content.get('key_points'):
            key_points_data = []
            for point in content['key_points']:
                icon = point.get('icon', '•')
                title = point.get('title', '')
                desc = point.get('description', '')
                
                # 아이콘과 제목을 결합
                title_with_icon = f"<font size='16'>{icon}</font> <b>{title}</b>"
                point_content = f"{title_with_icon}<br/>{desc}"
                
                key_points_data.append([Paragraph(point_content, self.styles['ContentBody'])])
            
            # 3열 그리드로 배치
            if len(key_points_data) >= 3:
                grid_data = []
                for i in range(0, len(key_points_data), 3):
                    row = key_points_data[i:i+3]
                    while len(row) < 3:
                        row.append([''])  # 빈 셀 추가
                    grid_data.append([cell[0] for cell in row])
                
                grid_table = Table(grid_data, colWidths=[8.5*cm, 8.5*cm, 8.5*cm])
                grid_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), HexColor(self.COLORS['secondary'])),
                    ('TEXTCOLOR', (0, 0), (-1, -1), HexColor(self.COLORS['dark'])),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('FONTNAME', (0, 0), (-1, -1), 'HYGothic-Medium'),
                    ('FONTSIZE', (0, 0), (-1, -1), 11),
                    ('LEFTPADDING', (0, 0), (-1, -1), 15),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                    ('TOPPADDING', (0, 0), (-1, -1), 15),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
                    ('GRID', (0, 0), (-1, -1), 1, HexColor(self.COLORS['primary'])),
                    ('BOX', (0, 0), (-1, -1), 2, HexColor(self.COLORS['primary'])),
                ]))
                
                elements.append(grid_table)
        
        return elements
    
    def create_story_structure_section(self, content: Dict[str, Any]) -> List[Any]:
        """스토리 구조 섹션 생성"""
        elements = []
        
        # 섹션 타이틀
        elements.append(Paragraph('스토리 구성', self.styles['SectionTitle']))
        
        # 서사 구조 차트
        if content.get('narrative_arc'):
            # 파이 차트 생성 (간단한 구현)
            arc_data = []
            colors = []
            labels = []
            
            for arc in content['narrative_arc']:
                arc_data.append(arc['percentage'])
                colors.append(HexColor(arc.get('color', self.COLORS['primary'])))
                labels.append(f"{arc['stage']} ({arc['percentage']}%)")
            
            # 차트 설명
            for arc in content['narrative_arc']:
                desc = f"<b>{arc['stage']}</b> - {arc['description']}"
                elements.append(Paragraph(desc, self.styles['ContentBody']))
            
            elements.append(Spacer(1, 20))
        
        return elements
    
    def create_scenes_section(self, scenes: List[Dict[str, Any]]) -> List[Any]:
        """씬 구성 섹션 생성"""
        elements = []
        
        # 섹션 타이틀
        elements.append(Paragraph('씬 구성', self.styles['SectionTitle']))
        
        for scene in scenes:
            # 씬 헤더
            scene_title = f"씬 {scene.get('number', '')} - {scene.get('title', '')}"
            elements.append(Paragraph(scene_title, self.styles['SceneHeader']))
            
            # 씬 정보 테이블
            scene_info = [
                ['장소', scene.get('location', '')],
                ['시간', scene.get('time', '')],
                ['분위기', scene.get('mood', '')],
                ['길이', scene.get('duration', '')]
            ]
            
            info_table = Table(scene_info, colWidths=[3*cm, 22*cm])
            info_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), 'HYGothic-Medium'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TEXTCOLOR', (0, 0), (0, -1), HexColor(self.COLORS['primary'])),
                ('TEXTCOLOR', (1, 0), (1, -1), HexColor(self.COLORS['gray'])),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            
            elements.append(info_table)
            
            # 씬 설명
            if scene.get('description'):
                elements.append(Paragraph(scene['description'], self.styles['ContentBody']))
            
            # 스토리보드 이미지 (있는 경우)
            if scene.get('storyboard') and scene['storyboard'].get('image_url'):
                try:
                    img = self._get_image_from_url(scene['storyboard']['image_url'])
                    if img:
                        elements.append(img)
                except Exception as e:
                    logger.error(f"스토리보드 이미지 로드 실패: {e}")
            
            elements.append(Spacer(1, 20))
        
        return elements
    
    def _get_image_from_url(self, url: str, max_width: float = 20*cm, max_height: float = 15*cm) -> Optional[Image]:
        """URL에서 이미지를 가져와 ReportLab Image 객체로 변환"""
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                img_buffer = BytesIO(response.content)
                pil_img = PILImage.open(img_buffer)
                
                # 이미지 크기 조정
                width, height = pil_img.size
                aspect = height / float(width)
                
                if width > max_width:
                    width = max_width
                    height = width * aspect
                    
                if height > max_height:
                    height = max_height
                    width = height / aspect
                
                # 임시 파일로 저장
                with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp_file:
                    pil_img.save(tmp_file.name, 'PNG')
                    return Image(tmp_file.name, width=width, height=height)
                    
        except Exception as e:
            logger.error(f"이미지 로드 실패: {e}")
            return None
    
    def generate_advanced_pdf(self, planning_data: Dict[str, Any], output_buffer: io.BytesIO) -> bool:
        """고급 PDF 생성 메인 함수"""
        try:
            # AI를 통한 콘텐츠 구조화
            structured_content = self.create_ai_structured_content(planning_data)
            
            # PDF 문서 생성
            doc = SimpleDocTemplate(
                output_buffer,
                pagesize=landscape(A4),
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=3*cm,
                bottomMargin=2.5*cm,
                title=structured_content.get('document', {}).get('title', '영상 기획안'),
                author='VideoPlanet'
            )
            
            # 페이지 템플릿 설정
            elements = []
            
            # 1. 표지
            if structured_content.get('document'):
                elements.extend(self.create_cover_page(structured_content['document']))
            
            # 2. 목차
            if structured_content.get('sections'):
                elements.extend(self.create_table_of_contents(structured_content['sections']))
            
            # 3. 각 섹션 생성
            for section in structured_content.get('sections', []):
                section_type = section.get('type')
                
                if section_type == 'overview':
                    elements.extend(self.create_overview_section(section.get('content', {})))
                elif section_type == 'story_structure':
                    elements.extend(self.create_story_structure_section(section.get('content', {})))
                elif section_type == 'scenes':
                    scenes = section.get('content', {}).get('scenes', [])
                    elements.extend(self.create_scenes_section(scenes))
                
                elements.append(PageBreak())
            
            # PDF 생성
            doc.build(elements)
            return True
            
        except Exception as e:
            logger.error(f"고급 PDF 생성 실패: {e}")
            return False
    
    def export_to_pdf(self, planning_data: Dict[str, Any]) -> Optional[bytes]:
        """외부 호출용 PDF 내보내기 함수"""
        output_buffer = io.BytesIO()
        
        if self.generate_advanced_pdf(planning_data, output_buffer):
            output_buffer.seek(0)
            return output_buffer.getvalue()
        
        return None