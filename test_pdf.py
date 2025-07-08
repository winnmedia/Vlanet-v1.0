#!/usr/bin/env python3
import requests
import json

url = 'https://videoplanet.up.railway.app/api/video-planning/export/pdf/'
data = {
    'planning_data': {
        'title': '테스트 기획안',
        'planning_text': '테스트 내용',
        'stories': [{'phase': '기', 'content': '시작'}]
    }
}

try:
    response = requests.post(url, json=data, timeout=30)
    print('Status:', response.status_code)
    print('Content-Type:', response.headers.get('Content-Type'))
    print('Content-Length:', len(response.content), 'bytes')
    if response.status_code != 200:
        print('Response:', response.text[:500])
    else:
        print('PDF 다운로드 성공!')
except Exception as e:
    print('Error:', e)