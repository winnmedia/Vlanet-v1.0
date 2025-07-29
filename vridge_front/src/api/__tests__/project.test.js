import * as projectApi from '../project';
import axios from 'axios';

jest.mock('axios');

describe('Project API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GetProjectList', () => {
    it('fetches project list successfully', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 1, name: 'Project 1' },
          { id: 2, name: 'Project 2' }
        ]
      };
      
      axios.get.mockResolvedValueOnce({ data: mockData });
      
      const result = await projectApi.GetProjectList();
      
      expect(axios.get).toHaveBeenCalledWith('/api/projects');
      expect(result).toEqual(mockData);
    });

    it('handles API error', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(projectApi.GetProjectList()).rejects.toThrow('Network error');
    });
  });

  describe('CreateProject', () => {
    it('creates project successfully', async () => {
      const projectData = {
        name: 'New Project',
        description: 'Test project'
      };
      
      const mockResponse = {
        success: true,
        data: { id: 3, ...projectData }
      };
      
      axios.post.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await projectApi.CreateProject(projectData);
      
      expect(axios.post).toHaveBeenCalledWith('/api/projects', projectData);
      expect(result).toEqual(mockResponse);
    });

    it('validates required fields', async () => {
      const invalidData = { name: '' };
      
      await expect(projectApi.CreateProject(invalidData))
        .rejects.toThrow('Project name is required');
    });
  });

  describe('UpdateProject', () => {
    it('updates project successfully', async () => {
      const projectId = 1;
      const updateData = { name: 'Updated Project' };
      
      const mockResponse = {
        success: true,
        data: { id: projectId, ...updateData }
      };
      
      axios.put.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await projectApi.UpdateProject(projectId, updateData);
      
      expect(axios.put).toHaveBeenCalledWith(`/api/projects/${projectId}`, updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DeleteProject', () => {
    it('deletes project successfully', async () => {
      const projectId = 1;
      
      const mockResponse = {
        success: true,
        message: 'Project deleted successfully'
      };
      
      axios.delete.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await projectApi.DeleteProject(projectId);
      
      expect(axios.delete).toHaveBeenCalledWith(`/api/projects/${projectId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('GetProjectDetail', () => {
    it('fetches project detail successfully', async () => {
      const projectId = 1;
      
      const mockResponse = {
        success: true,
        data: {
          id: projectId,
          name: 'Project 1',
          phases: []
        }
      };
      
      axios.get.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await projectApi.GetProjectDetail(projectId);
      
      expect(axios.get).toHaveBeenCalledWith(`/api/projects/${projectId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('UpdatePhase', () => {
    it('updates project phase successfully', async () => {
      const projectId = 1;
      const phaseData = {
        phase: 'filming',
        start_date: '2024-01-01',
        end_date: '2024-01-15'
      };
      
      const mockResponse = {
        success: true,
        data: { ...phaseData, completed: false }
      };
      
      axios.post.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await projectApi.UpdatePhase(projectId, phaseData);
      
      expect(axios.post).toHaveBeenCalledWith(
        `/api/projects/${projectId}/phases`,
        phaseData
      );
      expect(result).toEqual(mockResponse);
    });
  });
});