import { AxiosError } from 'axios'
import { db as getDb } from './db'
import { HttpError } from './logic'
import { matchRoute } from './routes'

export const OFFLINE_KEY = 'gsh_mock_offline'
const delayMs = () => Number(import.meta.env.VITE_MOCK_DELAY ?? 350)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function parseBody(data) {
  if (!data) return {}
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const out = {}
    for (const [key, value] of data.entries()) {
      if (key.endsWith('[]')) (out[key.slice(0, -2)] ||= []).push(value)
      else out[key] = value
    }
    return out
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }
  return data
}

function respond(config, status, data) {
  return { data, status, statusText: String(status), headers: {}, config, request: {} }
}

function settle(config, res) {
  if (res.status >= 200 && res.status < 300) return res
  throw new AxiosError(`Request failed with status code ${res.status}`, res.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, {}, res)
}

// Pengganti jaringan: menjalankan "backend tiruan" di browser. Interceptor Axios (401/403, token) tetap bekerja normal.
export function createMockAdapter() {
  return async function mockAdapter(config) {
    await sleep(delayMs() * (0.6 + Math.random() * 0.8))

    if (typeof localStorage !== 'undefined' && localStorage.getItem(OFFLINE_KEY) === '1') {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)
    }

    const body = parseBody(config.data)
    let method = String(config.method || 'get').toUpperCase()
    if (method === 'POST' && typeof body._method === 'string') method = body._method.toUpperCase() // POST + _method=PUT
    const path = String(config.url || '').replace(config.baseURL || '', '').split('?')[0]

    const header = config.headers?.Authorization ?? config.headers?.get?.('Authorization') ?? ''
    const token = String(header).replace(/^Bearer\s+/i, '')
    const db = getDb()
    const user = token && db.tokens[token] ? db.users.find((u) => u.id === db.tokens[token]) : null

    const match = matchRoute(method, path)
    try {
      if (!match) throw new HttpError(404, { message: `Endpoint ${method} ${path} tidak tersedia di mode demo.` })
      const result = await match.handler({ method, path, params: match.params, query: config.params || {}, body, db, user: user?.status === 'aktif' ? user : null, token })
      const data = result.blob !== undefined ? (config.responseType === 'blob' ? result.blob : null) : result.body
      return settle(config, respond(config, result.status, data))
    } catch (e) {
      if (e instanceof HttpError) return settle(config, respond(config, e.status, e.body))
      throw e
    }
  }
}
