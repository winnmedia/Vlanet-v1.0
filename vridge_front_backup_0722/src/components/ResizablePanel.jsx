import React, { useState, useRef, useEffect } from 'react';
import './ResizablePanel.scss';

export default function ResizablePanel({ children, defaultWidth = 50, minWidth = 30, maxWidth = 70 }) {
  const [leftWidth, setLeftWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  const handleTouchMove = (e) => {
    if (!isResizing || !containerRef.current) return;

    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((touch.clientX - containerRect.left) / containerRect.width) * 100;
    
    if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleTouchEnd = () => {
    setIsResizing(false);
  };

  return (
    <div className="resizable-panel" ref={containerRef}>
      <div className="panel-left" style={{ width: `${leftWidth}%` }}>
        {children[0]}
      </div>
      
      <div 
        className={`resize-handle ${isResizing ? 'resizing' : ''}`}
        onMouseDown={() => setIsResizing(true)}
        onTouchStart={() => setIsResizing(true)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="handle-bar"></div>
      </div>
      
      <div className="panel-right" style={{ width: `${100 - leftWidth}%` }}>
        {children[1]}
      </div>
    </div>
  );
}