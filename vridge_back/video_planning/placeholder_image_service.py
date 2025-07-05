import logging
import base64
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO

logger = logging.getLogger(__name__)


class PlaceholderImageService:
    """
    실제 이미지 생성이 불가능할 때 사용하는 플레이스홀더 이미지 서비스
    """
    
    def __init__(self):
        self.available = True
        logger.info("Placeholder image service initialized")
    
    def generate_storyboard_image(self, frame_data):
        """
        텍스트 기반 플레이스홀더 이미지를 생성합니다.
        """
        try:
            # 16:9 비율로 이미지 생성
            width, height = 768, 432
            
            # 배경색 (연한 회색)
            background_color = (240, 240, 240)
            
            # 이미지 생성
            img = Image.new('RGB', (width, height), background_color)
            draw = ImageDraw.Draw(img)
            
            # 프레임 정보 추출
            frame_number = frame_data.get('frame_number', 0)
            title = frame_data.get('title', '제목 없음')
            visual_desc = frame_data.get('visual_description', '설명 없음')
            
            # 테두리 그리기
            border_color = (200, 200, 200)
            draw.rectangle([0, 0, width-1, height-1], outline=border_color, width=3)
            
            # 텍스트 색상
            text_color = (50, 50, 50)
            
            # 텍스트 표시
            try:
                # 기본 폰트 사용
                # 제목 (상단)
                draw.text((20, 40), title, fill=text_color)
                
                # 설명 (중앙)
                # 긴 텍스트를 여러 줄로 나누기
                max_width = width - 40
                words = visual_desc.split()
                lines = []
                current_line = []
                
                for word in words:
                    current_line.append(word)
                    test_line = ' '.join(current_line)
                    # 간단한 너비 추정 (글자당 8픽셀)
                    if len(test_line) * 8 > max_width:
                        if len(current_line) > 1:
                            current_line.pop()
                            lines.append(' '.join(current_line))
                            current_line = [word]
                        else:
                            lines.append(test_line)
                            current_line = []
                
                if current_line:
                    lines.append(' '.join(current_line))
                
                # 텍스트 그리기
                y_offset = height // 2 - (len(lines) * 20) // 2
                for i, line in enumerate(lines[:5]):  # 최대 5줄
                    draw.text((20, y_offset + i * 25), line, fill=text_color)
                
                # 하단에 "STORYBOARD" 워터마크
                draw.text((width - 120, height - 30), "STORYBOARD", fill=(180, 180, 180))
                
            except Exception as e:
                logger.warning(f"Error drawing text: {e}")
                # 폰트 오류 시 기본 사각형만 그림
                draw.rectangle([20, 20, width-20, height-20], outline=text_color, width=2)
            
            # 이미지를 base64로 인코딩
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            image_bytes = buffer.getvalue()
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            image_url = f"data:image/png;base64,{image_base64}"
            
            return {
                "success": True,
                "image_url": image_url,
                "prompt_used": f"Placeholder for: {visual_desc}",
                "is_placeholder": True
            }
            
        except Exception as e:
            logger.error(f"Error generating placeholder image: {str(e)}")
            return {
                "success": False,
                "error": f"플레이스홀더 이미지 생성 실패: {str(e)}",
                "image_url": None
            }