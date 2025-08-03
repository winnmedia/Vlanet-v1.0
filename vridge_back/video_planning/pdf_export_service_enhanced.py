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
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import requests
from PIL import Image as PILImage
from io import BytesIO
import tempfile

logger = logging.getLogger(__name__)


class EnhancedPDFExportService:
    """가로형 보고서 형태의 PDF 내보내기 서비스"""
    
    def __init__(self):
        self.setup_fonts()
        self.styles = self.setup_styles()
    
    def setup_fonts(self):
        """한글 폰트 설정"""
        try:
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
        font_name = 'HYGothic-Medium'
        
        # 커스텀 스타일 추가
        styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=styles['Title'],
            fontName=font_name,
            fontSize=24,
            textColor=HexColor('#1631F8'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=styles['Heading1'],
            fontName=font_name,
            fontSize=18,
            textColor=HexColor('#2c3e50'),
            spaceAfter=15,
            spaceBefore=15
        ))
        
        styles.add(ParagraphStyle(
            name='CustomSubHeading',
            parent=styles['Heading2'],
            fontName=font_name,
            fontSize=14,
            textColor=HexColor('#34495e'),
            spaceAfter=10,
            spaceBefore=10
        ))
        
        styles.add(ParagraphStyle(
            name='CustomBody',
            parent=styles['BodyText'],
            fontName=font_name,
            fontSize=11,
            textColor=HexColor('#4a4a4a'),
            spaceAfter=5,
            leading=15
        ))
        
        styles.add(ParagraphStyle(
            name='SceneTitle',
            parent=styles['Heading3'],
            fontName=font_name,
            fontSize=12,
            textColor=HexColor('#1631F8'),
            spaceAfter=5
        ))
        
        return styles
    
    def generate_pdf(self, planning_data, output_buffer=None):
        """비디오 기획안을 가로형 PDF로 생성"""
        if output_buffer is None:
            output_buffer = io.BytesIO()
        
        # 사용자 입력 데이터를 JSON 형태로 정규화
        normalized_data = self._normalize_planning_data(planning_data)
        logger.info(f"정규화된 기획 데이터: {normalized_data}")
        
        # PDF 문서 생성 (A4 가로)
        doc = SimpleDocTemplate(
            output_buffer,
            pagesize=landscape(A4),
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=1.5*cm,
            bottomMargin=1.5*cm
        )
        
        # 컨텐츠 구성
        story = []
        
        # 1. 타이틀 페이지
        story.extend(self._create_title_page(normalized_data))
        story.append(PageBreak())
        
        # 2. 기획 개요 페이지
        story.extend(self._create_overview_page(normalized_data))
        story.append(PageBreak())
        
        # 3. 스토리 구성 페이지
        story.extend(self._create_story_flow_page(normalized_data))
        story.append(PageBreak())
        
        # 4. 씬별 상세 페이지
        story.extend(self._create_scenes_grid_layout(normalized_data))
        
        # 5. 프로 옵션 페이지 (있는 경우)
        if normalized_data.get('pro_options'):
            story.append(PageBreak())
            story.extend(self._create_pro_options_page(normalized_data))
        
        # PDF 생성
        doc.build(story)
        output_buffer.seek(0)
        
        return output_buffer
    
    def _normalize_planning_data(self, planning_data):
        """사용자 입력 데이터를 표준화된 JSON 형태로 변환"""
        return {
            'title': planning_data.get('title', '제목 없음'),
            'planning_text': planning_data.get('planning', '') or planning_data.get('planning_text', ''),
            'project_info': {
                'type': planning_data.get('project_type', ''),
                'duration': planning_data.get('duration', ''),
                'target_audience': planning_data.get('target_audience', ''),
                'genre': planning_data.get('genre', ''),
                'concept': planning_data.get('concept', ''),
                'tone_manner': planning_data.get('tone_manner', ''),
                'key_message': planning_data.get('key_message', ''),
                'mood': planning_data.get('desired_mood', ''),
            },
            'stories': planning_data.get('stories', []),
            'scenes': planning_data.get('scenes', []),
            'shots': planning_data.get('shots', []),
            'storyboards': planning_data.get('storyboards', []),
            'pro_options': planning_data.get('planning_options', {})
        }
    
    def _create_title_page(self, normalized_data):
        """타이틀 페이지 생성 (가로형)"""
        elements = []
        
        # 제목
        title = normalized_data.get('title', '영상 기획안')
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 2*cm))
        
        # 프로젝트 정보를 2열로 구성
        project_info = normalized_data.get('project_info', {})
        
        left_column_data = [
            ['프로젝트 유형', project_info.get('type') or 'N/A'],
            ['타겟 오디언스', project_info.get('target_audience') or 'N/A'],
            ['러닝타임', project_info.get('duration') or 'N/A'],
            ['장르', project_info.get('genre') or 'N/A']
        ]
        
        right_column_data = [
            ['컨셉', project_info.get('concept') or 'N/A'],
            ['톤앤매너', project_info.get('tone_manner') or 'N/A'],
            ['핵심 메시지', project_info.get('key_message') or 'N/A'],
            ['분위기', project_info.get('mood') or 'N/A']
        ]
        
        # 2열 테이블 생성
        main_table_data = []
        for i in range(4):
            row = left_column_data[i] + right_column_data[i]
            main_table_data.append(row)
        
        main_table = Table(main_table_data, colWidths=[4*cm, 8*cm, 4*cm, 8*cm])
        main_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (-1, -1), HexColor('#2c3e50')),
            ('TEXTCOLOR', (1, 0), (1, -1), HexColor('#4a4a4a')),
            ('TEXTCOLOR', (3, 0), (3, -1), HexColor('#4a4a4a')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#ecf0f1')),
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#f8f9fa')),
            ('BACKGROUND', (2, 0), (2, -1), HexColor('#f8f9fa')),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(main_table)
        
        return elements
    
    def _create_overview_page(self, normalized_data):
        """기획 개요 페이지 생성 (가로형)"""
        elements = []
        
        elements.append(Paragraph('기획 개요', self.styles['CustomHeading']))
        elements.append(Spacer(1, 1*cm))
        
        # 기획 의도를 박스 형태로 표시
        planning_text = normalized_data.get('planning_text', '')
        if planning_text:
            planning_box_data = [[Paragraph(planning_text, self.styles['CustomBody'])]]
            planning_box = Table(planning_box_data, colWidths=[26*cm])
            planning_box.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f0f4f8')),
                ('BOX', (0, 0), (-1, -1), 1, HexColor('#1631F8')),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('TOPPADDING', (0, 0), (-1, -1), 15),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ]))
            elements.append(planning_box)
        
        return elements
    
    def _create_story_flow_page(self, normalized_data):
        """스토리 플로우 페이지 생성 (가로형 타임라인)"""
        elements = []
        
        elements.append(Paragraph('스토리 구성', self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.5*cm))
        
        stories = normalized_data.get('stories', [])
        if not stories:
            return elements
        
        # 스토리를 타임라인 형태로 표시
        story_phases = ['기', '승', '전', '결']
        story_data = []
        
        # 헤더 행
        header_row = []
        for idx, phase in enumerate(story_phases[:len(stories)]):
            header_row.append(Paragraph(f'<b>{phase}</b>', self.styles['CustomSubHeading']))
        story_data.append(header_row)
        
        # 내용 행
        content_row = []
        for story in stories[:4]:
            content = story.get('content', '')
            key_point = story.get('key_point', '')
            
            story_text = content
            if key_point:
                story_text += f"<br/><br/><b>핵심:</b> {key_point}"
            
            content_row.append(Paragraph(story_text, self.styles['CustomBody']))
        story_data.append(content_row)
        
        # 동일한 너비로 설정
        col_width = 26*cm / len(content_row)
        story_table = Table(story_data, colWidths=[col_width] * len(content_row))
        story_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'HYGothic-Medium'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1631F8')),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(story_table)
        
        return elements
    
    def _create_scenes_grid_layout(self, normalized_data):
        """씬별 상세를 그리드 레이아웃으로 생성"""
        elements = []
        
        elements.append(Paragraph('씬 구성 상세', self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.5*cm))
        
        scenes = normalized_data.get('scenes', [])
        if not scenes:
            return elements
        
        # 2x2 그리드로 씬 표시 (한 페이지에 4개씬)
        scenes_per_page = 4
        
        for page_idx in range(0, len(scenes), scenes_per_page):
            if page_idx > 0:
                elements.append(PageBreak())
            
            page_scenes = scenes[page_idx:page_idx + scenes_per_page]
            scene_grid_data = []
            
            # 2행으로 구성
            for row in range(2):
                scene_row = []
                for col in range(2):
                    scene_idx = row * 2 + col
                    if scene_idx < len(page_scenes):
                        scene = page_scenes[scene_idx]
                        scene_content = self._create_scene_cell(scene, page_idx + scene_idx + 1)
                        scene_row.append(scene_content)
                    else:
                        scene_row.append('')
                scene_grid_data.append(scene_row)
            
            scene_grid = Table(scene_grid_data, colWidths=[13*cm, 13*cm], rowHeights=[8*cm, 8*cm])
            scene_grid.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            
            elements.append(scene_grid)
        
        return elements
    
    def _create_scene_cell(self, scene, scene_number):
        """개별 씬 셀 생성"""
        cell_content = []
        
        # 씬 제목
        scene_title = f"씬 {scene_number}"
        if scene.get('title'):
            scene_title += f": {scene.get('title')}"
        cell_content.append(Paragraph(scene_title, self.styles['SceneTitle']))
        
        # 스토리보드 이미지
        storyboards = scene.get('storyboards', [])
        if storyboards and len(storyboards) > 0:
            storyboard = storyboards[0]
            image_url = storyboard.get('image_url')
            if image_url and image_url != 'generated_image_placeholder':
                img_element = self._create_image_element(image_url, max_width=10*cm, max_height=5*cm)
                if img_element:
                    cell_content.append(img_element)
        
        # 씬 설명
        description = scene.get('description', '')
        if description:
            cell_content.append(Paragraph(description[:150] + '...' if len(description) > 150 else description, 
                                        self.styles['CustomBody']))
        
        # 촬영 정보 (있는 경우)
        if scene.get('location'):
            cell_content.append(Paragraph(f"<b>장소:</b> {scene.get('location')}", self.styles['CustomBody']))
        
        return cell_content
    
    def _create_pro_options_page(self, normalized_data):
        """프로 옵션 페이지 생성"""
        elements = []
        
        elements.append(Paragraph('프로 옵션 설정', self.styles['CustomHeading']))
        elements.append(Spacer(1, 1*cm))
        
        pro_options = normalized_data.get('pro_options', {})
        
        options_data = [
            ['색감 톤', pro_options.get('colorTone', 'natural')],
            ['화면 비율', pro_options.get('aspectRatio', '16:9')],
            ['카메라 타입', pro_options.get('cameraType', 'dslr')],
            ['렌즈 타입', pro_options.get('lensType', '35mm')],
            ['카메라 움직임', pro_options.get('cameraMovement', 'static')]
        ]
        
        options_table = Table(options_data, colWidths=[6*cm, 20*cm])
        options_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#2c3e50')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#f8f9fa')),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(options_table)
        
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
            rl_img = Image(tmp_path, width=new_width, height=new_height)
            
            # 임시 파일 삭제
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            
            return rl_img
            
        except Exception as e:
            logger.error(f"이미지 요소 생성 실패: {str(e)}")
            return None