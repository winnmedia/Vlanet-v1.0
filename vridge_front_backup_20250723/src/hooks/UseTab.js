import { useState } from 'react'

const useTab = (initialTab = 0) => {
  const [currentTab, setCurrentTab] = useState(initialTab)
  
  return {
    currentTab,
    changeTab: setCurrentTab,
  }
}

export default useTab
