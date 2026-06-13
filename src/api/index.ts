import axios from 'axios'

export const request = axios.create({
  timeout: 8000,
})

request.interceptors.response.use((response) => response.data)

export function resolveMock<T>(payload: T, timeout = 160): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(payload), timeout)
  })
}
