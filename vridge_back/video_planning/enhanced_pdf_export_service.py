import os
import io
import logging
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.colors import HexColor, white, black, lightgrey
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import requests
from PIL import Image as PILImage
from io import BytesIO
import tempfile
from datetime import datetime

logger = logging.getLogger(__name__)


class EnhancedPDFExportService:
    """개선된 비디오 기획안 PDF 내보내기 서비스"""
    
    def __init__(self):
        self.page_width, self.page_height = landscape(A4)  # 가로 A4
        self.margin = 2*cm
        self.content_width = self.page_width - (2 * self.margin)
        self.setup_fonts()
        self.styles = self.setup_styles()
    
    def setup_fonts(self):
        """한글 폰트 설정"""
        try:
            # CID 폰트 등록 (한글 지원)
            pdfmetrics.registerFont(UnicodeCIDFont('HYGothic-Medium'))
            pdfmetrics.registerFont(UnicodeCIDFont('HYSMyeongJo-Medium'))
            logger.info("한글 폰트 등록 완료")
        except Exception as e:
            logger.warning(f"폰트 설정 경고: {str(e)}")
    
    def setup_styles(self):
        """PDF 스타일 설정"""
        styles = getSampleStyleSheet()
        
        # 한글 폰트 설정
        korean_font = 'HYGothic-Medium'
        
        # 제목 스타일
        styles.add(ParagraphStyle(
            name='MainTitle',
            parent=styles['Title'],
            fontName=korean_font,
            fontSize=28,
            textColor=HexColor('#1631F8'),
            spaceAfter=20,
            spaceBefore=10,
            alignment=TA_CENTER,
            leading=34
        ))
        
        # 섹션 제목 스타일
        styles.add(ParagraphStyle(
            name='SectionTitle',
            parent=styles['Heading1'],
            fontName=korean_font,
            fontSize=18,
            textColor=HexColor('#2c3e50'),
            spaceAfter=12,
            spaceBefore=20,
            leading=22
        ))
        
        # 하위 제목 스타일
        styles.add(ParagraphStyle(
            name='SubTitle',
            parent=styles['Heading2'],
            fontName=korean_font,
            fontSize=14,
            textColor=HexColor('#34495e'),
            spaceAfter=8,
            spaceBefore=10,
            leading=18
        ))
        
        # 본문 스타일
        styles.add(ParagraphStyle(
            name='BodyText',
            parent=styles['Normal'],
            fontName=korean_font,
            fontSize=10,
            textColor=HexColor('#2c3e50'),
            spaceAfter=6,
            leading=14,
            alignment=TA_LEFT
        ))
        
        # 테이블 헤더 스타일
        styles.add(ParagraphStyle(
            name='TableHeader',
            parent=styles['Normal'],
            fontName=korean_font,
            fontSize=11,
            textColor=white,
            alignment=TA_CENTER,
            leading=14
        ))
        
        # 테이블 셀 스타일
        styles.add(ParagraphStyle(
            name='TableCell',
            parent=styles['Normal'],
            fontName=korean_font,
            fontSize=10,
            textColor=HexColor('#2c3e50'),
            alignment=TA_LEFT,
            leading=13
        ))
        
        return styles
    
    def generate_pdf(self, planning_data, output_buffer=None):
        """향상된 PDF 생성"""
        if output_buffer is None:
            output_buffer = io.BytesIO()
        
        # 가로 A4 문서 설정
        doc = SimpleDocTemplate(
            output_buffer,
            pagesize=landscape(A4),
            rightMargin=self.margin,
            leftMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
            title=planning_data.get('title', '영상 기획안')
        )
        
        # 컨텐츠 구성
        story = []
        
        # 1. 커버 페이지
        story.extend(self._create_cover_page(planning_data))
        story.append(PageBreak())
        
        # 2. 프로젝트 개요 테이블
        story.extend(self._create_project_overview(planning_data))
        story.append(Spacer(1, 15*mm))
        
        # 3. 스토리 구성 테이블
        story.extend(self._create_story_table(planning_data))
        story.append(PageBreak())
        
        # 4. 씬별 콘티 테이블
        story.extend(self._create_scenes_table(planning_data))
        
        # PDF 생성
        try:
            doc.build(story)
            output_buffer.seek(0)
            logger.info("PDF 생성 완료")
            return output_buffer
        except Exception as e:
            logger.error(f"PDF 생성 오류: {str(e)}")
            raise
    
    def _create_cover_page(self, planning_data):
        """커버 페이지 생성"""
        elements = []
        
        # 메인 제목
        title = planning_data.get('title', '영상 기획안')
        elements.append(Paragraph(title, self.styles['MainTitle']))
        elements.append(Spacer(1, 30*mm))
        
        # 프로젝트 기본 정보 박스
        info_data = [
            ['프로젝트명', title],
            ['장르', planning_data.get('genre', '-')],
            ['타겟 오디언스', planning_data.get('target', '-')],
            ['러닝타임', planning_data.get('duration', '-')],
            ['제작 목적', planning_data.get('purpose', '-')],
            ['톤앤매너', planning_data.get('tone', '-')],
            ['작성일', datetime.now().strftime('%Y년 %m월 %d일')]
        ]
        
        # 정보 테이블 생성
        info_table = Table(info_data, colWidths=[6*cm, 12*cm])
        info_table.setStyle(TableStyle([
            # 헤더 스타일
            ('FONTNAME', (0, 0), (0, -1), 'HYGothic-Medium'),
            ('FONTNAME', (1, 0), (1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            
            # 색상
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#1631F8')),
            ('TEXTCOLOR', (0, 0), (0, -1), white),
            ('BACKGROUND', (1, 0), (1, -1), HexColor('#f8f9fa')),
            ('TEXTCOLOR', (1, 0), (1, -1), HexColor('#2c3e50')),
            
            # 정렬
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            
            # 테두리
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),
            ('LINEWIDTH', (0, 0), (-1, -1), 0.5),
            
            # 패딩
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 20*mm))
        
        # 기획 의도
        planning_text = planning_data.get('planning_text', '')
        if planning_text:
            elements.append(Paragraph('기획 의도', self.styles['SectionTitle']))
            elements.append(Paragraph(planning_text, self.styles['BodyText']))
        
        return elements
    
    def _create_project_overview(self, planning_data):
        """프로젝트 개요 섹션"""
        elements = []
        
        elements.append(Paragraph('프로젝트 개요', self.styles['SectionTitle']))
        
        # 콘셉트와 스토리 프레임워크 정보
        overview_data = []
        
        if planning_data.get('concept'):
            overview_data.append(['콘셉트', planning_data['concept']])
        
        if planning_data.get('story_framework'):
            framework_map = {
                'hook_immersion': '훅-몰입-반전-떡밥',
                'classic': '클래식 기승전결',
                'pixar': '픽사 스토리텔링',
                'deductive': '연역식 스토리텔링',
                'inductive': '귀납식 스토리텔링',
                'documentary': '다큐멘터리 형식'
            }
            framework_name = framework_map.get(planning_data['story_framework'], planning_data['story_framework'])
            overview_data.append(['스토리 프레임워크', framework_name])
        
        if planning_data.get('development_level'):
            level_map = {
                'minimal': '간결한 구성',
                'light': '가벼운 전개',
                'balanced': '균형잡힌 전개',
                'detailed': '상세한 구성'
            }
            level_name = level_map.get(planning_data['development_level'], planning_data['development_level'])
            overview_data.append(['전개 수준', level_name])
        
        if overview_data:
            overview_table = Table(overview_data, colWidths=[6*cm, 18*cm])
            overview_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'HYGothic-Medium'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BACKGROUND', (0, 0), (0, -1), HexColor('#e9ecef')),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(overview_table)
        
        return elements
    
    def _create_story_table(self, planning_data):
        """스토리 구성 테이블 생성"""
        elements = []
        
        elements.append(Paragraph('스토리 구성 (기승전결)', self.styles['SectionTitle']))
        
        stories = planning_data.get('stories', [])
        if not stories:
            elements.append(Paragraph('스토리 구성 정보가 없습니다.', self.styles['BodyText']))
            return elements
        
        # 테이블 헤더
        story_data = [
            [
                Paragraph('단계', self.styles['TableHeader']),
                Paragraph('제목', self.styles['TableHeader']),
                Paragraph('핵심 내용', self.styles['TableHeader']),
                Paragraph('요약', self.styles['TableHeader'])
            ]
        ]
        
        # 스토리 데이터 추가
        for story in stories[:4]:  # 기승전결 4단계만
            stage = story.get('stage', '')
            stage_name = story.get('stage_name', '')
            stage_display = f"{stage}\n({stage_name})" if stage_name else stage
            
            title = story.get('title', '')
            key_content = story.get('key_content', '')
            summary = story.get('summary', '')
            
            story_data.append([
                Paragraph(stage_display, self.styles['TableCell']),
                Paragraph(title, self.styles['TableCell']),
                Paragraph(key_content, self.styles['TableCell']),
                Paragraph(summary, self.styles['TableCell'])
            ])
        
        # 테이블 생성
        story_table = Table(story_data, colWidths=[3*cm, 5*cm, 8*cm, 8*cm])
        story_table.setStyle(TableStyle([
            # 헤더 스타일
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1631F8')),
            ('FONTNAME', (0, 0), (-1, 0), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            
            # 데이터 행 스타일
            ('FONTNAME', (0, 1), (-1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BACKGROUND', (0, 1), (-1, -1), white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8f9fa')]),
            
            # 정렬
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            
            # 테두리
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),
            ('LINEWIDTH', (0, 0), (-1, -1), 0.5),
            
            # 패딩
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(story_table)
        
        return elements
    
    def _create_scenes_table(self, planning_data):
        """씬별 콘티 테이블 생성"""
        elements = []
        
        elements.append(Paragraph('씬별 콘티 구성', self.styles['SectionTitle']))
        
        scenes = planning_data.get('scenes', [])
        if not scenes:
            elements.append(Paragraph('씬 구성 정보가 없습니다.', self.styles['BodyText']))
            return elements
        
        # 씬을 페이지별로 나누어 처리 (페이지당 6개씩)
        scenes_per_page = 6
        for page_start in range(0, len(scenes), scenes_per_page):
            page_scenes = scenes[page_start:page_start + scenes_per_page]
            
            # 테이블 헤더
            scene_data = [
                [
                    Paragraph('씬', self.styles['TableHeader']),
                    Paragraph('콘티', self.styles['TableHeader']),
                    Paragraph('장소/시간', self.styles['TableHeader']),
                    Paragraph('액션/대사', self.styles['TableHeader']),
                    Paragraph('목적', self.styles['TableHeader'])
                ]
            ]
            
            # 씬 데이터 추가
            for idx, scene in enumerate(page_scenes):
                scene_number = page_start + idx + 1
                
                # 콘티 이미지 처리
                storyboard_cell = self._create_storyboard_cell(scene)
                
                # 장소/시간 정보
                location = scene.get('location', '')
                time = scene.get('time', '')
                location_time = f"{location}\n({time})" if time else location
                
                # 액션과 대사
                action = scene.get('action', '')
                dialogue = scene.get('dialogue', '')
                action_dialogue = f"액션: {action}\n대사: {dialogue}" if dialogue else f"액션: {action}"
                
                # 목적
                purpose = scene.get('purpose', '')
                
                scene_data.append([
                    Paragraph(f"씬 {scene_number}", self.styles['TableCell']),
                    storyboard_cell,
                    Paragraph(location_time, self.styles['TableCell']),
                    Paragraph(action_dialogue, self.styles['TableCell']),
                    Paragraph(purpose, self.styles['TableCell'])
                ])
            
            # 테이블 생성
            scene_table = Table(scene_data, colWidths=[2*cm, 6*cm, 4*cm, 6*cm, 6*cm])
            scene_table.setStyle(TableStyle([
                # 헤더 스타일
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1631F8')),
                ('FONTNAME', (0, 0), (-1, 0), 'HYGothic-Medium'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('TEXTCOLOR', (0, 0), (-1, 0), white),
                
                # 데이터 행 스타일
                ('FONTNAME', (0, 1), (-1, -1), 'HYGothic-Medium'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BACKGROUND', (0, 1), (-1, -1), white),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8f9fa')]),
                
                # 정렬
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                
                # 테두리
                ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),
                ('LINEWIDTH', (0, 0), (-1, -1), 0.5),
                
                # 패딩
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                
                # 행 높이 설정
                ('ROWSIZE', (0, 1), (-1, -1), 4*cm),
            ]))
            
            elements.append(scene_table)
            
            # 다음 페이지가 있으면 페이지 브레이크
            if page_start + scenes_per_page < len(scenes):
                elements.append(PageBreak())
        
        return elements
    
    def _create_storyboard_cell(self, scene):
        """스토리보드 이미지 셀 생성"""
        storyboard = scene.get('storyboard', {})
        image_url = storyboard.get('image_url')
        description = storyboard.get('description_kr', '')
        
        # 이미지가 있는 경우
        if image_url and image_url != 'generated_image_placeholder':
            try:
                img_element = self._create_small_image(image_url, max_width=5*cm, max_height=3*cm)
                if img_element:
                    return img_element
            except Exception as e:
                logger.warning(f"이미지 로드 실패: {str(e)}")
        
        # 이미지가 없거나 실패한 경우 설명 텍스트 사용
        if description:
            return Paragraph(description, self.styles['TableCell'])
        else:
            return Paragraph('콘티 이미지 없음', self.styles['TableCell'])
    
    def _create_small_image(self, image_url, max_width=5*cm, max_height=3*cm):
        """작은 이미지 요소 생성"""
        try:
            # 이미지 다운로드
            response = requests.get(image_url, timeout=10)
            if response.status_code != 200:
                return None
            
            # PIL로 이미지 처리
            img = PILImage.open(BytesIO(response.content))
            
            # 이미지 크기 조정
            img_width, img_height = img.size
            aspect_ratio = img_width / img_height
            
            # 최대 크기에 맞춰 비율 조정
            if aspect_ratio > max_width / max_height:
                new_width = max_width
                new_height = max_width / aspect_ratio
            else:
                new_height = max_height
                new_width = max_height * aspect_ratio
            
            # 임시 파일로 저장
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                # RGB로 변환 (PDF 호환성)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # 크기 조정하여 저장
                img_resized = img.resize((int(new_width * 72 / cm), int(new_height * 72 / cm)), PILImage.Resampling.LANCZOS)
                img_resized.save(temp_file.name, 'JPEG', quality=85)
                
                # ReportLab Image 생성
                return Image(temp_file.name, width=new_width, height=new_height)
                
        except Exception as e:
            logger.error(f"이미지 처리 오류: {str(e)}")
            return None