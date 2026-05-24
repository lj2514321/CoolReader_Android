import { useState, useEffect, useRef } from 'react'

export interface KeyboardState {
  keyboardHeight: number
  isKeyboardVisible: boolean
}

/**
 * Detects on-screen keyboard visibility and height using window.visualViewport API.
 * Provides accurate keyboard height on iOS/Android by comparing current viewport
 * height to the initial viewport height at mount time.
 *
 * Edge cases handled:
 * - Rotation: initialHeight is re-captured on window resize (aspect ratio change)
 * - Keyboard hide: keyboardHeight returns to 0, isKeyboardVisible flips to false
 * - No keyboard: height difference stays ~0 or negligible
 */
export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    keyboardHeight: 0,
    isKeyboardVisible: false,
  })

  // Refs to avoid stale closures in event handler
  const initialHeightRef = useRef<number>(0)
  const aspectRef = useRef<number>(0) // width / height ratio for rotation detection

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) {
      // Fallback for environments without visualViewport (rare)
      setState({ keyboardHeight: 0, isKeyboardVisible: false })
      return
    }

    // Capture initial viewport dimensions on mount
    const captureInitial = () => {
      initialHeightRef.current = viewport.height
      aspectRef.current = viewport.width / viewport.height
    }
    captureInitial()

    const handleVisualViewportChange = () => {
      const currentHeight = viewport.height
      const currentAspect = viewport.width / currentHeight

      // Detect rotation: aspect ratio changed significantly (within 5% tolerance)
      const aspectDelta = Math.abs(currentAspect - aspectRef.current)
      if (aspectDelta > 0.05) {
        // Rotation occurred — reset initial height to new baseline
        initialHeightRef.current = currentHeight
        aspectRef.current = currentAspect
        setState({ keyboardHeight: 0, isKeyboardVisible: false })
        return
      }

      // Normal case: compute keyboard height from height delta
      const heightDelta = initialHeightRef.current - currentHeight

      // keyboardHeight is positive when keyboard is open (viewport shrunk)
      // Guard against negative values (e.g., viewport expanded, keyboard just closed)
      const keyboardHeight = Math.max(0, heightDelta)
      const isKeyboardVisible = keyboardHeight > 100

      setState({ keyboardHeight, isKeyboardVisible })
    }

    window.addEventListener('visualviewport', handleVisualViewportChange)
    return () => window.removeEventListener('visualviewport', handleVisualViewportChange)
  }, [])

  return state
}