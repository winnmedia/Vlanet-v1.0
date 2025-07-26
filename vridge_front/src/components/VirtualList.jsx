import React, { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { throttle } from '../utils/performance'
import styles from './VirtualList.module.scss'

const VirtualList = React.memo(({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  onScroll,
  getItemHeight,
  estimatedItemHeight = 50,
  scrollToIndex
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const scrollElementRef = useRef(null)
  const itemHeightCache = useRef({})
  const measuredHeight = useRef(0)
  
  // 동적 높이 지원
  const isVariableHeight = typeof getItemHeight === 'function'
  
  // 아이템 높이 가져오기
  const getHeight = useCallback((index) => {
    if (!isVariableHeight) return itemHeight
    
    if (itemHeightCache.current[index] !== undefined) {
      return itemHeightCache.current[index]
    }
    
    const height = getItemHeight(index) || estimatedItemHeight
    itemHeightCache.current[index] = height
    return height
  }, [isVariableHeight, itemHeight, getItemHeight, estimatedItemHeight])
  
  // 전체 높이 계산
  const getTotalHeight = useCallback(() => {
    if (!isVariableHeight) return items.length * itemHeight
    
    let total = 0
    for (let i = 0; i < items.length; i++) {
      total += getHeight(i)
    }
    return total
  }, [items.length, itemHeight, isVariableHeight, getHeight])
  
  // 아이템 위치 계산
  const getItemOffset = useCallback((index) => {
    if (!isVariableHeight) return index * itemHeight
    
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += getHeight(i)
    }
    return offset
  }, [isVariableHeight, itemHeight, getHeight])
  
  // 보이는 아이템 범위 계산
  const getVisibleRange = useCallback(() => {
    if (!containerHeight) return { start: 0, end: 0 }
    
    if (!isVariableHeight) {
      const start = Math.floor(scrollTop / itemHeight)
      const end = Math.ceil((scrollTop + containerHeight) / itemHeight)
      
      return {
        start: Math.max(0, start - overscan),
        end: Math.min(items.length - 1, end + overscan)
      }
    }
    
    // 동적 높이의 경우 이진 검색으로 시작 인덱스 찾기
    let start = 0
    let end = items.length - 1
    
    while (start < end) {
      const mid = Math.floor((start + end) / 2)
      const offset = getItemOffset(mid)
      
      if (offset < scrollTop) {
        start = mid + 1
      } else {
        end = mid
      }
    }
    
    // 끝 인덱스 찾기
    let visibleEnd = start
    let currentOffset = getItemOffset(start)
    
    while (visibleEnd < items.length && currentOffset < scrollTop + containerHeight) {
      currentOffset += getHeight(visibleEnd)
      visibleEnd++
    }
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, visibleEnd + overscan)
    }
  }, [scrollTop, containerHeight, items.length, itemHeight, overscan, isVariableHeight, getItemOffset, getHeight])
  
  // 스크롤 핸들러
  const handleScroll = useCallback(
    throttle((e) => {
      const newScrollTop = e.target.scrollTop
      setScrollTop(newScrollTop)
      
      if (onScroll) {
        onScroll(e)
      }
    }, 16), // 60fps
    [onScroll]
  )
  
  // 컨테이너 크기 감지
  useEffect(() => {
    const handleResize = () => {
      if (scrollElementRef.current) {
        setContainerHeight(scrollElementRef.current.clientHeight)
      }
    }
    
    handleResize()
    
    const resizeObserver = new ResizeObserver(handleResize)
    if (scrollElementRef.current) {
      resizeObserver.observe(scrollElementRef.current)
    }
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [])
  
  // scrollToIndex 지원
  useEffect(() => {
    if (scrollToIndex !== undefined && scrollElementRef.current) {
      const offset = getItemOffset(scrollToIndex)
      scrollElementRef.current.scrollTop = offset
    }
  }, [scrollToIndex, getItemOffset])
  
  const visibleRange = getVisibleRange()
  const totalHeight = getTotalHeight()
  
  // 렌더링할 아이템들
  const visibleItems = []
  for (let index = visibleRange.start; index <= visibleRange.end; index++) {
    if (index >= items.length) break
    
    const item = items[index]
    const itemOffset = getItemOffset(index)
    const height = getHeight(index)
    
    visibleItems.push(
      <div
        key={index}
        className={styles.listItem}
        style={{
          position: 'absolute',
          top: itemOffset,
          height: isVariableHeight ? 'auto' : height,
          minHeight: isVariableHeight ? height : undefined,
          left: 0,
          right: 0,
          willChange: 'transform'
        }}
      >
        {renderItem(item, index)}
      </div>
    )
  }
  
  return (
    <div
      ref={scrollElementRef}
      className={`${styles.virtualList} ${className}`}
      onScroll={handleScroll}
      tabIndex={0}
      role="list"
      aria-label="가상 스크롤 목록"
    >
      <div
        className={styles.listContainer}
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems}
      </div>
    </div>
  )
})

VirtualList.displayName = 'VirtualList'

VirtualList.propTypes = {
  items: PropTypes.array.isRequired,
  itemHeight: PropTypes.number,
  renderItem: PropTypes.func.isRequired,
  overscan: PropTypes.number,
  className: PropTypes.string,
  onScroll: PropTypes.func,
  getItemHeight: PropTypes.func,
  estimatedItemHeight: PropTypes.number,
  scrollToIndex: PropTypes.number
}

export default VirtualList

// 사용 예시를 위한 헬퍼 컴포넌트
export const VirtualListExample = () => {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `Description for item ${i}`
  }))
  
  const renderItem = (item) => (
    <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
      <h4>{item.name}</h4>
      <p>{item.description}</p>
    </div>
  )
  
  return (
    <VirtualList
      items={items}
      itemHeight={80}
      renderItem={renderItem}
      overscan={5}
    />
  )
}