import React, { useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from '@txkit/core'


type TabConfig = {
  id: string
  label: string
  content: ReactNode
}

type StoryTabsProps = {
  tabs: TabConfig[]
  defaultTab?: string
}

const StoryTabs: React.FC<StoryTabsProps> = ({ tabs, defaultTab }) => {
  const [ active, setActive ] = useState(defaultTab ?? tabs[0]?.id ?? '')
  const activeTab = tabs.find((tab) => tab.id === active)

  return (
    <div>
      <div className="story-tabs">
        {
          tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cx('story-tab', { active: tab.id === active })}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </button>
          ))
        }
      </div>
      {activeTab?.content}
    </div>
  )
}


export default StoryTabs
