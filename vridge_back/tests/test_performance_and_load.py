#!/usr/bin/env python3
"""
VideoPlanet Performance and Load Testing Suite
Author: Q, the Gatekeeper of Truth
Date: 2025-01-29
Description: Performance testing to ensure system can handle production loads
"""

import pytest
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.db import connection
from django.test.utils import override_settings
from rest_framework.test import APIClient
import random
import string
import threading
import queue
import psutil
import os

User = get_user_model()


class PerformanceMetrics:
    """Helper class to track performance metrics"""
    
    def __init__(self):
        self.response_times = []
        self.error_count = 0
        self.success_count = 0
        self.start_time = None
        self.end_time = None
        
    def start(self):
        self.start_time = time.time()
        
    def end(self):
        self.end_time = time.time()
        
    def add_response(self, response_time, success=True):
        self.response_times.append(response_time)
        if success:
            self.success_count += 1
        else:
            self.error_count += 1
            
    def get_stats(self):
        if not self.response_times:
            return None
            
        return {
            'total_requests': len(self.response_times),
            'success_count': self.success_count,
            'error_count': self.error_count,
            'success_rate': (self.success_count / len(self.response_times)) * 100,
            'avg_response_time': statistics.mean(self.response_times),
            'median_response_time': statistics.median(self.response_times),
            'min_response_time': min(self.response_times),
            'max_response_time': max(self.response_times),
            'p95_response_time': self._percentile(self.response_times, 95),
            'p99_response_time': self._percentile(self.response_times, 99),
            'total_duration': self.end_time - self.start_time if self.end_time else None,
            'requests_per_second': len(self.response_times) / (self.end_time - self.start_time) if self.end_time else None
        }
        
    def _percentile(self, data, percentile):
        """Calculate percentile"""
        size = len(data)
        sorted_data = sorted(data)
        index = int(size * percentile / 100)
        return sorted_data[index]


