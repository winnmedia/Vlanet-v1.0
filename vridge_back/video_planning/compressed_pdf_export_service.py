import os
import io
import logging
import re
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak, KeepTogether, Flowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.colors import HexColor, white, black, lightgrey, grey
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib import colors
import requests
from PIL import Image as PILImage
from io import BytesIO
import tempfile
from datetime import datetime
from .gemini_service import GeminiService

logger = logging.getLogger(__name__)


class CompressedPDFExportService:
    """압축된 영상 기획안 PDF 내보내기 서비스"""
    
    def __init__(self):
        self.page_width, self.page_height = A4  # 세로 A4로 변경 (더 많은 내용을 담기 위해)
        self.margin = 1.5*cm  # 여백 줄이기
        self.content_width = self.page_width - (2 * self.margin)
        self.setup_fonts()
        self.styles = self.setup_styles()
        self.gemini_service = GeminiService()
    
    def setup_fonts(self):
        """한글 폰트 설정"""
        try:
            pdfmetrics.registerFont(UnicodeCIDFont('HYGothic-Medium'))
            pdfmetrics.registerFont(UnicodeCIDFont('HYSMyeongJo-Medium'))
            logger.info("한글 폰트 등록 완료")
        except Exception as e:
            logger.warning(f"폰트 설정 경고: {str(e)}")
    
    def setup_styles(self):
        """PDF 스타일 설정 - 압축된 버전"""
        styles = getSampleStyleSheet()
        
        korean_font = 'HYGothic-Medium'
        
        # 제목 스타일 (크기 축소)
        styles.add(ParagraphStyle(
            name='CompactTitle',
            parent=styles['Title'],
            fontName=korean_font,
            fontSize=20,
            textColor=HexColor('#1631F8'),
            spaceAfter=10,
            spaceBefore=5,
            alignment=TA_CENTER,
            leading=24
        ))
        
        # 섹션 제목 스타일
        styles.add(ParagraphStyle(
            name='CompactSection',
            parent=styles['Heading1'],
            fontName=korean_font,
            fontSize=14,
            textColor=HexColor('#2c3e50'),
            spaceAfter=8,
            spaceBefore=12,
            leading=18,
            borderWidth=0,
            borderPadding=0,
            backColor=HexColor('#f0f4ff'),
            borderColor=HexColor('#1631F8'),
            borderRadius=4
        ))
        
        # 서브 제목 스타일
        styles.add(ParagraphStyle(
            name='CompactSubSection',
            parent=styles['Heading2'],
            fontName=korean_font,
            fontSize=11,
            textColor=HexColor('#34495e'),
            spaceAfter=5,
            spaceBefore=8,
            leading=14
        ))
        
        # 본문 스타일 (크기 축소)
        styles.add(ParagraphStyle(
            name='CompactBody',
            parent=styles['Normal'],
            fontName=korean_font,
            fontSize=9,
            textColor=HexColor('#2c3e50'),
            spaceAfter=4,
            leading=12,
            alignment=TA_JUSTIFY
        ))
        
        # 테이블 스타일
        styles.add(ParagraphStyle(
            name='CompactTable',
            parent=styles['Normal'],
            fontName=korean_font,
            fontSize=8,
            textColor=HexColor('#2c3e50'),
            spaceAfter=2,
            leading=10,
            alignment=TA_LEFT
        ))
        
        # 캡션 스타일
        styles.add(ParagraphStyle(
            name='CompactCaption',
            parent=styles['Normal'],
            fontName=korean_font,
            fontSize=7,
            textColor=HexColor('#7f8c8d'),
            spaceAfter=2,
            leading=9,
            alignment=TA_CENTER
        ))
        
        return styles
    
    def generate_pdf(self, planning_data, output_buffer=None):
        """압축된 PDF 생성"""
        if output_buffer is None:
            output_buffer = io.BytesIO()
        
        # A4 세로 문서 설정
        doc = SimpleDocTemplate(
            output_buffer,
            pagesize=A4,
            rightMargin=self.margin,
            leftMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
            title=planning_data.get('title', '영상 기획안'),
            author='VideoPlanet'
        )
        
        story = []
        
        # LLM을 통한 내용 요약
        summary_result = self.gemini_service.summarize_for_pdf(planning_data)
        
        if summary_result['success']:
            # 요약된 내용을 기반으로 PDF 생성
            story.extend(self._create_compressed_content(planning_data, summary_result))
        else:
            # 실패 시 기본 압축 형태로 생성
            story.extend(self._create_default_compressed_content(planning_data))
        
        # PDF 생성
        try:
            doc.build(story, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)
            output_buffer.seek(0)
            logger.info("압축된 PDF 생성 완료")
            return output_buffer
        except Exception as e:
            logger.error(f"PDF 생성 오류: {str(e)}")
            raise
    
    def _create_compressed_content(self, planning_data, summary_result):
        """LLM 요약을 기반으로 압축된 콘텐츠 생성"""
        elements = []
        summary_text = summary_result['summary']
        
        # 1페이지: 커버 및 핵심 요약
        elements.append(Paragraph(planning_data.get('title', '영상 기획안'), self.styles['CompactTitle']))
        elements.append(Spacer(1, 5*mm))
        
        # 핵심 콘셉트 추출
        concept_match = re.search(r'1\.\s*\*\*핵심 콘셉트\*\*[:\s]*(.+)', summary_text)
        if concept_match:
            concept = concept_match.group(1).strip()
            elements.append(Paragraph(f"<b>핵심 콘셉트:</b> {concept}", self.styles['CompactBody']))
            elements.append(Spacer(1, 5*mm))
        
        # 프로젝트 스펙 테이블
        elements.append(Paragraph("프로젝트 스펙", self.styles['CompactSection']))
        spec_table_data = self._extract_spec_table(summary_result['original_settings'])
        
        spec_table = Table(spec_table_data, colWidths=[4*cm, 5*cm, 4*cm, 5*cm])
        spec_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#f0f4ff')),
            ('BACKGROUND', (2, 0), (2, -1), HexColor('#f0f4ff')),
            ('TEXTCOLOR', (0, 0), (-1, -1), HexColor('#2c3e50')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(spec_table)
        elements.append(Spacer(1, 5*mm))
        
        # 스토리 요약
        story_match = re.search(r'3\.\s*\*\*스토리 요약\*\*[:\s]*(.+?)(?=4\.|$)', summary_text, re.DOTALL)
        if story_match:
            story_summary = story_match.group(1).strip()
            elements.append(Paragraph("스토리 요약", self.styles['CompactSection']))
            elements.append(Paragraph(story_summary, self.styles['CompactBody']))
            elements.append(Spacer(1, 5*mm))
        
        # 씬별 요약 (압축된 테이블 형태)
        elements.append(Paragraph("씬별 구성", self.styles['CompactSection']))
        scene_table_data = self._create_compressed_scene_table(planning_data, summary_text)
        
        scene_table = Table(scene_table_data, colWidths=[1.5*cm, 3*cm, 8*cm, 5.5*cm])
        scene_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1631F8')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('TEXTCOLOR', (0, 1), (-1, -1), HexColor('#2c3e50')),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8f9fa')]),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(scene_table)
        
        # 제작 노트
        notes_match = re.search(r'5\.\s*\*\*제작 노트\*\*[:\s]*(.+)', summary_text, re.DOTALL)
        if notes_match:
            elements.append(Spacer(1, 5*mm))
            elements.append(Paragraph("제작 노트", self.styles['CompactSection']))
            elements.append(Paragraph(notes_match.group(1).strip(), self.styles['CompactBody']))
        
        return elements
    
    def _create_default_compressed_content(self, planning_data):
        """기본 압축 콘텐츠 생성 (LLM 실패 시)"""
        elements = []
        
        # 제목
        elements.append(Paragraph(planning_data.get('title', '영상 기획안'), self.styles['CompactTitle']))
        elements.append(Spacer(1, 5*mm))
        
        # 기본 정보 테이블
        elements.append(Paragraph("프로젝트 개요", self.styles['CompactSection']))
        
        info_data = []
        if planning_data.get('genre'):
            info_data.append(['장르', planning_data.get('genre', '-'), '타겟', planning_data.get('target', '-')])
        if planning_data.get('duration'):
            info_data.append(['러닝타임', planning_data.get('duration', '-'), '톤앤매너', planning_data.get('tone', '-')])
        if planning_data.get('purpose'):
            info_data.append(['제작목적', planning_data.get('purpose', '-'), '컨셉', planning_data.get('concept', '-')])
        
        if info_data:
            info_table = Table(info_data, colWidths=[3*cm, 6*cm, 3*cm, 6*cm])
            info_table.setStyle(self._get_compact_table_style())
            elements.append(info_table)
            elements.append(Spacer(1, 5*mm))
        
        # 스토리 요약
        if planning_data.get('stories'):
            elements.append(Paragraph("스토리 구성", self.styles['CompactSection']))
            story_data = [['단계', '내용']]
            for story in planning_data.get('stories', []):
                story_data.append([
                    story.get('stage', ''),
                    Paragraph(story.get('content', ''), self.styles['CompactTable'])
                ])
            
            story_table = Table(story_data, colWidths=[2*cm, 16*cm])
            story_table.setStyle(self._get_compact_table_style())
            elements.append(story_table)
            elements.append(Spacer(1, 5*mm))
        
        # 씬 정보 압축
        if planning_data.get('scenes'):
            elements.append(Paragraph("씬 구성", self.styles['CompactSection']))
            scene_data = [['#', '제목', '설명', '비고']]
            
            for idx, scene in enumerate(planning_data.get('scenes', [])):
                scene_data.append([
                    str(idx + 1),
                    scene.get('title', ''),
                    Paragraph(scene.get('description', '')[:100] + '...', self.styles['CompactTable']),
                    scene.get('duration', '')
                ])
            
            scene_table = Table(scene_data, colWidths=[1*cm, 3*cm, 11*cm, 3*cm])
            scene_table.setStyle(self._get_compact_table_style())
            elements.append(scene_table)
        
        return elements
    
    def _extract_spec_table(self, settings):
        """설정값을 테이블 데이터로 변환"""
        data = []
        
        # 기본 정보
        data.append(['장르', settings.get('genre', '-'), '타겟', settings.get('target', '-')])
        data.append(['러닝타임', settings.get('duration', '-'), '톤앤매너', settings.get('tone', '-')])
        data.append(['컨셉', settings.get('concept', '-'), '제작목적', settings.get('purpose', '-')])
        
        # 기술 사양
        data.append(['화면비율', settings.get('aspectRatio', '-'), '플랫폼', settings.get('platform', '-')])
        data.append(['색감', settings.get('colorTone', '-'), '편집스타일', settings.get('editingStyle', '-')])
        
        # 스토리 설정
        if settings.get('characterName'):
            data.append(['주인공', settings.get('characterName', '-'), '스토리전개', settings.get('storyFramework', '-')])
        
        return data
    
    def _create_compressed_scene_table(self, planning_data, summary_text):
        """압축된 씬 테이블 생성"""
        data = [['#', '씬 제목', '핵심 내용', '스토리보드']]
        
        # 씬별 핵심 포인트 추출
        scene_points = {}
        scene_match = re.search(r'4\.\s*\*\*씬별 핵심 포인트\*\*[:\s]*(.+?)(?=5\.|$)', summary_text, re.DOTALL)
        if scene_match:
            scene_text = scene_match.group(1)
            # 씬별로 파싱
            for line in scene_text.split('\n'):
                if '씬' in line and ':' in line:
                    match = re.search(r'씬\s*(\d+)[:\s]*(.+)', line)
                    if match:
                        scene_num = int(match.group(1))
                        scene_points[scene_num - 1] = match.group(2).strip()
        
        for idx, scene in enumerate(planning_data.get('scenes', [])):
            # 핵심 내용 (LLM 요약 또는 기본 설명)
            if idx in scene_points:
                core_content = scene_points[idx]
            else:
                core_content = scene.get('description', '')[:80] + '...'
            
            # 스토리보드 정보
            storyboard_info = '미생성'
            if scene.get('storyboard') and scene['storyboard'].get('image_url'):
                if scene['storyboard']['image_url'] != 'generated_image_placeholder':
                    storyboard_info = '생성완료'
            
            data.append([
                str(idx + 1),
                scene.get('title', f'씬 {idx + 1}'),
                Paragraph(core_content, self.styles['CompactTable']),
                storyboard_info
            ])
        
        return data
    
    def _get_compact_table_style(self):
        """압축된 테이블 스타일"""
        return TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'HYGothic-Medium'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('TEXTCOLOR', (0, 1), (-1, -1), HexColor('#2c3e50')),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e0e0e0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8f9fa')]),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ])
    
    def _add_header_footer(self, canvas, doc):
        """헤더와 푸터 추가"""
        canvas.saveState()
        
        # 헤더 - 작은 로고나 프로젝트명
        canvas.setFont('HYGothic-Medium', 8)
        canvas.setFillColor(HexColor('#7f8c8d'))
        canvas.drawString(self.margin, self.page_height - self.margin/2, "VideoPlanet")
        canvas.drawRightString(self.page_width - self.margin, self.page_height - self.margin/2, 
                              datetime.now().strftime('%Y.%m.%d'))
        
        # 푸터 - 페이지 번호
        canvas.drawCentredString(self.page_width/2, self.margin/2, f"- {doc.page} -")
        
        canvas.restoreState()