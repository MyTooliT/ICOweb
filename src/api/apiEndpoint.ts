/**
 * Address of the ICOapi.
 *
 * Priority (per field): override entered by the user (localStorage) >
 * `VITE_API_*` environment variables > same origin as the web page.
 */
export const API_ENDPOINT_STORAGE_KEY = 'icoweb.apiEndpoint'

export type ApiProtocol = 'http' | 'https'

export interface ApiEndpoint {
  protocol: ApiProtocol
  hostname: string
  /** Empty: default port of the protocol */
  port: string
}

function parseProtocol(value: unknown): ApiProtocol | undefined {
  return value === 'http' || value === 'https' ? value : undefined
}

/** The override of the user, if there is a valid one */
export function getApiEndpointOverride(): ApiEndpoint | null {
  try {
    const raw = window.localStorage.getItem(API_ENDPOINT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const protocol = parseProtocol(parsed?.protocol)
    const hostname = typeof parsed?.hostname === 'string' ? parsed.hostname.trim() : ''
    const port = parsed?.port === undefined || parsed?.port === null
      ? ''
      : String(parsed.port).trim()
    if (!protocol || !hostname) return null
    return { protocol, hostname, port }
  } catch {
    return null
  }
}

/** The address defined by the environment (`.env`) or, without, the page itself */
export function getDefaultApiEndpoint(): ApiEndpoint {
  const envHost = import.meta.env.VITE_API_HOSTNAME?.toString().trim()
  if (envHost) {
    return {
      protocol: parseProtocol(import.meta.env.VITE_API_PROTOCOL) ?? 'http',
      hostname: envHost,
      port: import.meta.env.VITE_API_PORT?.toString().trim() ?? ''
    }
  }
  const { protocol, hostname, port } = window.location
  return {
    protocol: protocol === 'https:' ? 'https' : 'http',
    hostname,
    port
  }
}

/** The address that is used right now */
export function getApiEndpoint(): ApiEndpoint {
  return getApiEndpointOverride() ?? getDefaultApiEndpoint()
}

/** Whether the address differs from the default of the environment */
export function hasApiEndpointOverride(): boolean {
  return getApiEndpointOverride() !== null
}

/** Check an address. Returns an error message or `null` if it is valid. */
export function validateApiEndpoint(endpoint: ApiEndpoint): string | null {
  const hostname = endpoint.hostname.trim()
  if (!hostname) return 'Enter a hostname.'
  if (/[\s/@?#]/.test(hostname) || hostname.includes('://')) {
    return 'The hostname must not contain a protocol, path or spaces.'
  }
  if (endpoint.port.trim() !== '') {
    const port = Number(endpoint.port)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return 'The port must be a number between 1 and 65535.'
    }
  }
  if (window.location.protocol === 'https:' && endpoint.protocol === 'http' && !getProxyPrefix()) {
    return 'This page is served via https. Browsers block http requests from it.'
  }
  return null
}

/**
 * Remove everything persisted in the browser (stores for hardware,
 * measurements, ADC, ...) except the chosen API address.
 */
export function clearStoredState() {
  try {
    const storage = window.localStorage
    const endpoint = storage.getItem(API_ENDPOINT_STORAGE_KEY)
    storage.clear()
    if (endpoint !== null) storage.setItem(API_ENDPOINT_STORAGE_KEY, endpoint)
  } catch {
    // No storage, nothing to clear
  }
}

/**
 * Store the override and reload.
 *
 * Another API is another machine, so all persisted state (devices,
 * measurements, ...) of the previous one is dropped.
 */
export function applyApiEndpoint(endpoint: ApiEndpoint) {
  const value: ApiEndpoint = {
    protocol: endpoint.protocol,
    hostname: endpoint.hostname.trim(),
    port: endpoint.port.trim()
  }
  try {
    window.localStorage.clear()
    window.localStorage.setItem(API_ENDPOINT_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Without storage the override cannot be kept
  }
  window.location.reload()
}

/** Remove the override (back to the default of the environment) and reload */
export function resetApiEndpoint() {
  try {
    // Also drops the persisted state of the machine of the override
    window.localStorage.clear()
  } catch {
    // Nothing stored, nothing to remove
  }
  window.location.reload()
}

function authority({ hostname, port }: ApiEndpoint): string {
  // IPv6 literals need brackets in a URL
  const host = hostname.includes(':') && !hostname.startsWith('[') ? `[${hostname}]` : hostname
  return port ? `${host}:${port}` : host
}

function version(): string {
  return import.meta.env.VITE_API_VERSION || 'v1'
}

/**
 * Path prefix of the reverse proxy of the ICOweb server (`VITE_API_PROXY_PREFIX`,
 * e.g. `/proxy`), or `null` if there is none.
 */
export function getProxyPrefix(): string | null {
  const prefix = import.meta.env.VITE_API_PROXY_PREFIX?.toString().trim().replace(/^\/+|\/+$/g, '')
  return prefix ? `/${prefix}` : null
}

/**
 * Whether requests go through the proxy of the ICOweb server.
 *
 * With a proxy prefix, an `http` API on another host is reached via the
 * server of the page, which forwards to it. That is required from an `https`
 * page (browsers block `http`/`ws` requests from it) and, from an `http` page,
 * keeps everything same-origin, so the API needs no CORS setup.
 */
export function isProxied(endpoint: ApiEndpoint = getApiEndpoint()): boolean {
  if (getProxyPrefix() === null || endpoint.protocol !== 'http') return false
  // The API of the server of the page itself needs no proxy
  const samePage = window.location.protocol === 'http:'
    && authority(endpoint) === window.location.host
  return !samePage
}

export function buildApiLink(endpoint: ApiEndpoint = getApiEndpoint()): string {
  if (isProxied(endpoint)) {
    return `${window.location.origin}${getProxyPrefix()}/${authority(endpoint)}/api/${version()}`
  }
  return `${endpoint.protocol}://${authority(endpoint)}/api/${version()}`
}

export function buildWsLink(endpoint: ApiEndpoint = getApiEndpoint()): string {
  if (isProxied(endpoint)) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${wsProtocol}://${window.location.host}${getProxyPrefix()}/${authority(endpoint)}/api/${version()}`
  }
  // An override follows its HTTP protocol. `VITE_API_WS_PROTOCOL` belongs to the
  // environment default.
  let protocol = endpoint.protocol === 'https' ? 'wss' : 'ws'
  if (!hasApiEndpointOverride() && import.meta.env.VITE_API_HOSTNAME?.toString().trim()) {
    protocol = import.meta.env.VITE_API_WS_PROTOCOL || protocol
  }
  return `${protocol}://${authority(endpoint)}/api/${version()}`
}
