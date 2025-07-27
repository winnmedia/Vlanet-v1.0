/**
 * Feedback Grid Layout Test Suite
 * Q, the Gatekeeper of Truth - Zero Defect Testing
 * 
 * Test Objectives:
 * 1. Responsive grid layout behavior
 * 2. Button alignment and hover effects
 * 3. Layout stability across screen sizes
 * 4. Performance under stress conditions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import FeedbackManage from '../tasks/Feedback/FeedbackManage'
import FeedbackMore from '../tasks/Feedback/FeedbackMore'
import * as feedbackApi from '../api/feedback'

// Mock API
jest.mock('../api/feedback')

// Redux store setup
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      ProjectStore: (state = {
        user: 'test@example.com',
        ...initialState
      }) => state
    }
  })
}

// Mock data generator
const generateMockFeedback = (count = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    email: i % 3 === 0 ? 'test@example.com' : `user${i}@example.com`,
    nickname: `User${i}`,
    text: `Feedback content ${i} - This is a longer text to test text truncation and layout stability in grid cards.`,
    section: `00:${String(i).padStart(2, '0')}:00`,
    created: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    reaction: null,
    reaction_counts: { like: 0, dislike: 0, needExplanation: 0 },
    is_important: false,
    replies: []
  }))
}

describe('FeedbackManage Grid Layout Tests', () => {
  let mockStore

  beforeEach(() => {
    jest.clearAllMocks()
    mockStore = createMockStore()
    
    // Default API responses
    feedbackApi.DeleteFeedback.mockResolvedValue({ data: { success: true } })
    feedbackApi.UpdateFeedbackReaction.mockResolvedValue({ data: { success: true } })
    feedbackApi.CreateFeedbackReply.mockResolvedValue({ data: { success: true } })
    feedbackApi.ToggleFeedbackImportant.mockResolvedValue({ data: { success: true } })
    
    // Mock window methods
    window.alert = jest.fn()
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  })

  describe('1. Grid Layout Responsiveness', () => {
    test('1.1 Should render in grid layout with proper spacing', () => {
      const mockProject = {
        feedback: generateMockFeedback(6)
      }

      const { container } = render(
        <Provider store={mockStore}>
          <FeedbackManage 
            current_project={mockProject}
            user="test@example.com"
            refetch={jest.fn()}
            onTimeClick={jest.fn()}
          />
        </Provider>
      )

      // Check grid container exists
      const gridContainer = container.querySelector('.feedback-grid-container')
      expect(gridContainer).toBeInTheDocument()

      // Check grid layout
      const grid = container.querySelector('.feedback-grid')
      expect(grid).toBeInTheDocument()

      // Verify all feedback cards are rendered
      const cards = container.querySelectorAll('.feedback-card')
      expect(cards).toHaveLength(6)

      // Check card structure
      cards.forEach(card => {
        expect(card.querySelector('.card-header')).toBeInTheDocument()
        expect(card.querySelector('.card-content')).toBeInTheDocument()
        expect(card.querySelector('.card-actions')).toBeInTheDocument()
      })
    })

    test('1.2 Should handle empty state gracefully', () => {
      const mockProject = {
        feedback: []
      }

      const { container } = render(
        <Provider store={mockStore}>
          <FeedbackManage 
            current_project={mockProject}
            user="test@example.com"
            refetch={jest.fn()}
            onTimeClick={jest.fn()}
          />
        </Provider>
      )

      // Should show empty state
      expect(screen.getByText('피드백이 없습니다')).toBeInTheDocument()
      expect(screen.getByText('첫 번째 피드백을 남겨보세요')).toBeInTheDocument()

      // Empty state icon should be visible
      const emptyIcon = container.querySelector('.empty-state svg')
      expect(emptyIcon).toBeInTheDocument()
    })

    test('1.3 Should maintain layout with varying content lengths', () => {
      const mockProject = {
        feedback: [
          { id: 1, email: 'test@example.com', text: 'Short', section: '00:00:00' },
          { id: 2, email: 'test@example.com', text: 'A'.repeat(200), section: '00:01:00' },
          { id: 3, email: 'test@example.com', text: 'Medium length feedback content here', section: '00:02:00' }
        ]
      }

      const { container } = render(
        <Provider store={mockStore}>
          <FeedbackManage 
            current_project={mockProject}
            user="test@example.com"
            refetch={jest.fn()}
            onTimeClick={jest.fn()}
          />
        </Provider>
      )

      const cards = container.querySelectorAll('.feedback-card')
      expect(cards).toHaveLength(3)

      // All cards should have consistent height due to grid
      const cardHeights = Array.from(cards).map(card => card.offsetHeight)
      // In a proper grid, heights should be similar (allowing for content differences)
      expect(new Set(cardHeights).size).toBeLessThanOrEqual(2)
    })
  })

  describe('2. Button Alignment and Interactions', () => {
    test('2.1 Should align action buttons properly', () => {
      const mockProject = {
        feedback: generateMockFeedback(3)
      }

      const { container } = render(
        <Provider store={mockStore}>
          <FeedbackManage 
            current_project={mockProject}
            user="test@example.com"
            refetch={jest.fn()}
            onTimeClick={jest.fn()}
          />
        </Provider>
      )

      const actionGroups = container.querySelectorAll('.card-actions')
      
      actionGroups.forEach(group => {
        const buttons = group.querySelectorAll('.action-btn')
        expect(buttons).toHaveLength(5) // like, dislike, needExplanation, reply, important
        
        // Check button order
        expect(buttons[0]).toHaveClass('like')
        expect(buttons[1]).toHaveClass('dislike')
        expect(buttons[2]).toHaveClass('needExplanation')
        expect(buttons[3]).toHaveClass('reply')
        expect(buttons[4]).toHaveClass('important')
      })
    })

    test('2.2 Should handle reaction toggles correctly', async () => {
      const mockProject = {
        feedback: [{
          id: 1,
          email: 'test@example.com',
          text: 'Test feedback',
          section: '00:00:00',
          reaction: null,
          reaction_counts: { like: 0, dislike: 0, needExplanation: 0 }
        }]
      }

      render(
        <Provider store={mockStore}>
          <FeedbackManage 
            current_project={mockProject}
            user="test@example.com"
            refetch={jest.fn()}
            onTimeClick={jest.fn()}
          />
        </Provider>
      )

      const likeBtn = screen.getByText('좋아요').closest('button')
      
      // Click like button
      fireEvent.click(likeBtn)
      
      // Should add active class
      expect(likeBtn).toHaveClass('active')
      
      // API should be called
      expect(feedbackApi.UpdateFeedbackReaction).toHaveBeenCalledWith(1, 'like')
      
      // Click again to toggle off
      fireEvent.click(likeBtn)
      
      await waitFor(() => {
        expect(feedbackApi.UpdateFeedbackReaction).toHaveBeenCalledWith(1, null)
      })
    })

    test('2.3 Should show/hide reply input on button click', () => {
      const mockProject = {
        feedback: [{
          id: 1,
          email: 'test@example.com',
          text: 'Test feedback',
          section: '00:00:00'
        }]
      }

      render(
        <Provider store={mockStore}>
          <FeedbackManage 
            current_project={mockProject}
            user="test@example.com"
            refetch={jest.fn()}
            onTimeClick={jest.fn()}
          />
        </Provider>
      )

      const replyBtn = screen.getByText('답글').closest('button')
      
      // Initially no reply input
      expect(screen.queryByPlaceholderText('답글을 입력하세요...')).not.toBeInTheDocument()
      
      // Click to show
      fireEvent.click(replyBtn)
      expect(screen.getByPlaceholderText('답글을 입력하세요...')).toBeInTheDocument()
      
      // Click to hide
      fireEvent.click(replyBtn)
      expect(screen.queryByPlaceholderText('답글을 입력하세요...')).not.toBeInTheDocument()
    })
  })

  describe('3. Hover Effects and Visual Feedback', () => {
    test('3.1 Should show delete button on hover', () => {
      const mockProject = {
        feedback: [{
          id: 1,
          email: 'test@example.com',
          text: 'Test feedback',
          section: '00:00:00'
        }]
      }

      const { container } = render(
        <Provider store={mockStore}>
          <FeedbackManage 
            current_project={mockProject}
            user="test@example.com"
            refetch={jest.fn()}
            onTimeClick={jest.fn()}
          />
        </Provider>
      )

      const card = container.querySelector('.feedback-card')
      const deleteBtn = card.querySelector('.delete-btn')
      
      // Delete button should exist but be initially transparent
      expect(deleteBtn).toBeInTheDocument()
      
      // Simulate hover
      fireEvent.mouseEnter(card)
      
      // Note: CSS hover effects can't be fully tested in jsdom
      // but we verify the structure is correct
      expect(deleteBtn).toHaveAttribute('title', '삭제')
    })

    test('3.2 Should handle time badge click', () => {
      const onTimeClick = jest.fn()
      const mockProject = {
        feedback: [{
          id: 1,
          email: 'test@example.com',
          text: 'Test feedback',
          section: '00:05:30'
        }]
      }

      render(
        <Provider store={mockStore}>
          <FeedbackManage 
            current_project={mockProject}
            user="test@example.com"
            refetch={jest.fn()}
            onTimeClick={onTimeClick}
          />
        </Provider>
      )

      const timeBadge = screen.getByText('00:05:30')
      fireEvent.click(timeBadge)
      
      expect(onTimeClick).toHaveBeenCalledWith('00:05:30')
    })
  })

  describe('4. Stress Testing', () => {
    test('4.1 Should handle large number of feedbacks', () => {
      const mockProject = {
        feedback: generateMockFeedback(100)
      }

      const { container } = render(
        <Provider store={mockStore}>
          <FeedbackManage 
            current_project={mockProject}
            user="test@example.com"
            refetch={jest.fn()}
            onTimeClick={jest.fn()}
          />
        </Provider>
      )

      const cards = container.querySelectorAll('.feedback-card')
      expect(cards).toHaveLength(100)
      
      // Grid should maintain structure
      const grid = container.querySelector('.feedback-grid')
      expect(grid).toBeInTheDocument()
    })

    test('4.2 Should handle rapid button clicks', async () => {
      const mockProject = {
        feedback: [{
          id: 1,
          email: 'test@example.com',
          text: 'Test feedback',
          section: '00:00:00',
          reaction_counts: { like: 0, dislike: 0, needExplanation: 0 }
        }]
      }

      render(
        <Provider store={mockStore}>
          <FeedbackManage 
            current_project={mockProject}
            user="test@example.com"
            refetch={jest.fn()}
            onTimeClick={jest.fn()}
          />
        </Provider>
      )

      const likeBtn = screen.getByText('좋아요').closest('button')
      
      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(likeBtn)
      }
      
      // Should handle gracefully without errors
      // API calls should be debounced/managed
      await waitFor(() => {
        expect(feedbackApi.UpdateFeedbackReaction.mock.calls.length).toBeGreaterThan(0)
      })
    })
  })
})

describe('FeedbackMore Grid Layout Tests', () => {
  let mockStore

  beforeEach(() => {
    jest.clearAllMocks()
    mockStore = createMockStore()
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
  })

  describe('1. Date Grouping and Layout', () => {
    test('1.1 Should group feedbacks by date', () => {
      const mockProject = {
        feedback: [
          {
            id: 1,
            email: 'user1@example.com',
            text: 'Feedback 1',
            created: '2024-01-15T10:00:00Z'
          },
          {
            id: 2,
            email: 'user2@example.com',
            text: 'Feedback 2',
            created: '2024-01-15T14:00:00Z'
          },
          {
            id: 3,
            email: 'user3@example.com',
            text: 'Feedback 3',
            created: '2024-01-14T10:00:00Z'
          }
        ]
      }

      const { container } = render(
        <Provider store={mockStore}>
          <FeedbackMore 
            current_project={mockProject}
            onTimeClick={jest.fn()}
            onFeedbackSelect={jest.fn()}
          />
        </Provider>
      )

      // Should have 2 date groups
      const dateGroups = container.querySelectorAll('.feedback-date-group')
      expect(dateGroups).toHaveLength(2)
      
      // Check date headers exist
      const dateHeaders = container.querySelectorAll('.date-header')
      expect(dateHeaders).toHaveLength(2)
    })

    test('1.2 Should handle expandable content', () => {
      const onFeedbackSelect = jest.fn()
      const mockProject = {
        feedback: [{
          id: 1,
          email: 'user1@example.com',
          text: 'Long feedback content that should be expandable',
          section: '00:05:00',
          created: new Date().toISOString()
        }]
      }

      render(
        <Provider store={mockStore}>
          <FeedbackMore 
            current_project={mockProject}
            onTimeClick={jest.fn()}
            onFeedbackSelect={onFeedbackSelect}
          />
        </Provider>
      )

      const card = screen.getByText('Long feedback content that should be expandable').closest('.feedback-card')
      
      // Click to expand
      fireEvent.click(card)
      
      expect(onFeedbackSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 })
      )
    })
  })

  describe('2. Reaction Persistence', () => {
    test('2.1 Should persist reactions in localStorage', () => {
      const mockProject = {
        id: 'project123',
        feedback: [{
          id: 1,
          email: 'user1@example.com',
          text: 'Test feedback',
          created: new Date().toISOString()
        }]
      }

      render(
        <Provider store={mockStore}>
          <FeedbackMore 
            current_project={mockProject}
            onTimeClick={jest.fn()}
            onFeedbackSelect={jest.fn()}
          />
        </Provider>
      )

      const likeBtn = screen.getAllByText('👍')[0].closest('button')
      fireEvent.click(likeBtn)
      
      // Should save to localStorage
      expect(localStorage.setItem).toHaveBeenCalled()
      expect(localStorage.setItem.mock.calls[0][0]).toContain('feedback_reaction')
    })

    test('2.2 Should load reactions from localStorage', () => {
      window.localStorage.getItem.mockImplementation((key) => {
        if (key === 'feedback_reactions_project123') {
          return JSON.stringify({ '1_like': 2, '1_dislike': 1 })
        }
        return null
      })

      const mockProject = {
        id: 'project123',
        feedback: [{
          id: 1,
          email: 'user1@example.com',
          text: 'Test feedback',
          created: new Date().toISOString()
        }]
      }

      render(
        <Provider store={mockStore}>
          <FeedbackMore 
            current_project={mockProject}
            onTimeClick={jest.fn()}
            onFeedbackSelect={jest.fn()}
          />
        </Provider>
      )

      // Should show counts from localStorage
      expect(screen.getByText('2')).toBeInTheDocument() // like count
      expect(screen.getByText('1')).toBeInTheDocument() // dislike count
    })
  })

  describe('3. Performance and Edge Cases', () => {
    test('3.1 Should handle malformed feedback data', () => {
      const mockProject = {
        feedback: [
          { id: 1, created: new Date().toISOString() }, // Missing required fields
          { id: 2, email: 'test@example.com', created: new Date().toISOString() }, // Missing text
          { id: 3, text: 'test', created: null }, // Null created date
        ].filter(Boolean) // Remove null/undefined entries
      }

      const { container } = render(
        <Provider store={mockStore}>
          <FeedbackMore 
            current_project={mockProject}
            onTimeClick={jest.fn()}
            onFeedbackSelect={jest.fn()}
          />
        </Provider>
      )

      // Should render without crashing
      const cards = container.querySelectorAll('.feedback-card')
      expect(cards.length).toBeGreaterThan(0)
    })

    test('3.2 Should handle missing project data', () => {
      render(
        <Provider store={mockStore}>
          <FeedbackMore 
            current_project={null}
            onTimeClick={jest.fn()}
            onFeedbackSelect={jest.fn()}
          />
        </Provider>
      )

      // Should show empty state
      expect(screen.getByText('등록된 피드백이 없습니다')).toBeInTheDocument()
    })

    test('3.3 Should prevent event bubbling on time badge click', () => {
      const onTimeClick = jest.fn()
      const onFeedbackSelect = jest.fn()
      
      const mockProject = {
        feedback: [{
          id: 1,
          email: 'user1@example.com',
          text: 'Test feedback',
          section: '00:05:00',
          created: new Date().toISOString()
        }]
      }

      render(
        <Provider store={mockStore}>
          <FeedbackMore 
            current_project={mockProject}
            onTimeClick={onTimeClick}
            onFeedbackSelect={onFeedbackSelect}
          />
        </Provider>
      )

      const timeBadge = screen.getByText('00:05:00')
      fireEvent.click(timeBadge)
      
      // Should only call onTimeClick, not onFeedbackSelect
      expect(onTimeClick).toHaveBeenCalledWith('00:05:00')
      expect(onFeedbackSelect).not.toHaveBeenCalled()
    })
  })
})

describe('Grid Layout CSS Tests', () => {
  test('Should apply correct CSS classes', () => {
    const mockStore = createMockStore()
    const mockProject = {
      feedback: generateMockFeedback(3)
    }

    const { container } = render(
      <Provider store={mockStore}>
        <FeedbackManage 
          current_project={mockProject}
          user="test@example.com"
          refetch={jest.fn()}
          onTimeClick={jest.fn()}
        />
      </Provider>
    )

    // Check CSS classes are applied
    expect(container.querySelector('.feedback-grid-container')).toBeInTheDocument()
    expect(container.querySelector('.feedback-grid')).toBeInTheDocument()
    expect(container.querySelectorAll('.feedback-card')).toHaveLength(3)
    
    // Check nested structure
    const firstCard = container.querySelector('.feedback-card')
    expect(firstCard.querySelector('.card-header')).toBeInTheDocument()
    expect(firstCard.querySelector('.time-badge')).toBeInTheDocument()
    expect(firstCard.querySelector('.delete-btn')).toBeInTheDocument()
    expect(firstCard.querySelector('.card-content')).toBeInTheDocument()
    expect(firstCard.querySelector('.card-actions')).toBeInTheDocument()
  })
})