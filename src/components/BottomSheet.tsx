import React from 'react'

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  dark: boolean
  children: React.ReactNode
}

export function BottomSheet({ visible, onClose, dark, children }: BottomSheetProps) {
  const bg = dark ? '#1a1a2e' : '#f5f3fa'

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0,0,0,0.3)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 51,
          background: bg,
          borderRadius: '16px 16px 0 0',
          maxHeight: '70vh',
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* drag handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0 8px',
        }}>
          <div style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
          }} />
        </div>
        {children}
      </div>
    </>
  )
}