import pytest


class TestSample:
    """Sample test to verify pytest is working"""
    
    def test_simple_addition(self):
        """Test that basic arithmetic works"""
        assert 1 + 1 == 2
    
    def test_string_concatenation(self):
        """Test string operations"""
        result = "Hello" + " " + "World"
        assert result == "Hello World"
    
    @pytest.mark.slow
    def test_marked_as_slow(self):
        """Test with custom marker"""
        # This test can be skipped with: pytest -m "not slow"
        assert True