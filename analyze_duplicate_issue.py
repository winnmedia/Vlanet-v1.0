#!/usr/bin/env python3
"""
Analyze potential root causes of duplicate project creation
"""

import os
import re
from collections import defaultdict

# Analysis results
findings = []

def check_frontend_issues():
    """Check frontend code for potential duplicate submission issues"""
    print("\n=== FRONTEND ANALYSIS ===")
    
    # 1. Check for multiple event listeners
    project_create_path = "/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/ProjectCreate.jsx"
    if os.path.exists(project_create_path):
        with open(project_create_path, 'r') as f:
            content = f.read()
            
        # Check for multiple onClick handlers
        onclick_count = content.count('onClick={CreateBtn}')
        if onclick_count > 1:
            findings.append(f"WARNING: Multiple onClick handlers found ({onclick_count})")
        
        # Check if isCreating state is properly used
        if 'disabled={isCreating}' in content:
            print("✓ Button is properly disabled during creation")
        else:
            findings.append("ERROR: Button not disabled during creation")
            
        # Check for proper cleanup
        if 'isMountedRef.current = false' in content:
            print("✓ Component cleanup is implemented")
        else:
            findings.append("WARNING: No component cleanup found")
    
    # 2. Check axios configuration
    axios_config_path = "/home/winnmedia/VideoPlanet/vridge_front/src/config/axios.js"
    if os.path.exists(axios_config_path):
        with open(axios_config_path, 'r') as f:
            content = f.read()
            
        # Check for retry logic
        if 'retry' in content.lower():
            findings.append("WARNING: Axios might have retry logic")
        else:
            print("✓ No explicit retry logic in axios config")
            
        # Check timeout settings
        timeout_match = re.search(r'timeout:\s*(\d+)', content)
        if timeout_match:
            timeout = int(timeout_match.group(1))
            print(f"✓ Axios timeout set to {timeout}ms")
            if timeout > 60000:
                findings.append(f"WARNING: Very long timeout ({timeout}ms) might cause issues")

def check_backend_issues():
    """Check backend code for potential duplicate creation issues"""
    print("\n=== BACKEND ANALYSIS ===")
    
    # 1. Check idempotency implementation
    idempotent_path = "/home/winnmedia/VideoPlanet/vridge_back/projects/views_idempotent.py"
    if os.path.exists(idempotent_path):
        with open(idempotent_path, 'r') as f:
            content = f.read()
            
        # Check cache implementation
        if 'cache.get(cache_key)' in content and 'cache.set(cache_key' in content:
            print("✓ Cache-based idempotency implemented")
            
            # Check for cache backend availability handling
            if 'try:' in content and 'cache' in content:
                print("✓ Cache operations have error handling")
            else:
                findings.append("WARNING: Cache operations might fail without proper error handling")
                
        # Check for recent duplicate prevention
        if 'created__gte=datetime.now() - timedelta(seconds=5)' in content:
            print("✓ Recent duplicate prevention (5 seconds) implemented")
        else:
            findings.append("WARNING: No time-based duplicate prevention")
            
        # Check transaction usage
        if 'with transaction.atomic():' in content:
            print("✓ Database transaction used for creation")
        else:
            findings.append("ERROR: No atomic transaction for project creation")
    
    # 2. Check cache configuration
    settings_paths = [
        "/home/winnmedia/VideoPlanet/vridge_back/config/settings_prod.py",
        "/home/winnmedia/VideoPlanet/vridge_back/config/settings_base.py"
    ]
    
    cache_configured = False
    for settings_path in settings_paths:
        if os.path.exists(settings_path):
            with open(settings_path, 'r') as f:
                content = f.read()
                if 'CACHES' in content:
                    cache_configured = True
                    if 'RedisCache' in content or 'redis' in content.lower():
                        print(f"✓ Redis cache configured in {os.path.basename(settings_path)}")
                    elif 'DummyCache' in content:
                        findings.append(f"ERROR: DummyCache found in {os.path.basename(settings_path)} - idempotency won't work!")
                    elif 'LocMemCache' in content:
                        findings.append(f"WARNING: LocMemCache in {os.path.basename(settings_path)} - won't work across processes")
    
    if not cache_configured:
        findings.append("ERROR: No cache backend configured - idempotency won't work!")

def check_infrastructure_issues():
    """Check for infrastructure-related issues"""
    print("\n=== INFRASTRUCTURE ANALYSIS ===")
    
    # Check for multiple domains
    domain_check_path = "/home/winnmedia/VideoPlanet/vridge_front/src/utils/domainCheck.js"
    if os.path.exists(domain_check_path):
        with open(domain_check_path, 'r') as f:
            content = f.read()
            
        domains = re.findall(r'[\'"]([a-zA-Z0-9.-]+\.(net|com|app))[\'"]', content)
        if len(set(domains)) > 1:
            findings.append(f"WARNING: Multiple domains detected: {set(domains)}")
            print(f"✓ Domain checking implemented for: {set(domains)}")
    
    # Check for CORS configuration
    cors_origins = []
    settings_paths = [
        "/home/winnmedia/VideoPlanet/vridge_back/config/settings_prod.py",
        "/home/winnmedia/VideoPlanet/vridge_back/config/settings_base.py"
    ]
    
    for settings_path in settings_paths:
        if os.path.exists(settings_path):
            with open(settings_path, 'r') as f:
                content = f.read()
                origins = re.findall(r'https?://[a-zA-Z0-9.-]+', content)
                cors_origins.extend(origins)
    
    if len(set(cors_origins)) > 2:
        findings.append(f"WARNING: Multiple CORS origins might cause issues: {set(cors_origins)}")

def check_race_conditions():
    """Check for potential race conditions"""
    print("\n=== RACE CONDITION ANALYSIS ===")
    
    # Check for async operations in frontend
    project_create_path = "/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/ProjectCreate.jsx"
    if os.path.exists(project_create_path):
        with open(project_create_path, 'r') as f:
            content = f.read()
            
        # Check for proper promise handling
        if '.then(' in content and '.catch(' in content:
            print("✓ Promise handling implemented")
            
            # Check for navigation before async operations complete
            if 'navigate(' in content:
                navigate_index = content.find('navigate(')
                then_index = content.rfind('.then(', 0, navigate_index)
                if then_index > 0:
                    findings.append("WARNING: Navigation might happen before async operations complete")

# Run all checks
check_frontend_issues()
check_backend_issues()
check_infrastructure_issues()
check_race_conditions()

# Summary
print("\n=== SUMMARY OF FINDINGS ===")
if findings:
    for i, finding in enumerate(findings, 1):
        print(f"{i}. {finding}")
else:
    print("No critical issues found!")

print("\n=== RECOMMENDATIONS ===")
print("1. Ensure Redis is properly configured and accessible in production")
print("2. Add request deduplication at the API gateway/load balancer level")
print("3. Implement client-side request tracking with unique request IDs")
print("4. Add database-level unique constraints with time windows")
print("5. Monitor and log all project creation attempts with detailed metadata")
print("6. Consider implementing a two-phase commit pattern for critical operations")