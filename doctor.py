#!/usr/bin/env python3
"""
VideoPlanet Doctor - Diagnostic tool to check and fix common issues
"""
import os
import sys
import subprocess
import json
import socket
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ {text}{Colors.ENDC}")

def check_port(port):
    """Check if a port is open"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0

def run_command(cmd, cwd=None):
    """Run a command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_servers():
    """Check if servers are running"""
    print_header("Server Status Check")
    
    # Check Django
    if check_port(8000):
        print_success("Django server is running on port 8000")
    else:
        print_error("Django server is NOT running on port 8000")
        print_info("Start with: cd vridge_back && python3 manage.py runserver --settings=config.settings_dev")
    
    # Check React
    if check_port(3000):
        print_success("React server is running on port 3000")
    else:
        print_error("React server is NOT running on port 3000")
        print_info("Start with: cd vridge_front && npm start")

def check_environment():
    """Check environment setup"""
    print_header("Environment Check")
    
    # Check Python
    success, out, _ = run_command("python3 --version")
    if success:
        print_success(f"Python installed: {out.strip()}")
    else:
        print_error("Python3 not found")
    
    # Check Node
    success, out, _ = run_command("node --version")
    if success:
        print_success(f"Node.js installed: {out.strip()}")
    else:
        print_error("Node.js not found")
    
    # Check npm
    success, out, _ = run_command("npm --version")
    if success:
        print_success(f"npm installed: {out.strip()}")
    else:
        print_error("npm not found")

def check_django_setup():
    """Check Django configuration"""
    print_header("Django Configuration Check")
    
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings_dev'
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'vridge_back'))
    
    try:
        import django
        django.setup()
        print_success("Django setup successful")
        
        # Check database
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print_success("Database connection successful")
        
        # Check users
        from users.models import User
        user_count = User.objects.count()
        print_success(f"Found {user_count} users in database")
        
        # Check test user
        test_user = User.objects.filter(username="test@example.com").first()
        if test_user:
            print_success("Test user exists: test@example.com")
        else:
            print_warning("Test user not found")
            
    except Exception as e:
        print_error(f"Django setup failed: {e}")

def check_frontend_config():
    """Check frontend configuration"""
    print_header("Frontend Configuration Check")
    
    # Check .env file
    env_path = Path("vridge_front/.env")
    if env_path.exists():
        print_success(".env file exists")
        with open(env_path) as f:
            content = f.read()
            if "REACT_APP_BACKEND_URI=http://localhost:8000" in content:
                print_success("Backend URL correctly set to localhost:8000")
            else:
                print_warning("Backend URL not set to localhost:8000")
    else:
        print_error(".env file not found")
    
    # Check package.json proxy
    package_path = Path("vridge_front/package.json")
    if package_path.exists():
        with open(package_path) as f:
            package = json.load(f)
            if package.get("proxy") == "http://localhost:8000":
                print_success("Proxy correctly configured in package.json")
            else:
                print_error("Proxy not configured in package.json")

def test_api():
    """Test API endpoints"""
    print_header("API Test")
    
    import requests
    
    # Test login
    try:
        response = requests.post(
            "http://localhost:8000/users/login",
            json={"email": "test@example.com", "password": "test1234"},
            timeout=5
        )
        if response.status_code == 201:
            print_success("Login API working")
            data = response.json()
            if 'vridge_session' in data:
                print_success("JWT token generated successfully")
            else:
                print_error("JWT token not found in response")
        else:
            print_error(f"Login failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Cannot connect to API: {e}")

def provide_solutions():
    """Provide solutions for common issues"""
    print_header("Quick Fix Commands")
    
    print_info("1. Start Django server:")
    print("   cd vridge_back")
    print("   python3 manage.py runserver 0.0.0.0:8000 --settings=config.settings_dev")
    
    print_info("\n2. Start React server:")
    print("   cd vridge_front")
    print("   npm start")
    
    print_info("\n3. Create/Reset test user:")
    print("   cd vridge_back")
    print("   python3 reset_password.py")
    
    print_info("\n4. Test login credentials:")
    print("   Email: test@example.com")
    print("   Password: test1234")
    
    print_info("\n5. Clear browser cache:")
    print("   - Open Chrome DevTools (F12)")
    print("   - Right-click the refresh button")
    print("   - Select 'Empty Cache and Hard Reload'")

def main():
    print_header("VideoPlanet Doctor v1.0")
    
    check_environment()
    check_servers()
    check_django_setup()
    check_frontend_config()
    test_api()
    provide_solutions()
    
    print_header("Diagnosis Complete")

if __name__ == "__main__":
    main()