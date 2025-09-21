import { useState, useCallback } from 'react'

interface UseDrawerOptions {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

interface DrawerState {
  isOpen: boolean
  data?: any
}

export const useDrawer = <T = any>(options: UseDrawerOptions = {}) => {
  const { defaultOpen = false, onOpenChange } = options

  const [state, setState] = useState<DrawerState>({
    isOpen: defaultOpen,
    data: undefined
  })

  const open = useCallback(
    (data?: T) => {
      setState({ isOpen: true, data })
      onOpenChange?.(true)
    },
    [onOpenChange]
  )

  const close = useCallback(() => {
    setState({ isOpen: false, data: undefined })
    onOpenChange?.(false)
  }, [onOpenChange])

  const toggle = useCallback(
    (data?: T) => {
      setState((prev) => ({
        isOpen: !prev.isOpen,
        data: prev.isOpen ? undefined : data
      }))
      onOpenChange?.(!state.isOpen)
    },
    [onOpenChange, state.isOpen]
  )

  return {
    isOpen: state.isOpen,
    data: state.data as T,
    open,
    close,
    toggle
  }
}