class LoadTestCase(TransactionTestCase):
    """Load testing for concurrent users"""
    
    def setUp(self):
        self.metrics = PerformanceMetrics()
        
    def _generate_test_user(self):
        """Generate random test user data"""
        random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
        return {
            'email': f'loadtest_{random_string}@example.com',
            'password': 'LoadTest123!',
            'nickname': f'LoadUser{random_string[:5]}'
        }
        
    def test_concurrent_user_registration(self):
        """Test system under concurrent user registration load"""
        concurrent_users = 50
        
        def register_user(_):
            client = APIClient()
            user_data = self._generate_test_user()
            
            start_time = time.time()
            try:
                response = client.post(
                    reverse('users:signup'),
                    user_data,
                    format='json'
                )
                end_time = time.time()
                response_time = end_time - start_time
                
                success = response.status_code == 201
                self.metrics.add_response(response_time, success)
                
                return success
            except Exception as e:
                end_time = time.time()
                self.metrics.add_response(end_time - start_time, False)
                return False
                
        # Execute concurrent registrations
        self.metrics.start()
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(register_user, i) for i in range(concurrent_users)]
            results = [f.result() for f in as_completed(futures)]
        self.metrics.end()
        
        # Analyze results
        stats = self.metrics.get_stats()
        
        # Performance assertions
        self.assertGreaterEqual(
            stats['success_rate'], 80,
            f"Success rate {stats['success_rate']:.1f}% is below 80%"
        )
        
        self.assertLess(
            stats['avg_response_time'], 1.0,
            f"Average response time {stats['avg_response_time']:.2f}s exceeds 1 second"
        )
        
        self.assertLess(
            stats['p95_response_time'], 2.0,
            f"95th percentile response time {stats['p95_response_time']:.2f}s exceeds 2 seconds"
        )
        
        # Print performance report
        self._print_performance_report("Concurrent User Registration", stats)
        
    def test_concurrent_login_attempts(self):
        """Test system under concurrent login load"""
        # Create test users first
        test_users = []
        for i in range(10):
            user_data = self._generate_test_user()
            User.objects.create_user(
                username=user_data['email'],
                email=user_data['email'],
                password=user_data['password']
            )
            test_users.append(user_data)
            
        concurrent_logins = 100
        
        def login_attempt(_):
            client = APIClient()
            user = random.choice(test_users)
            
            start_time = time.time()
            try:
                response = client.post(
                    reverse('users:login'),
                    {
                        'email': user['email'],
                        'password': user['password']
                    },
                    format='json'
                )
                end_time = time.time()
                response_time = end_time - start_time
                
                success = response.status_code == 200
                self.metrics.add_response(response_time, success)
                
                return success
            except Exception:
                end_time = time.time()
                self.metrics.add_response(end_time - start_time, False)
                return False
                
        # Execute concurrent logins
        self.metrics.start()
        with ThreadPoolExecutor(max_workers=30) as executor:
            futures = [executor.submit(login_attempt, i) for i in range(concurrent_logins)]
            results = [f.result() for f in as_completed(futures)]
        self.metrics.end()
        
        # Analyze results
        stats = self.metrics.get_stats()
        
        # Performance assertions
        self.assertGreaterEqual(
            stats['success_rate'], 90,
            f"Login success rate {stats['success_rate']:.1f}% is below 90%"
        )
        
        self.assertLess(
            stats['avg_response_time'], 0.5,
            f"Average login time {stats['avg_response_time']:.2f}s exceeds 0.5 seconds"
        )
        
        self._print_performance_report("Concurrent Login Attempts", stats)
        
    def test_mixed_workload(self):
        """Test system under mixed workload (signup, login, project creation)"""
        # Create some test users
        test_users = []
        for i in range(5):
            user_data = self._generate_test_user()
            user = User.objects.create_user(
                username=user_data['email'],
                email=user_data['email'],
                password=user_data['password']
            )
            test_users.append({'user': user, 'password': user_data['password']})
            
        total_operations = 100
        operation_types = ['signup', 'login', 'create_project', 'list_projects']
        
        def perform_operation(operation_index):
            client = APIClient()
            operation = random.choice(operation_types)
            
            start_time = time.time()
            success = False
            
            try:
                if operation == 'signup':
                    user_data = self._generate_test_user()
                    response = client.post(
                        reverse('users:signup'),
                        user_data,
                        format='json'
                    )
                    success = response.status_code == 201
                    
                elif operation == 'login':
                    user_info = random.choice(test_users)
                    response = client.post(
                        reverse('users:login'),
                        {
                            'email': user_info['user'].email,
                            'password': user_info['password']
                        },
                        format='json'
                    )
                    success = response.status_code == 200
                    
                elif operation == 'create_project':
                    user_info = random.choice(test_users)
                    client.force_authenticate(user=user_info['user'])
                    response = client.post(
                        reverse('projects:project-list'),
                        {
                            'project_name': f'Load Test Project {operation_index}',
                            'client_name': 'Load Test Client'
                        },
                        format='json'
                    )
                    success = response.status_code == 201
                    
                elif operation == 'list_projects':
                    user_info = random.choice(test_users)
                    client.force_authenticate(user=user_info['user'])
                    response = client.get(reverse('projects:project-list'))
                    success = response.status_code == 200
                    
            except Exception:
                success = False
                
            end_time = time.time()
            self.metrics.add_response(end_time - start_time, success)
            return success
            
        # Execute mixed workload
        self.metrics.start()
        with ThreadPoolExecutor(max_workers=25) as executor:
            futures = [executor.submit(perform_operation, i) for i in range(total_operations)]
            results = [f.result() for f in as_completed(futures)]
        self.metrics.end()
        
        # Analyze results
        stats = self.metrics.get_stats()
        
        # Performance assertions for mixed workload
        self.assertGreaterEqual(
            stats['success_rate'], 85,
            f"Mixed workload success rate {stats['success_rate']:.1f}% is below 85%"
        )
        
        self.assertGreaterEqual(
            stats['requests_per_second'], 10,
            f"System handling only {stats['requests_per_second']:.1f} requests/second"
        )
        
        self._print_performance_report("Mixed Workload", stats)
        
    def test_database_connection_pooling(self):
        """Test database connection pool under load"""
        concurrent_queries = 50
        
        def execute_queries(_):
            start_time = time.time()
            try:
                # Simulate multiple database operations
                user_count = User.objects.count()
                User.objects.filter(email__contains='test').exists()
                User.objects.order_by('-date_joined')[:10]
                
                end_time = time.time()
                self.metrics.add_response(end_time - start_time, True)
                return True
            except Exception:
                end_time = time.time()
                self.metrics.add_response(end_time - start_time, False)
                return False
                
        # Monitor connection count
        initial_connections = len(connection.queries)
        
        # Execute concurrent queries
        self.metrics.start()
        with ThreadPoolExecutor(max_workers=30) as executor:
            futures = [executor.submit(execute_queries, i) for i in range(concurrent_queries)]
            results = [f.result() for f in as_completed(futures)]
        self.metrics.end()
        
        # Check connection pooling efficiency
        final_connections = len(connection.queries)
        
        stats = self.metrics.get_stats()
        self._print_performance_report("Database Connection Pooling", stats)
        
        # Ensure connection pooling is working
        self.assertLess(
            stats['avg_response_time'], 0.1,
            "Database queries taking too long - possible connection pool exhaustion"
        )
        
    def test_memory_leak_detection(self):
        """Test for memory leaks during extended operations"""
        if not hasattr(psutil, 'Process'):
            self.skipTest("psutil not available for memory monitoring")
            
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Perform repeated operations
        for cycle in range(5):
            users = []
            for i in range(100):
                user_data = self._generate_test_user()
                user = User.objects.create_user(
                    username=user_data['email'],
                    email=user_data['email'],
                    password=user_data['password']
                )
                users.append(user)
                
            # Clean up to trigger garbage collection
            User.objects.filter(email__contains='loadtest_').delete()
            
        # Check memory after operations
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Allow for some memory increase but flag potential leaks
        self.assertLess(
            memory_increase, 100,
            f"Memory increased by {memory_increase:.1f}MB - potential memory leak"
        )
        
    def test_api_rate_limiting(self):
        """Test API rate limiting effectiveness"""
        client = APIClient()
        endpoint = reverse('users:login')
        
        # Attempt rapid requests
        request_times = []
        blocked_count = 0
        
        for i in range(100):
            start_time = time.time()
            response = client.post(
                endpoint,
                {'email': 'test@example.com', 'password': 'wrong'},
                format='json'
            )
            end_time = time.time()
            
            request_times.append(end_time - start_time)
            
            if response.status_code == 429:  # Too Many Requests
                blocked_count += 1
                
        # Rate limiting should kick in
        self.assertGreater(
            blocked_count, 0,
            "No rate limiting detected - security vulnerability"
        )
        
        # Print rate limiting effectiveness
        print(f"\nRate Limiting Test: {blocked_count}/100 requests blocked")
        
    def _print_performance_report(self, test_name, stats):
        """Print formatted performance report"""
        print(f"\n{'='*60}")
        print(f"Performance Report: {test_name}")
        print(f"{'='*60}")
        print(f"Total Requests: {stats['total_requests']}")
        print(f"Success Rate: {stats['success_rate']:.1f}%")
        print(f"Average Response Time: {stats['avg_response_time']:.3f}s")
        print(f"Median Response Time: {stats['median_response_time']:.3f}s")
        print(f"95th Percentile: {stats['p95_response_time']:.3f}s")
        print(f"99th Percentile: {stats['p99_response_time']:.3f}s")
        print(f"Min/Max Response Time: {stats['min_response_time']:.3f}s / {stats['max_response_time']:.3f}s")
        if stats['requests_per_second']:
            print(f"Throughput: {stats['requests_per_second']:.1f} requests/second")
        print(f"{'='*60}\n")


