import os
import io
import logging
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak, KeepTogether, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.graphics.shapes import Drawing, Rect, Circle, Line
from reportlab.graphics import renderPDF
import requests
from PIL import Image as PILImage
from io import BytesIO
import tempfile
from datetime import datetime

logger = logging.getLogger(__name__)


class PDFExportService:
    """비디오 기획안을 PDF로 내보내는 서비스"""
    
    def __init__(self):
        self.setup_fonts()
        self.styles = self.setup_styles()
        self.brand_color = HexColor('#1631F8')
        self.brand_color_dark = HexColor('#0F23C9')
        self.gray_light = HexColor('#f8f9fa')
        self.gray_medium = HexColor('#e9ecef')
        self.gray_dark = HexColor('#495057')
        self.text_primary = HexColor('#212529')
        self.text_secondary = HexColor('#6c757d')
    
    def setup_fonts(self):
        """한글 폰트 설정"""
        try:
            # CID 폰트 등록 (한글 지원)
            pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))
            pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))
            pdfmetrics.registerFont(UnicodeCIDFont('HYSMyeongJo-Medium'))
            pdfmetrics.registerFont(UnicodeCIDFont('HYGothic-Medium'))
            logger.info("CID 폰트 등록 완료")
                
        except Exception as e:
            logger.error(f"폰트 설정 오류: {str(e)}")
    
    def setup_styles(self):
        """PDF 스타일 설정"""
        styles = getSampleStyleSheet()
        
        # CID 폰트 사용 (한글 지원)
        font_name = 'HYGothic-Medium'
        
        # 커스텀 스타일 추가
        styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=styles['Title'],
            fontName=font_name,
            fontSize=28,
            textColor=self.brand_color if hasattr(self, 'brand_color') else HexColor('#1631F8'),
            spaceAfter=20,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='Subtitle',
            parent=styles['Normal'],
            fontName=font_name,
            fontSize=14,
            textColor=HexColor('#6c757d'),
            spaceAfter=30,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='SectionTitle',
            parent=styles['Heading1'],
            fontName=font_name,
            fontSize=18,
            textColor=HexColor('#212529'),
            spaceAfter=15,
            spaceBefore=20,
            leftIndent=0,
            borderColor=HexColor('#1631F8'),
            borderWidth=3,
            borderPadding=5
        ))
        
        styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=styles['Heading1'],
            fontName=font_name,
            fontSize=16,
            textColor=HexColor('#212529'),
            spaceAfter=12,
            spaceBefore=15
        ))
        
        styles.add(ParagraphStyle(
            name='CustomSubHeading',
            parent=styles['Heading2'],
            fontName=font_name,
            fontSize=14,
            textColor=HexColor('#495057'),
            spaceAfter=10,
            spaceBefore=10
        ))
        
        styles.add(ParagraphStyle(
            name='CustomBody',
            parent=styles['BodyText'],
            fontName=font_name,
            fontSize=11,
            textColor=HexColor('#495057'),
            spaceAfter=8,
            leading=16,
            alignment=TA_JUSTIFY
        ))
        
        styles.add(ParagraphStyle(
            name='CompactBody',
            parent=styles['BodyText'],
            fontName=font_name,
            fontSize=10,
            textColor=HexColor('#6c757d'),
            spaceAfter=4,
            leading=14
        ))
        
        styles.add(ParagraphStyle(
            name='SceneTitle',
            parent=styles['Heading3'],
            fontName=font_name,
            fontSize=12,
            textColor=HexColor('#1631F8'),
            spaceAfter=6,
            spaceBefore=8
        ))
        
        styles.add(ParagraphStyle(
            name='Footer',
            parent=styles['Normal'],
            fontName=font_name,
            fontSize=8,
            textColor=HexColor('#6c757d'),
            alignment=TA_CENTER
        ))
        
        return styles
    
    def generate_pdf(self, planning_data, output_buffer=None):
        """비디오 기획안을 PDF로 생성"""
        try:
            logger.info("Starting PDF generation...")
            
            if output_buffer is None:
                output_buffer = io.BytesIO()
            
            # 데이터 검증
            if not planning_data:
                logger.error("Planning data is None or empty")
                raise ValueError("Planning data is required")
            
            logger.info(f"Planning data keys: {list(planning_data.keys())}")
            
            # PDF 문서 생성 (A4 가로)
            doc = SimpleDocTemplate(
                output_buffer,
                pagesize=landscape(A4),
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm
            )
            
            # 컨텐츠 구성
            story = []
            
            # 1. 표지 페이지
            cover_page = self._create_cover_page(planning_data)
            story.extend(cover_page)
            story.append(PageBreak())
            
            # 2. 개요 페이지 (기획 의도, 컨셉, 기본 정보)
            overview_page = self._create_overview_page(planning_data)
            story.extend(overview_page)
            story.append(PageBreak())
            
            # 3. 스토리 구조 페이지
            story_structure = self._create_story_structure_page(planning_data)
            story.extend(story_structure)
            story.append(PageBreak())
            
            # 4. 씬 구성 페이지
            scenes_pages = self._create_scenes_pages(planning_data)
            story.extend(scenes_pages)
            
            # PDF 생성
            logger.info("Building PDF document...")
            doc.build(story, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
            output_buffer.seek(0)
            
            logger.info("PDF generation completed successfully")
            return output_buffer
            
        except Exception as e:
            logger.error(f"Error in PDF generation: {str(e)}", exc_info=True)
            # 빈 버퍼라도 반환하여 None 에러 방지
            if output_buffer is None:
                output_buffer = io.BytesIO()
            return output_buffer
    
    def _add_header_footer(self, canvas, doc):
        """헤더와 푸터 추가"""
        canvas.saveState()
        
        # 헤더 - 브랜드 라인
        canvas.setStrokeColor(self.brand_color)
        canvas.setLineWidth(2)
        canvas.line(doc.leftMargin, doc.height + doc.topMargin - 0.5*cm, 
                   doc.width + doc.leftMargin, doc.height + doc.topMargin - 0.5*cm)
        
        # 푸터
        canvas.setFont('HYGothic-Medium', 8)
        canvas.setFillColor(self.text_secondary)
        page_text = f"페이지 {doc.page}"
        canvas.drawCentredString(doc.width/2 + doc.leftMargin, doc.bottomMargin - 0.5*cm, page_text)
        
        # VideoPlanet 로고 텍스트
        canvas.setFont('HYGothic-Medium', 10)
        canvas.setFillColor(self.brand_color)
        canvas.drawString(doc.leftMargin, doc.bottomMargin - 0.5*cm, "VideoPlanet")
        
        # 생성 날짜
        canvas.setFillColor(self.text_secondary)
        date_text = datetime.now().strftime("%Y년 %m월 %d일")
        canvas.drawRightString(doc.width + doc.leftMargin, doc.bottomMargin - 0.5*cm, date_text)
        
        canvas.restoreState()
    
    def _create_cover_page(self, planning_data):
        """표지 페이지 생성"""
        elements = []
        
        # 상단 여백
        elements.append(Spacer(1, 5*cm))
        
        # 제목
        title = planning_data.get('title', '영상 기획안')
        if not title:
            title = '영상 기획안'
        title = str(title).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        
        # 부제목
        planning_options = planning_data.get('planning_options', {})
        genre = planning_data.get('genre') or planning_options.get('genre', '')
        if genre:
            subtitle = f"{genre} 영상 기획서"
            elements.append(Paragraph(subtitle, self.styles['Subtitle']))
        
        elements.append(Spacer(1, 3*cm))
        
        # 장식 라인
        line_drawing = Drawing(25*cm, 0.5*cm)
        line_drawing.add(Line(0, 0.25*cm, 25*cm, 0.25*cm, 
                            strokeColor=self.brand_color, strokeWidth=2))
        elements.append(line_drawing)
        
        elements.append(Spacer(1, 2*cm))
        
        # 메타 정보
        meta_style = ParagraphStyle(
            'MetaInfo',
            parent=self.styles['CustomBody'],
            fontSize=12,
            textColor=self.text_secondary,
            alignment=TA_CENTER
        )
        
        created_date = planning_data.get('created_at', datetime.now().strftime("%Y-%m-%d"))
        if isinstance(created_date, str) and 'T' in created_date:
            created_date = created_date.split('T')[0]
        
        elements.append(Paragraph(f"작성일: {created_date}", meta_style))
        elements.append(Paragraph("VideoPlanet AI 영상 기획 시스템", meta_style))
        
        return elements
    
    def _create_overview_page(self, planning_data):
        """개요 페이지 생성"""
        elements = []
        
        # 섹션 타이틀
        elements.append(self._create_section_header("프로젝트 개요"))
        elements.append(Spacer(1, 1*cm))
        
        # 기본 정보 카드
        planning_options = planning_data.get('planning_options', {})
        
        # 2단 레이아웃으로 기본 정보 표시
        info_data = []
        
        # 첫 번째 행
        genre = planning_data.get('genre') or planning_options.get('genre', 'N/A')
        target = planning_data.get('target') or planning_options.get('target', 'N/A')
        duration = planning_data.get('duration') or planning_options.get('duration', 'N/A')
        purpose = planning_data.get('purpose') or planning_options.get('purpose', 'N/A')
        
        # 정보 카드 스타일
        card_data = [
            [self._create_info_card("장르", genre), 
             self._create_info_card("타겟", target)],
            [self._create_info_card("러닝타임", duration), 
             self._create_info_card("제작 목적", purpose)]
        ]
        
        info_table = Table(card_data, colWidths=[12*cm, 12*cm], rowHeights=[3*cm, 3*cm])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 1.5*cm))
        
        # 기획 의도 섹션
        planning_text = planning_data.get('planning_text', '')
        if planning_text:
            elements.append(self._create_content_box("기획 의도", planning_text))
            elements.append(Spacer(1, 1*cm))
        
        # 컨셉과 톤앤매너를 나란히 배치
        concept = planning_data.get('concept', '')
        tone = planning_data.get('tone', '')
        
        if concept or tone:
            concept_tone_data = [[]]
            if concept:
                concept_tone_data[0].append(self._create_content_box("컨셉트", concept, compact=True))
            if tone:
                concept_tone_data[0].append(self._create_content_box("톤앤매너", tone, compact=True))
            
            if len(concept_tone_data[0]) == 1:
                concept_tone_data[0].append("")  # 빈 셀 추가
            
            concept_tone_table = Table(concept_tone_data, colWidths=[12*cm, 12*cm])
            concept_tone_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ]))
            elements.append(concept_tone_table)
        
        return elements
    
    def _create_section_header(self, title):
        """섹션 헤더 생성"""
        header_table_data = [[title]]
        header_table = Table(header_table_data, colWidths=[25*cm])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.brand_color),
            ('TEXTCOLOR', (0, 0), (-1, -1), HexColor('#FFFFFF')),
            ('FONT', (0, 0), (-1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, -1), 18),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        return header_table
    
    def _create_info_card(self, label, value):
        """정보 카드 생성"""
        card_content = []
        
        # 라벨
        label_style = ParagraphStyle(
            'CardLabel',
            parent=self.styles['CustomBody'],
            fontSize=10,
            textColor=self.text_secondary
        )
        card_content.append(Paragraph(label, label_style))
        
        # 값
        value_style = ParagraphStyle(
            'CardValue',
            parent=self.styles['CustomBody'],
            fontSize=14,
            textColor=self.text_primary,
            spaceAfter=0
        )
        card_content.append(Paragraph(str(value), value_style))
        
        # 카드 테이블
        card_table = Table([[card_content]], colWidths=[11*cm])
        card_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.gray_light),
            ('BOX', (0, 0), (-1, -1), 1, self.gray_medium),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        return card_table
    
    def _create_content_box(self, title, content, compact=False):
        """콘텐츠 박스 생성"""
        box_content = []
        
        # 타이틀
        title_style = ParagraphStyle(
            'BoxTitle',
            parent=self.styles['CustomSubHeading'],
            fontSize=13,
            textColor=self.brand_color,
            spaceAfter=8
        )
        box_content.append(Paragraph(title, title_style))
        
        # 내용
        content_style = self.styles['CompactBody'] if compact else self.styles['CustomBody']
        box_content.append(Paragraph(str(content), content_style))
        
        return box_content
    
    def _create_story_structure_page(self, planning_data):
        """스토리 구조 페이지 생성"""
        elements = []
        
        # 섹션 헤더
        elements.append(self._create_section_header("스토리 구조"))
        elements.append(Spacer(1, 1*cm))
        
        stories = planning_data.get('stories', [])
        story_phases = ['기', '승', '전', '결']
        
        if stories:
            # 스토리 플로우 다이어그램
            flow_drawing = self._create_story_flow_diagram(stories[:4], story_phases)
            if flow_drawing:
                elements.append(flow_drawing)
                elements.append(Spacer(1, 1.5*cm))
            
            # 각 단계별 상세 설명
            for idx, story in enumerate(stories[:4]):
                phase = story_phases[idx] if idx < 4 else f'파트 {idx+1}'
                
                # 단계별 카드
                story_card = self._create_story_phase_card(phase, story)
                elements.append(story_card)
                elements.append(Spacer(1, 0.8*cm))
        
        return elements
    
    def _create_story_flow_diagram(self, stories, phases):
        """스토리 플로우 다이어그램 생성"""
        if not stories:
            return None
            
        drawing = Drawing(25*cm, 4*cm)
        
        # 각 단계별 박스와 화살표
        box_width = 5.5*cm
        box_height = 3*cm
        spacing = 0.5*cm
        y_pos = 0.5*cm
        
        for idx, (story, phase) in enumerate(zip(stories[:4], phases)):
            x_pos = idx * (box_width + spacing)
            
            # 박스
            box = Rect(x_pos, y_pos, box_width, box_height,
                      fillColor=self.gray_light,
                      strokeColor=self.brand_color,
                      strokeWidth=2)
            drawing.add(box)
            
            # 화살표 (마지막 박스 제외)
            if idx < 3:
                arrow_x = x_pos + box_width + spacing/4
                arrow_y = y_pos + box_height/2
                drawing.add(Line(arrow_x, arrow_y, arrow_x + spacing/2, arrow_y,
                               strokeColor=self.brand_color, strokeWidth=2))
        
        return drawing
    
    def _create_story_phase_card(self, phase, story):
        """스토리 단계별 카드 생성"""
        card_content = []
        
        # 단계 제목
        phase_title = f"{phase}"
        if story.get('phase'):
            phase_title += f" - {story.get('phase')}"
        
        title_style = ParagraphStyle(
            'PhaseTitle',
            parent=self.styles['CustomSubHeading'],
            fontSize=14,
            textColor=self.brand_color,
            spaceAfter=8
        )
        card_content.append(Paragraph(phase_title, title_style))
        
        # 스토리 내용
        content = story.get('content', '')
        if content:
            card_content.append(Paragraph(content, self.styles['CustomBody']))
        
        # 핵심 포인트
        key_point = story.get('key_point', '')
        if key_point:
            key_style = ParagraphStyle(
                'KeyPoint',
                parent=self.styles['CompactBody'],
                fontSize=10,
                textColor=self.text_secondary,
                leftIndent=20,
                bulletIndent=10,
                bulletText='•'
            )
            card_content.append(Spacer(1, 0.3*cm))
            card_content.append(Paragraph(f"핵심 포인트: {key_point}", key_style))
        
        # 카드 테이블
        card_table = Table([[card_content]], colWidths=[24*cm])
        card_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), HexColor('#ffffff')),
            ('BOX', (0, 0), (-1, -1), 1, self.gray_medium),
            ('LEFTPADDING', (0, 0), (-1, -1), 20),
            ('RIGHTPADDING', (0, 0), (-1, -1), 20),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        return card_table
    
    def _create_scenes_pages(self, planning_data):
        """씬 구성 페이지들 생성"""
        elements = []
        
        # 섹션 헤더
        elements.append(self._create_section_header("씬 구성"))
        elements.append(Spacer(1, 1*cm))
        
        scenes = planning_data.get('scenes', [])
        
        if scenes:
            # 씬 개요 (그리드 레이아웃)
            overview_grid = self._create_scenes_overview_grid(scenes)
            if overview_grid:
                elements.extend(overview_grid)
                elements.append(PageBreak())
            
            # 각 씬별 상세 페이지
            for idx, scene in enumerate(scenes):
                # 2개씩 가로로 배치
                if idx % 2 == 0:
                    # 다음 씬이 있으면 함께 배치
                    if idx + 1 < len(scenes):
                        scene_pair = self._create_scene_pair(
                            scene, scenes[idx + 1], idx, idx + 1
                        )
                        elements.extend(scene_pair)
                    else:
                        # 마지막 씬이면 혼자 배치
                        single_scene = self._create_single_scene(scene, idx)
                        elements.extend(single_scene)
                    
                    # 각 페어 후 페이지 구분
                    if idx + 2 < len(scenes):
                        elements.append(PageBreak())
        
        return elements
    
    def _create_scenes_overview_grid(self, scenes):
        """씬 개요 그리드 생성"""
        elements = []
        
        # 씬 개요 설명
        overview_text = f"총 {len(scenes)}개의 씬으로 구성된 영상 기획안입니다."
        elements.append(Paragraph(overview_text, self.styles['CustomBody']))
        elements.append(Spacer(1, 1*cm))
        
        # 씬 그리드 (3열)
        grid_data = []
        current_row = []
        
        for idx, scene in enumerate(scenes):
            # 씬 썸네일 카드
            scene_card = self._create_scene_thumbnail_card(scene, idx)
            current_row.append(scene_card)
            
            if len(current_row) == 3 or idx == len(scenes) - 1:
                # 빈 셀 채우기
                while len(current_row) < 3:
                    current_row.append("")
                grid_data.append(current_row)
                current_row = []
        
        if grid_data:
            grid_table = Table(grid_data, colWidths=[8*cm, 8*cm, 8*cm])
            grid_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            elements.append(grid_table)
        
        return elements
    
    def _create_scene_thumbnail_card(self, scene, idx):
        """씬 썸네일 카드 생성"""
        card_content = []
        
        # 씬 번호와 제목
        scene_title = f"씬 {idx + 1}"
        if scene.get('location'):
            scene_title += f" - {scene.get('location')}"
        
        title_style = ParagraphStyle(
            'ThumbnailTitle',
            parent=self.styles['SceneTitle'],
            fontSize=11,
            spaceAfter=4
        )
        card_content.append(Paragraph(scene_title, title_style))
        
        # 간단한 설명
        description = scene.get('description', scene.get('action', ''))
        if description:
            short_desc = description[:60] + '...' if len(description) > 60 else description
            card_content.append(Paragraph(short_desc, self.styles['CompactBody']))
        
        # 스토리보드 썸네일
        storyboard = scene.get('storyboard', {})
        image_url = storyboard.get('image_url')
        if image_url and image_url != 'generated_image_placeholder':
            img_element = self._create_image_element(image_url, max_width=7*cm, max_height=4*cm)
            if img_element:
                card_content.append(Spacer(1, 0.2*cm))
                card_content.append(img_element)
        
        # 카드 래핑
        card_table = Table([[card_content]], colWidths=[7.5*cm])
        card_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.gray_light),
            ('BOX', (0, 0), (-1, -1), 0.5, self.gray_medium),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        return card_table
    
    def _create_scene_pair(self, scene1, scene2, idx1, idx2):
        """두 개의 씬을 나란히 배치"""
        elements = []
        
        # 씬 페어 테이블
        scene_data = [[
            self._create_scene_detail_card(scene1, idx1),
            self._create_scene_detail_card(scene2, idx2)
        ]]
        
        scene_table = Table(scene_data, colWidths=[12*cm, 12*cm])
        scene_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        
        elements.append(scene_table)
        
        return elements
    
    def _create_single_scene(self, scene, idx):
        """단일 씬 배치"""
        elements = []
        
        scene_card = self._create_scene_detail_card(scene, idx, full_width=True)
        elements.append(scene_card)
        
        return elements
    
    def _create_scene_detail_card(self, scene, idx, full_width=False):
        """씬 상세 카드 생성"""
        card_content = []
        
        # 씬 헤더
        scene_header = f"씬 {idx + 1}"
        if scene.get('title'):
            scene_header += f": {scene.get('title')}"
        elif scene.get('location'):
            scene_header += f": {scene.get('location')}"
        
        header_style = ParagraphStyle(
            'SceneHeader',
            parent=self.styles['CustomSubHeading'],
            fontSize=14,
            textColor=self.brand_color,
            spaceAfter=10
        )
        card_content.append(Paragraph(scene_header, header_style))
        
        # 스토리보드 이미지
        storyboard = scene.get('storyboard', {})
        image_url = storyboard.get('image_url')
        
        if image_url and image_url != 'generated_image_placeholder':
            max_width = 20*cm if full_width else 10*cm
            img_element = self._create_image_element(image_url, max_width=max_width, max_height=8*cm)
            if img_element:
                card_content.append(img_element)
                card_content.append(Spacer(1, 0.5*cm))
        
        # 씬 설명
        description = storyboard.get('description_kr') or scene.get('description', '')
        if description:
            card_content.append(Paragraph("설명", self.styles['SceneTitle']))
            card_content.append(Paragraph(description, self.styles['CustomBody']))
            card_content.append(Spacer(1, 0.3*cm))
        
        # 추가 정보들
        if scene.get('action'):
            card_content.append(Paragraph("액션", self.styles['SceneTitle']))
            card_content.append(Paragraph(scene.get('action'), self.styles['CompactBody']))
            card_content.append(Spacer(1, 0.3*cm))
        
        if scene.get('dialogue'):
            card_content.append(Paragraph("대사", self.styles['SceneTitle']))
            card_content.append(Paragraph(scene.get('dialogue'), self.styles['CompactBody']))
        
        # 카드 래핑
        card_width = 23*cm if full_width else 11.5*cm
        card_table = Table([[card_content]], colWidths=[card_width])
        card_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), HexColor('#ffffff')),
            ('BOX', (0, 0), (-1, -1), 1, self.gray_medium),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        return card_table
    
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
    
    def _create_compressed_layout(self, planning_data):
        """압축된 레이아웃으로 전체 기획안 생성 (하위 호환성 유지)"""
        # 새로운 디자인으로 리다이렉트
        elements = []
        
        try:
            # 표지 페이지 내용 (압축 버전)
            title = planning_data.get('title', '영상 기획안')
            if not title:
                title = '영상 기획안'
            title = str(title).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            
            elements.append(Paragraph(title, self.styles['CustomTitle']))
            elements.append(Spacer(1, 0.5*cm))
            
            # 개요 정보 압축
            planning_options = planning_data.get('planning_options', {})
            genre = planning_data.get('genre') or planning_options.get('genre', 'N/A')
            target = planning_data.get('target') or planning_options.get('target', 'N/A')
            duration = planning_data.get('duration') or planning_options.get('duration', 'N/A')
            purpose = planning_data.get('purpose') or planning_options.get('purpose', 'N/A')
            
            # 기본 정보 카드 그리드
            info_cards = [
                [self._create_info_card("장르", genre), 
                 self._create_info_card("타겟", target),
                 self._create_info_card("러닝타임", duration), 
                 self._create_info_card("제작 목적", purpose)]
            ]
            
            info_table = Table(info_cards, colWidths=[6*cm, 6*cm, 6*cm, 6*cm])
            info_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ]))
            elements.append(info_table)
            elements.append(Spacer(1, 1*cm))
            
            # 기획 의도
            planning_text = planning_data.get('planning_text', '')
            if planning_text:
                short_text = planning_text[:300] + '...' if len(planning_text) > 300 else planning_text
                elements.append(Paragraph("기획 의도", self.styles['CustomSubHeading']))
                elements.append(Paragraph(short_text, self.styles['CompactBody']))
                elements.append(Spacer(1, 0.5*cm))
            
            # 스토리 구조 (간략)
            stories = planning_data.get('stories', [])
            if stories:
                elements.append(Paragraph("스토리 구조", self.styles['CustomSubHeading']))
                story_phases = ['기', '승', '전', '결']
                
                story_row = []
                for idx, story in enumerate(stories[:4]):
                    phase = story_phases[idx] if idx < 4 else f'파트 {idx+1}'
                    content = story.get('content', '')[:80] + '...' if len(story.get('content', '')) > 80 else story.get('content', '')
                    
                    phase_card = []
                    phase_card.append(Paragraph(f"<b>{phase}</b>", self.styles['SceneTitle']))
                    phase_card.append(Paragraph(content, self.styles['CompactBody']))
                    story_row.append(phase_card)
                
                if story_row:
                    story_table = Table([story_row], colWidths=[6*cm, 6*cm, 6*cm, 6*cm])
                    story_table.setStyle(TableStyle([
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ('BACKGROUND', (0, 0), (-1, -1), self.gray_light),
                        ('BOX', (0, 0), (-1, -1), 0.5, self.gray_medium),
                        ('INNERGRID', (0, 0), (-1, -1), 0.5, self.gray_medium),
                        ('LEFTPADDING', (0, 0), (-1, -1), 10),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                        ('TOPPADDING', (0, 0), (-1, -1), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                    ]))
                    elements.append(story_table)
                    elements.append(Spacer(1, 0.5*cm))
            
            # 씬 구성 요약
            scenes = planning_data.get('scenes', [])
            if scenes:
                elements.append(Paragraph(f"씬 구성 ({len(scenes)}개 씬)", self.styles['CustomSubHeading']))
                
                # 씬 미니 그리드
                scene_grid = []
                current_row = []
                
                for idx, scene in enumerate(scenes[:6]):  # 최대 6개만 표시
                    scene_info = f"씬 {idx + 1}"
                    if scene.get('location'):
                        scene_info += f": {scene.get('location')}"
                    
                    scene_mini = Paragraph(scene_info, self.styles['CompactBody'])
                    current_row.append(scene_mini)
                    
                    if len(current_row) == 3:
                        scene_grid.append(current_row)
                        current_row = []
                
                if current_row:
                    while len(current_row) < 3:
                        current_row.append("")
                    scene_grid.append(current_row)
                
                if scene_grid:
                    mini_table = Table(scene_grid, colWidths=[8*cm, 8*cm, 8*cm])
                    mini_table.setStyle(TableStyle([
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ('LEFTPADDING', (0, 0), (-1, -1), 5),
                        ('TOPPADDING', (0, 0), (-1, -1), 5),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ]))
                    elements.append(mini_table)
                
                if len(scenes) > 6:
                    elements.append(Paragraph(f"... 외 {len(scenes) - 6}개 씬", self.styles['CompactBody']))
        
        except Exception as e:
            logger.error(f"Error creating compressed layout: {str(e)}", exc_info=True)
            error_elements = []
            error_elements.append(Paragraph("PDF 생성 중 오류가 발생했습니다", self.styles['CustomTitle']))
            error_elements.append(Paragraph(str(e), self.styles['CustomBody']))
            return error_elements
        
        return elements
    
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