import { axiosCredentials, checkSession, getCookie } from '../util';
import axios from 'axios';

jest.mock('axios');

describe('API Utilities Integration Tests', () => {
  test('axiosCredentials adds proper headers', async () => {
    const mockResponse = { data: { success: true } };
    axios.mockResolvedValueOnce(mockResponse);
    
    const result = await axiosCredentials('get', '/api/test');
    
    expect(axios).toHaveBeenCalledWith({
      method: 'get',
      url: expect.stringContaining('/api/test'),
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      })
    });
  });

  test('session management', () => {
    // Set cookie
    document.cookie = 'access_token=test123';
    
    expect(checkSession()).toBe(true);
    expect(getCookie('access_token')).toBe('test123');
    
    // Clear cookie
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    
    expect(checkSession()).toBe(false);
  });
});