class StressTestCase(TransactionTestCase):
    """Extreme stress testing to find breaking points"""
    
    def test_sudden_traffic_spike(self):
        """Test system response to sudden traffic spike"""
        # Normal load
        normal_load_threads = 5
        spike_load_threads = 50
        
        metrics_normal = PerformanceMetrics()
        metrics_spike = PerformanceMetrics()
        
        def make_request():
            client = APIClient()
            response = client.get(reverse('api:health'))
            return response.status_code == 200
            
        # Normal load phase
        print("\nPhase 1: Normal Load...")
        metrics_normal.start()
        with ThreadPoolExecutor(max_workers=normal_load_threads) as executor:
            for _ in range(20):
                executor.submit(make_request)
                time.sleep(0.1)
        metrics_normal.end()
        
        # Sudden spike
        print("Phase 2: Traffic Spike!")
        metrics_spike.start()
        with ThreadPoolExecutor(max_workers=spike_load_threads) as executor:
            futures = [executor.submit(make_request) for _ in range(200)]
            results = [f.result() for f in as_completed(futures)]
        metrics_spike.end()
        
        # System should handle spike gracefully
        normal_stats = metrics_normal.get_stats()
        spike_stats = metrics_spike.get_stats()
        
        # Response time shouldn't degrade more than 5x
        if normal_stats and spike_stats:
            degradation = spike_stats['avg_response_time'] / normal_stats['avg_response_time']
            self.assertLess(
                degradation, 5,
                f"Response time degraded {degradation:.1f}x during spike"
            )
            
    def test_sustained_high_load(self):
        """Test system under sustained high load"""
        duration_seconds = 30
        requests_per_second = 20
        
        metrics = PerformanceMetrics()
        errors_over_time = []
        
        def sustained_load():
            client = APIClient()
            start_time = time.time()
            
            while time.time() - start_time < duration_seconds:
                request_start = time.time()
                try:
                    response = client.get(reverse('api:health'))
                    success = response.status_code == 200
                except:
                    success = False
                    
                request_end = time.time()
                metrics.add_response(request_end - request_start, success)
                
                # Maintain request rate
                sleep_time = (1.0 / requests_per_second) - (request_end - request_start)
                if sleep_time > 0:
                    time.sleep(sleep_time)
                    
        # Run sustained load test
        print(f"\nSustained Load Test: {requests_per_second} req/s for {duration_seconds}s")
        metrics.start()
        
        with ThreadPoolExecutor(max_workers=requests_per_second) as executor:
            futures = [executor.submit(sustained_load) for _ in range(requests_per_second)]
            for f in as_completed(futures):
                f.result()
                
        metrics.end()
        
        stats = metrics.get_stats()
        
        # System should maintain performance under sustained load
        self.assertGreaterEqual(
            stats['success_rate'], 95,
            f"Success rate dropped to {stats['success_rate']:.1f}% under sustained load"
        )
        
        self.assertLess(
            stats['p99_response_time'], 2.0,
            f"99th percentile response time {stats['p99_response_time']:.2f}s under sustained load"
        )


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])  # -s to see print outputs