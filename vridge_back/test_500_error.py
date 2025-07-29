#!/usr/bin/env python3
"""500 에러 재현 테스트"""
import requests
import json

def test_various_scenarios():
    """다양한 시나리오로 500 에러 재현 시도"""
    
    base_url = "http://localhost:8000/api/users/signup/"
    
    test_cases = [
        {
            "name": "Empty data",
            "data": {}
        },
        {
            "name": "Missing email",
            "data": {"nickname": "Test", "password": "Pass123!"}
        },
        {
            "name": "Invalid email format",
            "data": {"email": "notanemail", "nickname": "Test", "password": "Pass123!"}
        },
        {
            "name": "Very long email",
            "data": {"email": "a" * 300 + "@test.com", "nickname": "Test", "password": "Pass123!"}
        },
        {
            "name": "Special characters in nickname",
            "data": {"email": "test@example.com", "nickname": "Test<script>alert('xss')</script>", "password": "Pass123!"}
        },
        {
            "name": "Null values",
            "data": {"email": None, "nickname": None, "password": None}
        },
        {
            "name": "Very long password",
            "data": {"email": "test@example.com", "nickname": "Test", "password": "a" * 1000}
        },
        {
            "name": "SQL Injection attempt",
            "data": {"email": "test'; DROP TABLE users_user; --", "nickname": "SQLTest", "password": "Pass123!"}
        },
        {
            "name": "Unicode characters",
            "data": {"email": "test@example.com", "nickname": "테스트😀", "password": "Pass123!"}
        },
        {
            "name": "JSON within JSON",
            "data": {"email": "test@example.com", "nickname": {"nested": "object"}, "password": "Pass123!"}
        }
    ]
    
    print("Testing various scenarios to reproduce 500 error...\n")
    
    for test in test_cases:
        print(f"Test: {test['name']}")
        print(f"Data: {test['data']}")
        
        try:
            response = requests.post(
                base_url,
                json=test['data'],
                timeout=5
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 500:
                print("🔴 500 ERROR FOUND!")
                print(f"Response: {response.text[:500]}")
            else:
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response (text): {response.text[:200]}")
                    
        except Exception as e:
            print(f"Request failed: {e}")
            
        print("-" * 80)
        print()

if __name__ == "__main__":
    test_various_scenarios()