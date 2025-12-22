import axios from 'axios'
import { apiBaseUrl } from './config'

const baseUrl = `${apiBaseUrl}/preferences`

const get = async () => {
  const res = await axios.get(baseUrl)
  return res.data
}

const save = async (payload) => {
  const res = await axios.put(baseUrl, payload)
  return res.data
}

export default { get, save }
