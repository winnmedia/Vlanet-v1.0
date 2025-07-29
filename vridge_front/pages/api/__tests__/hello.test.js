import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import handler from '../hello';

jest.mock('axios');

describe('Hello API handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns hello message', async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ name: 'John Doe' });
  });
});