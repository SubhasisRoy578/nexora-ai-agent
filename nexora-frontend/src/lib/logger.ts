export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const SENSITIVE_KEYS = ['token', 'authorization', 'password', 'secret', 'key']

/**
 * Recursively scrubs sensitive values from an object before logging.
 */
function scrubData(data: any): any {
  if (!data) return data
  
  if (typeof data === 'string') {
    // Basic regex to scrub bearer tokens
    return data.replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/g, 'Bearer [REDACTED]')
  }

  if (Array.isArray(data)) {
    return data.map(scrubData)
  }

  if (typeof data === 'object') {
    const scrubbed: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
        scrubbed[key] = '[REDACTED]'
      } else {
        scrubbed[key] = scrubData(value)
      }
    }
    return scrubbed
  }

  return data
}

/**
 * Safe production logger that prevents secrets from leaking to console or monitoring tools.
 */
export const logger = {
  log: (level: LogLevel, message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const scrubbedData = data ? scrubData(data) : undefined
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...(scrubbedData && { data: scrubbedData })
    }

    // In production, we typically don't want to log debug or info to the client console,
    // but for Nexora we'll output structured JSON that a monitoring tool can ingest.
    if (process.env.NODE_ENV === 'production') {
      if (level === 'error' || level === 'warn') {
        // Strip stack traces in production to prevent source code structure leakage
        if (logEntry.data instanceof Error) {
          logEntry.data = { message: logEntry.data.message, name: logEntry.data.name }
        }
        console[level](JSON.stringify(logEntry))
      }
    } else {
      // In development, standard console output is fine (but still scrubbed)
      console[level](`[${level.toUpperCase()}] ${message}`, scrubbedData ?? '')
    }
  },
  info: (msg: string, data?: any) => logger.log('info', msg, data),
  warn: (msg: string, data?: any) => logger.log('warn', msg, data),
  error: (msg: string, data?: any) => logger.log('error', msg, data),
  debug: (msg: string, data?: any) => logger.log('debug', msg, data),
}
