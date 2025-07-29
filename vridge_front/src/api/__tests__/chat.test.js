import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { Chat } from './chat';

jest.mock('axios');

describe('Chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('makes successful API call', async () => {
    const mockData = { success: true, data: {} };
    axios.get.mockResolvedValueOnce({ data: mockData });
    
    const result = await Chat();
    expect(result).toEqual(mockData);
  });

  test('handles API errors', async () => {
    const mockError = new Error('API Error');
    axios.get.mockRejectedValueOnce(mockError);
    
    await expect(Chat()).rejects.toThrow('API Error');
  });

  test('sends correct parameters', async () => {
    await Chat({ id: 1 });
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('1'));
  });
});