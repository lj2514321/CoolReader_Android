import { useCallback, useRef } from 'react'

export interface SwipeConfig {
  threshold?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  enabled?: boolean
}

export default function useSwipe(config: SwipeConfig) {
  const { threshold = 50, onSwipeLeft, onSwipeRight, enabled = true } = config

  const onSwipeLeftRef = useRef(onSwipeLeft)
  const onSwipeRightRef = useRef(onSwipeRight)
  onSwipeLeftRef.current = onSwipeLeft
  onSwipeRightRef.current = onSwipeRight

  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const startTimeRef = useRef(0)
  const isSwipingRef = useRef(false)
  const lastSwipeTimeRef = useRef(0)

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return
    if (!window.getSelection()?.isCollapsed) return
    startXRef.current = e.touches[0].clientX
    startYRef.current = e.touches[0].clientY
    startTimeRef.current = Date.now()
    isSwipingRef.current = false
  }, [enabled])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return
    if (!window.getSelection()?.isCollapsed) return

    const deltaX = e.touches[0].clientX - startXRef.current
    const deltaY = e.touches[0].clientY - startYRef.current

    if (!isSwipingRef.current && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwipingRef.current = true
      e.preventDefault()
    }

    if (isSwipingRef.current) {
      e.preventDefault()
    }
  }, [enabled])

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return
    if (!window.getSelection()?.isCollapsed) return

    if (!isSwipingRef.current) return

    const deltaX = e.changedTouches[0].clientX - startXRef.current
    const deltaTime = Date.now() - startTimeRef.current

    if (Math.abs(deltaX) > threshold && deltaTime < 1000) {
      const now = Date.now()
      if (now - lastSwipeTimeRef.current < 300) return
      lastSwipeTimeRef.current = now

      if (deltaX < 0) {
        onSwipeLeftRef.current?.()
      } else {
        onSwipeRightRef.current?.()
      }
    }

    isSwipingRef.current = false
  }, [enabled, threshold])

  return { onTouchStart, onTouchMove, onTouchEnd }
}