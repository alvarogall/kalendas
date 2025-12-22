import axios from 'axios'
import { apiBaseUrl } from './config'

const baseUrl = `${apiBaseUrl}/calendars`

const getAll = (params = {}) => {
  const request = axios.get(baseUrl, { params: { includeAll: true, ...params } })
  return request.then(response => response.data)
}

const create = newObject => {
  const request = axios.post(baseUrl, newObject)
  return request.then(response => response.data)
}

const update = (id, newObject) => {
  const request = axios.put(`${baseUrl}/${id}`, newObject)
  return request.then(response => response.data)
}

const remove = id => {
  const request = axios.delete(`${baseUrl}/${id}`)
  return request.then(response => response.data)
}

const importCalendar = ({ url, provider = 'Google Calendar' }) => {
  const payload = { url, provider }
  const request = axios.post(`${baseUrl}/import`, payload)
  return request.then(response => response.data)
}

const sync = (id) => {
  const request = axios.post(`${baseUrl}/${id}/sync`)
  return request.then(response => response.data)
}

export default { getAll, create, update, remove, importCalendar, sync }
