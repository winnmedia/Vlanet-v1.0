import * as userApi from '../user';
import axios from 'axios';

jest.mock('axios');

describe('user API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('Login', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await userApi.Login();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(userApi.Login()).rejects.toThrow('API Error');
    });
  });

  describe('Signup', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await userApi.Signup();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(userApi.Signup()).rejects.toThrow('API Error');
    });
  });

  describe('GetUserInfo', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await userApi.GetUserInfo();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(userApi.GetUserInfo()).rejects.toThrow('API Error');
    });
  });

  describe('UpdateProfile', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await userApi.UpdateProfile();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(userApi.UpdateProfile()).rejects.toThrow('API Error');
    });
  });
});