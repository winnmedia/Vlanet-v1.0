import os
import io
import logging
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import requests
from PIL import Image as PILImage
from io import BytesIO
import tempfile

logger = logging.getLogger(__name__)


class PDFExportService:
    """비디오 기획안을 PDF로 내보내는 서비스"""
    
    def __init__(self):
        self.setup_fonts()
        self.styles = self.setup_styles()
    
    def setup_fonts(self):
        """한글 폰트 설정"""
        try:
            # 시스템 폰트 경로 확인
            font_paths = [
                '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',
                '/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf',
                '/System/Library/Fonts/Supplemental/AppleGothic.ttf',
                'C:\\Windows\\Fonts\\malgun.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
            ]
            
            font_registered = False
            for font_path in font_paths:
                if os.path.exists(font_path):
                    try:
                        pdfmetrics.registerFont(TTFont('NanumGothic', font_path))
                        font_registered = True
                        logger.info(f"폰트 등록 성공: {font_path}")
                        break
                    except:
                        continue
            
            if not font_registered:
                logger.warning("한글 폰트를 찾을 수 없습니다. 기본 폰트를 사용합니다.")
                
        except Exception as e:
            logger.error(f"폰트 설정 오류: {str(e)}")
    
    def setup_styles(self):
        """PDF 스타일 설정"""
        styles = getSampleStyleSheet()
        
        # 한글 폰트가 등록되었는지 확인
        try:
            pdfmetrics.getFont('NanumGothic')
            font_name = 'NanumGothic'
        except:
            font_name = 'Helvetica'
        
        # 커스텀 스타일 추가
        styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=styles['Title'],
            fontName=font_name,
            fontSize=24,
            textColor=HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=styles['Heading1'],
            fontName=font_name,
            fontSize=18,
            textColor=HexColor('#2c3e50'),
            spaceAfter=20,
            spaceBefore=20
        ))
        
        styles.add(ParagraphStyle(
            name='CustomSubHeading',
            parent=styles['Heading2'],
            fontName=font_name,
            fontSize=14,
            textColor=HexColor('#34495e'),
            spaceAfter=12,
            spaceBefore=12
        ))
        
        styles.add(ParagraphStyle(
            name='CustomBody',
            parent=styles['BodyText'],
            fontName=font_name,
            fontSize=11,
            textColor=HexColor('#4a4a4a'),
            spaceAfter=6,
            leading=16
        ))
        
        styles.add(ParagraphStyle(
            name='SceneTitle',
            parent=styles['Heading3'],
            fontName=font_name,
            fontSize=12,
            textColor=HexColor('#2980b9'),
            spaceAfter=8
        ))
        
        return styles
    
    def generate_pdf(self, planning_data, output_buffer=None):
        """비디오 기획안을 PDF로 생성"""
        if output_buffer is None:
            output_buffer = io.BytesIO()
        
        # PDF 문서 생성
        doc = SimpleDocTemplate(
            output_buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # 컨텐츠 구성
        story = []
        
        # 1. 타이틀 페이지
        story.extend(self._create_title_page(planning_data))
        story.append(PageBreak())
        
        # 2. 기획 개요
        story.extend(self._create_overview_section(planning_data))
        story.append(PageBreak())
        
        # 3. 스토리 구성 (기승전결)
        story.extend(self._create_story_section(planning_data))
        story.append(PageBreak())
        
        # 4. 씬별 상세 내용
        story.extend(self._create_scenes_section(planning_data))
        
        # PDF 생성
        doc.build(story)
        output_buffer.seek(0)
        
        return output_buffer
    
    def _create_title_page(self, planning_data):
        """타이틀 페이지 생성"""
        elements = []
        
        # 제목
        title = planning_data.get('title', '영상 기획안')
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 1*cm))
        
        # 기본 정보 테이블
        info_data = [
            ['장르', planning_data.get('genre', 'N/A')],
            ['타겟', planning_data.get('target', 'N/A')],
            ['러닝타임', planning_data.get('duration', 'N/A')],
            ['제작 목적', planning_data.get('purpose', 'N/A')]
        ]
        
        info_table = Table(info_data, colWidths=[4*cm, 10*cm])
        info_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'NanumGothic' if 'NanumGothic' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#2c3e50')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LINEBELOW', (0, 0), (-1, -1), 1, HexColor('#ecf0f1')),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [HexColor('#ffffff'), HexColor('#f8f9fa')]),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(info_table)
        
        return elements
    
    def _create_overview_section(self, planning_data):
        """기획 개요 섹션 생성"""
        elements = []
        
        elements.append(Paragraph('기획 개요', self.styles['CustomHeading']))
        
        # 기획 의도
        planning_text = planning_data.get('planning_text', '')
        if planning_text:
            elements.append(Paragraph('기획 의도', self.styles['CustomSubHeading']))
            elements.append(Paragraph(planning_text, self.styles['CustomBody']))
            elements.append(Spacer(1, 0.5*cm))
        
        # 콘셉트
        concept = planning_data.get('concept', '')
        if concept:
            elements.append(Paragraph('콘셉트', self.styles['CustomSubHeading']))
            elements.append(Paragraph(concept, self.styles['CustomBody']))
            elements.append(Spacer(1, 0.5*cm))
        
        # 톤앤매너
        tone = planning_data.get('tone', '')
        if tone:
            elements.append(Paragraph('톤앤매너', self.styles['CustomSubHeading']))
            elements.append(Paragraph(tone, self.styles['CustomBody']))
        
        return elements
    
    def _create_story_section(self, planning_data):
        """스토리 구성 섹션 생성"""
        elements = []
        
        elements.append(Paragraph('스토리 구성', self.styles['CustomHeading']))
        
        stories = planning_data.get('stories', [])
        story_phases = ['기', '승', '전', '결']
        
        for idx, story in enumerate(stories):
            phase = story_phases[idx] if idx < 4 else f'파트 {idx+1}'
            
            # 스토리 단계 제목
            phase_title = f"{phase} - {story.get('phase', '')}"
            elements.append(Paragraph(phase_title, self.styles['CustomSubHeading']))
            
            # 스토리 내용
            content = story.get('content', '')
            if content:
                elements.append(Paragraph(content, self.styles['CustomBody']))
            
            # 핵심 포인트
            key_point = story.get('key_point', '')
            if key_point:
                elements.append(Paragraph(f"핵심 포인트: {key_point}", self.styles['CustomBody']))
            
            elements.append(Spacer(1, 0.5*cm))
        
        return elements
    
    def _create_scenes_section(self, planning_data):
        """씬별 상세 섹션 생성"""
        elements = []
        
        elements.append(Paragraph('씬 구성', self.styles['CustomHeading']))
        
        scenes = planning_data.get('scenes', [])
        
        for idx, scene in enumerate(scenes):
            # 씬 제목
            scene_title = f"씬 {idx + 1}: {scene.get('title', '')}"
            elements.append(Paragraph(scene_title, self.styles['SceneTitle']))
            
            # 스토리보드 이미지가 있는 경우
            storyboard = scene.get('storyboard', {})
            image_url = storyboard.get('image_url')
            
            if image_url and image_url != 'generated_image_placeholder':
                try:
                    # 이미지 다운로드 및 추가
                    img_element = self._create_image_element(image_url)
                    if img_element:
                        elements.append(img_element)
                        elements.append(Spacer(1, 0.3*cm))
                except Exception as e:
                    logger.error(f"이미지 처리 오류: {str(e)}")
            
            # 씬 설명
            description = storyboard.get('description_kr') or scene.get('description', '')
            if description:
                elements.append(Paragraph(description, self.styles['CustomBody']))
            
            # 시각적 설명
            visual_desc = storyboard.get('visual_description', '')
            if visual_desc and visual_desc != description:
                elements.append(Paragraph(f"시각적 설명: {visual_desc}", self.styles['CustomBody']))
            
            elements.append(Spacer(1, 0.8*cm))
            
            # 페이지가 너무 길어지면 페이지 구분
            if (idx + 1) % 3 == 0 and idx < len(scenes) - 1:
                elements.append(PageBreak())
        
        return elements
    
    def _create_image_element(self, image_url, max_width=12*cm, max_height=8*cm):
        """이미지 URL로부터 ReportLab Image 요소 생성"""
        try:
            # 이미지 다운로드
            response = requests.get(image_url, timeout=10)
            if response.status_code != 200:
                return None
            
            # PIL로 이미지 열기
            img = PILImage.open(BytesIO(response.content))
            
            # 이미지 크기 조정
            img_width, img_height = img.size
            aspect_ratio = img_width / img_height
            
            if img_width > max_width or img_height > max_height:
                if aspect_ratio > max_width / max_height:
                    new_width = max_width
                    new_height = max_width / aspect_ratio
                else:
                    new_height = max_height
                    new_width = max_height * aspect_ratio
            else:
                new_width = img_width
                new_height = img_height
            
            # 임시 파일로 저장
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
                img.save(tmp_file.name, 'PNG')
                tmp_path = tmp_file.name
            
            # ReportLab Image 객체 생성
            rl_image = Image(tmp_path, width=new_width, height=new_height)
            
            # 임시 파일 삭제
            os.unlink(tmp_path)
            
            return rl_image
            
        except Exception as e:
            logger.error(f"이미지 요소 생성 실패: {str(e)}")
            return None
    
    def generate_storyboard_only_pdf(self, planning_data, output_buffer=None):
        """스토리보드 이미지만 포함하는 간단한 PDF 생성"""
        if output_buffer is None:
            output_buffer = io.BytesIO()
        
        # 가로 방향 PDF 생성
        doc = SimpleDocTemplate(
            output_buffer,
            pagesize=landscape(A4),
            rightMargin=1*cm,
            leftMargin=1*cm,
            topMargin=1*cm,
            bottomMargin=1*cm
        )
        
        story = []
        
        # 타이틀
        title = planning_data.get('title', '스토리보드')
        story.append(Paragraph(title, self.styles['CustomTitle']))
        story.append(Spacer(1, 1*cm))
        
        # 씬별 스토리보드
        scenes = planning_data.get('scenes', [])
        scenes_per_page = 2  # 한 페이지에 2개 씬
        
        for idx, scene in enumerate(scenes):
            if idx > 0 and idx % scenes_per_page == 0:
                story.append(PageBreak())
            
            # 씬 제목
            scene_title = f"씬 {idx + 1}"
            story.append(Paragraph(scene_title, self.styles['SceneTitle']))
            
            # 스토리보드 이미지
            storyboard = scene.get('storyboard', {})
            image_url = storyboard.get('image_url')
            
            if image_url and image_url != 'generated_image_placeholder':
                img_element = self._create_image_element(image_url, max_width=18*cm, max_height=10*cm)
                if img_element:
                    story.append(img_element)
            
            # 설명
            description = storyboard.get('description_kr', scene.get('description', ''))
            if description:
                story.append(Paragraph(description, self.styles['CustomBody']))
            
            story.append(Spacer(1, 1*cm))
        
        doc.build(story)
        output_buffer.seek(0)
        
        return output_buffer