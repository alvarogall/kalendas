import axios from 'axios'
import { apiBaseUrl } from './config'

const baseUrl = `${apiBaseUrl}/notifications`

const getAll = (params) => {
  const request = axios.get(baseUrl, { params })
  return request.then(response => response.data)
}

const create = newObject => {
  const request = axios.post(baseUrl, newObject)
  return request.then(response => response.data)
}

const remove = id => {
  const request = axios.delete(`${baseUrl}/${id}`)
  return request.then(response => response.data)
}

const markAsRead = id => {
  const request = axios.patch(`${baseUrl}/${id}/read`)
  return request.then(response => response.data)
}

export default { getAll, create, remove, markAsRead }
