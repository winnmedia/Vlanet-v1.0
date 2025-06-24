"""
Performance optimization mixins for Django views
"""
from django.core.cache import cache
from django.db import models
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from rest_framework import status
from rest_framework.response import Response
import hashlib
import json


class CacheResponseMixin:
    """
    Mixin to add caching functionality to API views
    """
    cache_timeout = 60 * 15  # 15 minutes default
    cache_key_prefix = 'api'
    
    def get_cache_key(self, request, *args, **kwargs):
        """Generate cache key based on request parameters"""
        key_parts = [
            self.cache_key_prefix,
            request.path,
            request.user.id if request.user.is_authenticated else 'anonymous',
        ]
        
        # Add query parameters to cache key
        if request.GET:
            query_string = '&'.join([f'{k}={v}' for k, v in sorted(request.GET.items())])
            key_parts.append(hashlib.md5(query_string.encode()).hexdigest())
        
        return ':'.join(map(str, key_parts))
    
    def get_cached_response(self, request, *args, **kwargs):
        """Get response from cache if available"""
        cache_key = self.get_cache_key(request, *args, **kwargs)
        return cache.get(cache_key)
    
    def set_cached_response(self, request, response, *args, **kwargs):
        """Cache the response"""
        if response.status_code == status.HTTP_200_OK:
            cache_key = self.get_cache_key(request, *args, **kwargs)
            cache.set(cache_key, response.data, self.cache_timeout)


class OptimizedQueryMixin:
    """
    Mixin to optimize database queries
    """
    
    def get_optimized_queryset(self, queryset=None):
        """
        Apply common query optimizations
        """
        if queryset is None:
            queryset = self.get_queryset()
        
        # Select related fields to reduce database queries
        if hasattr(self, 'select_related_fields'):
            queryset = queryset.select_related(*self.select_related_fields)
        
        # Prefetch related fields
        if hasattr(self, 'prefetch_related_fields'):
            queryset = queryset.prefetch_related(*self.prefetch_related_fields)
        
        # Apply only() if specified
        if hasattr(self, 'only_fields'):
            queryset = queryset.only(*self.only_fields)
        
        return queryset


class BulkOperationMixin:
    """
    Mixin for efficient bulk operations
    """
    
    def bulk_create_objects(self, model_class, data_list, batch_size=1000):
        """
        Efficiently create multiple objects
        """
        objects = [model_class(**data) for data in data_list]
        return model_class.objects.bulk_create(objects, batch_size=batch_size)
    
    def bulk_update_objects(self, queryset, data_dict, batch_size=1000):
        """
        Efficiently update multiple objects
        """
        return queryset.bulk_update(data_dict, batch_size=batch_size)


class APIResponseMixin:
    """
    Standardized API response format
    """
    
    def success_response(self, data=None, message="Success", status_code=status.HTTP_200_OK):
        """Return standardized success response"""
        response_data = {
            "success": True,
            "message": message,
            "data": data
        }
        return Response(response_data, status=status_code)
    
    def error_response(self, message="Error occurred", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        """Return standardized error response"""
        response_data = {
            "success": False,
            "message": message,
            "errors": errors
        }
        return Response(response_data, status=status_code)


class PaginationMixin:
    """
    Enhanced pagination mixin
    """
    
    def get_paginated_response_data(self, queryset):
        """Get paginated data with metadata"""
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_response = self.get_paginated_response(serializer.data)
            return {
                "results": serializer.data,
                "pagination": {
                    "count": paginated_response.data.get("count"),
                    "next": paginated_response.data.get("next"),
                    "previous": paginated_response.data.get("previous"),
                    "page_size": self.paginator.page_size,
                    "total_pages": paginated_response.data.get("count", 0) // self.paginator.page_size + 1
                }
            }
        
        serializer = self.get_serializer(queryset, many=True)
        return {"results": serializer.data, "pagination": None}