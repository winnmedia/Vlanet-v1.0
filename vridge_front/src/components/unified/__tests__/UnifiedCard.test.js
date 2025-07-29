import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnifiedCard from '../UnifiedCard';

describe('UnifiedCard', () => {
  it('renders card with children', () => {
    render(<UnifiedCard>Card content</UnifiedCard>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with title and description', () => {
    render(
      <UnifiedCard title="Card Title" description="Card description">
        Content
      </UnifiedCard>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
  });

  it('applies correct variant class', () => {
    render(<UnifiedCard variant="elevated">Content</UnifiedCard>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('elevated');
  });

  it('applies correct padding class', () => {
    render(<UnifiedCard padding="large">Content</UnifiedCard>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('padding-large');
  });

  it('handles click events when clickable', () => {
    const handleClick = jest.fn();
    render(
      <UnifiedCard clickable onClick={handleClick}>
        Clickable card
      </UnifiedCard>
    );
    
    fireEvent.click(screen.getByText('Clickable card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows selected state', () => {
    render(<UnifiedCard selected>Selected card</UnifiedCard>);
    const card = screen.getByText('Selected card').closest('div');
    expect(card).toHaveClass('selected');
  });

  it('disables interaction when disabled', () => {
    const handleClick = jest.fn();
    render(
      <UnifiedCard clickable disabled onClick={handleClick}>
        Disabled card
      </UnifiedCard>
    );
    
    fireEvent.click(screen.getByText('Disabled card'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<UnifiedCard loading>Loading card</UnifiedCard>);
    const card = screen.getByText('Loading card').closest('div');
    expect(card).toHaveClass('loading');
  });

  it('renders with header', () => {
    render(
      <UnifiedCard header={<div>Card Header</div>}>
        Content
      </UnifiedCard>
    );
    expect(screen.getByText('Card Header')).toBeInTheDocument();
  });

  it('renders with footer', () => {
    render(
      <UnifiedCard footer={<div>Card Footer</div>}>
        Content
      </UnifiedCard>
    );
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('renders with cover image', () => {
    render(
      <UnifiedCard cover="image.jpg">
        Content
      </UnifiedCard>
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'image.jpg');
  });

  it('applies hoverable class', () => {
    render(<UnifiedCard hoverable>Hoverable card</UnifiedCard>);
    const card = screen.getByText('Hoverable card').closest('div');
    expect(card).toHaveClass('hoverable');
  });
});