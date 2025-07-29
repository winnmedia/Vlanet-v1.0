import * as notificationApi from '../notification';
import axios from 'axios';

jest.mock('axios');

describe('notification API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('GetNotifications', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await notificationApi.GetNotifications();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(notificationApi.GetNotifications()).rejects.toThrow('API Error');
    });
  });

  describe('MarkAsRead', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await notificationApi.MarkAsRead();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(notificationApi.MarkAsRead()).rejects.toThrow('API Error');
    });
  });

  describe('MarkAllAsRead', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await notificationApi.MarkAllAsRead();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(notificationApi.MarkAllAsRead()).rejects.toThrow('API Error');
    });
  });
});