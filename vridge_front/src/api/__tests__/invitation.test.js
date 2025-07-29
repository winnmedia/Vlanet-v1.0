import * as invitationApi from '../invitation';
import axios from 'axios';

jest.mock('axios');

describe('invitation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('SendInvitation', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await invitationApi.SendInvitation();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(invitationApi.SendInvitation()).rejects.toThrow('API Error');
    });
  });

  describe('GetInvitations', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await invitationApi.GetInvitations();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(invitationApi.GetInvitations()).rejects.toThrow('API Error');
    });
  });

  describe('AcceptInvitation', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await invitationApi.AcceptInvitation();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(invitationApi.AcceptInvitation()).rejects.toThrow('API Error');
    });
  });

  describe('DeclineInvitation', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await invitationApi.DeclineInvitation();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(invitationApi.DeclineInvitation()).rejects.toThrow('API Error');
    });
  });
});