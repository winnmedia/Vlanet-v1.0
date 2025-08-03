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


class PDFExportService:
    """비디오 기획안을 PDF로 내보내는 서비스"""
    
    def __init__(self):
        self.setup_fonts()
        self.styles = self.setup_styles()
    
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
            fontSize=20,
            textColor=HexColor('#1a1a1a'),
            spaceAfter=15,
            alignment=TA_CENTER
        ))
        
        styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=styles['Heading1'],
            fontName=font_name,
            fontSize=14,
            textColor=HexColor('#2c3e50'),
            spaceAfter=10,
            spaceBefore=10
        ))
        
        styles.add(ParagraphStyle(
            name='CustomSubHeading',
            parent=styles['Heading2'],
            fontName=font_name,
            fontSize=12,
            textColor=HexColor('#34495e'),
            spaceAfter=8,
            spaceBefore=8
        ))
        
        styles.add(ParagraphStyle(
            name='CustomBody',
            parent=styles['BodyText'],
            fontName=font_name,
            fontSize=9,
            textColor=HexColor('#4a4a4a'),
            spaceAfter=4,
            leading=12
        ))
        
        styles.add(ParagraphStyle(
            name='SceneTitle',
            parent=styles['Heading3'],
            fontName=font_name,
            fontSize=10,
            textColor=HexColor('#2980b9'),
            spaceAfter=4
        ))
        
        return styles
    
    def generate_pdf(self, planning_data, output_buffer=None):
        """비디오 기획안을 PDF로 생성"""
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
        
        # 컨텐츠 구성 (가로형 보고서 레이아웃)
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
        
        # 4. 씬별 상세 페이지 (가로형 레이아웃)
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
            ['프로젝트 유형', project_info.get('type', 'N/A')],
            ['타겟 오디언스', project_info.get('target_audience', 'N/A')],
            ['러닝타임', project_info.get('duration', 'N/A')],
            ['장르', project_info.get('genre', 'N/A')]
        ]
        
        right_column_data = [
            ['컨셉', project_info.get('concept', 'N/A')],
            ['톤앤매너', project_info.get('tone_manner', 'N/A')],
            ['핵심 메시지', project_info.get('key_message', 'N/A')],
            ['분위기', project_info.get('mood', 'N/A')]
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
    
    def _create_compressed_layout(self, planning_data):
        """압축된 레이아웃으로 전체 기획안 생성"""
        elements = []
        
        # 상단 타이틀 및 기본 정보 (가로 2단 레이아웃)
        title = planning_data.get('title', '영상 기획안')
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.5*cm))
        
        # 기본 정보를 2열 테이블로 구성
        info_data = []
        info_data.append(['장르', planning_data.get('genre', 'N/A'), '타겟', planning_data.get('target', 'N/A')])
        info_data.append(['러닝타임', planning_data.get('duration', 'N/A'), '목적', planning_data.get('purpose', 'N/A')])
        
        info_table = Table(info_data, colWidths=[3*cm, 5*cm, 3*cm, 5*cm])
        info_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#2c3e50')),
            ('TEXTCOLOR', (1, 0), (1, -1), HexColor('#4a4a4a')),
            ('TEXTCOLOR', (2, 0), (2, -1), HexColor('#2c3e50')),
            ('TEXTCOLOR', (3, 0), (3, -1), HexColor('#4a4a4a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8f9fa')),
            ('BOX', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.5*cm))
        
        # 기획 의도 및 컨셉 (가로로 배치)
        concept_data = []
        planning_text = planning_data.get('planning_text', '')[:200] + '...' if len(planning_data.get('planning_text', '')) > 200 else planning_data.get('planning_text', '')
        concept = planning_data.get('concept', '')
        
        if planning_text or concept:
            concept_row = []
            if planning_text:
                concept_row.append(Paragraph(f"<b>기획의도:</b> {planning_text}", self.styles['CustomBody']))
            if concept:
                concept_row.append(Paragraph(f"<b>컨셉:</b> {concept}", self.styles['CustomBody']))
            
            if concept_row:
                concept_table = Table([concept_row], colWidths=[12*cm, 12*cm] if len(concept_row) > 1 else [24*cm])
                concept_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ]))
                elements.append(concept_table)
                elements.append(Spacer(1, 0.3*cm))
        
        # 스토리 구성 (기승전결) - 가로 4단
        stories = planning_data.get('stories', [])
        if stories:
            elements.append(Paragraph('스토리 구성', self.styles['CustomSubHeading']))
            story_data = []
            story_row = []
            story_phases = ['기', '승', '전', '결']
            
            for idx, story in enumerate(stories[:4]):
                phase = story_phases[idx] if idx < 4 else f'파트 {idx+1}'
                content = story.get('content', '')[:100] + '...' if len(story.get('content', '')) > 100 else story.get('content', '')
                story_cell = Paragraph(f"<b>{phase}</b><br/>{content}", self.styles['CustomBody'])
                story_row.append(story_cell)
            
            if story_row:
                story_table = Table([story_row], colWidths=[6*cm, 6*cm, 6*cm, 6*cm])
                story_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOX', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
                    ('INNERGRID', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
                    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8f9fa')),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ]))
                elements.append(story_table)
                elements.append(Spacer(1, 0.5*cm))
        
        # 씬 구성 (그리드 레이아웃)
        scenes = planning_data.get('scenes', [])
        if scenes:
            elements.append(Paragraph('씬 구성', self.styles['CustomSubHeading']))
            
            # 3열 그리드로 씬 배치
            scene_rows = []
            current_row = []
            
            for idx, scene in enumerate(scenes):
                scene_content = []
                scene_title = f"씬 {idx + 1}"
                if scene.get('location'):
                    scene_title += f" - {scene.get('location')}"
                
                scene_content.append(Paragraph(scene_title, self.styles['SceneTitle']))
                
                description = scene.get('description', scene.get('action', ''))[:80] + '...' if len(scene.get('description', scene.get('action', ''))) > 80 else scene.get('description', scene.get('action', ''))
                if description:
                    scene_content.append(Paragraph(description, ParagraphStyle(
                        'CompactBody',
                        parent=self.styles['CustomBody'],
                        fontSize=9,
                        leading=11
                    )))
                
                # 스토리보드 이미지가 있으면 작게 추가
                storyboard = scene.get('storyboard', {})
                image_url = storyboard.get('image_url')
                if image_url and image_url != 'generated_image_placeholder':
                    img_element = self._create_image_element(image_url, max_width=4*cm, max_height=3*cm)
                    if img_element:
                        scene_content.append(img_element)
                
                current_row.append(scene_content)
                
                if len(current_row) == 3 or idx == len(scenes) - 1:
                    # 빈 셀 채우기
                    while len(current_row) < 3:
                        current_row.append('')
                    scene_rows.append(current_row)
                    current_row = []
            
            if scene_rows:
                scene_table = Table(scene_rows, colWidths=[8*cm, 8*cm, 8*cm])
                scene_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOX', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
                    ('INNERGRID', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ]))
                elements.append(scene_table)
        
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