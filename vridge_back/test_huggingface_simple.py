import requests
import os
import json

# API 키 확인
api_key = os.environ.get('HUGGINGFACE_API_KEY', 'test-key-for-development')
print(f"API Key: {api_key[:20]}..." if len(api_key) > 20 else api_key)

# 간단한 테스트
url = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"
headers = {"Authorization": f"Bearer {api_key}"}
payload = {
    "inputs": "robot and human working together in office, storyboard sketch",
    "parameters": {
        "num_inference_steps": 20,
        "guidance_scale": 7.5
    }
}

print("\nSending request to Hugging Face...")
response = requests.post(url, headers=headers, json=payload)

print(f"Status Code: {response.status_code}")
print(f"Headers: {dict(response.headers)}")

if response.status_code == 200:
    print("Success! Image data received")
    print(f"Content length: {len(response.content)} bytes")
else:
    print("Error response:")
    try:
        error_data = response.json()
        print(json.dumps(error_data, indent=2))
    except:
        print(response.text[:500])