import { useUserStore } from '@/stores/userStore'

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

function authHeaders(): HeadersInit {
  const token = useUserStore.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function request(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init.headers },
  })
}

function get(path: string): Promise<Response> {
  return request(path)
}

function post(path: string, body: unknown): Promise<Response> {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function patch(path: string, body: unknown): Promise<Response> {
  return request(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function del(path: string): Promise<Response> {
  return request(path, { method: 'DELETE' })
}

export const api = {
  problems: {
    upload: (body: unknown) => post('/problems', body),
    get: (id: string) => get(`/problems/${id}`),
  },
  conversations: {
    list: () => get('/conversations'),
    get: (id: string) => get(`/conversations/${id}`),
    update: (id: string, body: unknown) => patch(`/conversations/${id}`, body),
    delete: (id: string) => del(`/conversations/${id}`),
    messages: (id: string) => get(`/conversations/${id}/messages`),
    sendMessage: (id: string, body: unknown) => post(`/conversations/${id}/messages`, body),
  },
  folders: {
    list: () => get('/folders'),
    create: (body: unknown) => post('/folders', body),
    update: (id: string, body: unknown) => patch(`/folders/${id}`, body),
    delete: (id: string) => del(`/folders/${id}`),
  },
  users: {
    me: () => get('/users/me'),
  },
}
