'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

const COLLAPSED_KEY = 'finara-sidenav-collapsed'

interface SideNavContextValue {
  collapsed: boolean
  toggle: () => void
}

const SideNavContext = createContext<SideNavContextValue>({ collapsed: false, toggle: () => {} })

export function SideNavProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(COLLAPSED_KEY) === 'true') setCollapsed(true)
  }, [])

  // Sync CSS var so fixed-positioned children can react without JS
  useEffect(() => {
    document.documentElement.style.setProperty('--sidenav-w', collapsed ? '64px' : '256px')
  }, [collapsed])

  function toggle() {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSED_KEY, String(!v))
      return !v
    })
  }

  return (
    <SideNavContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SideNavContext.Provider>
  )
}

export function useSideNav() {
  return useContext(SideNavContext)
}
