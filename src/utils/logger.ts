/**
 * Lightweight logger that mirrors the API surface used by the source project
 * (coolreader v1.5.x). We deliberately keep this tiny — no transports, no
 * child loggers — so the mobile bundle stays small while still offering a
 * single point of control for log-level gating in development.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const isDev = typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV

function emit(level: Level, args: unknown[]): void {
  // In production builds, suppress debug/info noise. warn/error always show
  // so we never miss a real failure.
  if (!isDev && (level === 'debug' || level === 'info')) return
  const tag = `[coolreader]`
  ;(console[level] || console.log)(tag, ...args)
}

export const logger = {
  debug: (...args: unknown[]) => emit('debug', args),
  info: (...args: unknown[]) => emit('info', args),
  warn: (...args: unknown[]) => emit('warn', args),
  error: (...args: unknown[]) => emit('error', args),
}
