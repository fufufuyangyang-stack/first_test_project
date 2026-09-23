import axios from 'axios'

// Prototype token storage: localStorage. For production, move the refresh
// token into an httpOnly cookie set by the backend.
const ACCESS = 'pixshelf.access'
const REFRESH = 'pixshelf.refresh'

export const tokens = {
  get access() { return localStorage.getItem(ACCESS) },
  get refresh() { return localStorage.getItem(REFRESH) },
  set({ access, refresh }) {
    if (access) localStorage.setItem(ACCESS, access)
    if (refresh) localStorage.setItem(REFRESH, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS)
    localStorage.removeItem(REFRESH)
  },
}

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`
  return config
})

let refreshing = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isAuthCall = original?.url?.startsWith('/auth/')
    if (error.response?.status !== 401 || original._retried || isAuthCall || !tokens.refresh) {
      throw error
    }
    original._retried = true
    try {
      // Share one refresh request between concurrent 401s.
      refreshing ??= api.post('/auth/refresh/', { refresh: tokens.refresh }).finally(() => { refreshing = null })
      const { data } = await refreshing
      tokens.set(data)
    } catch {
      tokens.clear()
      window.dispatchEvent(new Event('pixshelf:logout'))
      throw error
    }
    return api(original)
  },
)

/** Turn a DRF error response into one readable message. */
export function errorMessage(error, fallback = 'Something went wrong.') {
  const data = error?.response?.data
  if (!data) return error?.message || fallback
  if (typeof data === 'string') return fallback
  if (data.detail) return data.detail
  return Object.entries(data)
    .map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(' ') : String(msgs)
      return field === 'non_field_errors' ? text : `${field}: ${text}`
    })
    .join('\n')
}

/** Download a picture through the API (so private pictures work with auth headers). */
export async function downloadPicture(id) {
  const res = await api.get(`/pictures/${id}/download/`, { responseType: 'blob' })
  const disposition = res.headers['content-disposition'] || ''
  const filename = /filename="?([^"]+)"?/.exec(disposition)?.[1] || `picture-${id}`
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
