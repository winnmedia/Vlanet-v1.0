import * as feedbackApi from '../feedback';
import axios from 'axios';

jest.mock('axios');

describe('feedback API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('GetFeedbacks', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await feedbackApi.GetFeedbacks();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(feedbackApi.GetFeedbacks()).rejects.toThrow('API Error');
    });
  });

  describe('CreateFeedback', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await feedbackApi.CreateFeedback();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(feedbackApi.CreateFeedback()).rejects.toThrow('API Error');
    });
  });

  describe('UpdateFeedback', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await feedbackApi.UpdateFeedback();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(feedbackApi.UpdateFeedback()).rejects.toThrow('API Error');
    });
  });

  describe('DeleteFeedback', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.delete.mockResolvedValueOnce(mockResponse);
      
      const result = await feedbackApi.DeleteFeedback();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.delete.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(feedbackApi.DeleteFeedback()).rejects.toThrow('API Error');
    });
  });
});