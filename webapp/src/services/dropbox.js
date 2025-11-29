// Client wrapper that proxies Dropbox operations to the backend `api-gateway`.
// The backend uses server-side credentials and a refresh token to talk to Dropbox.

const uploadFile = async (file) => {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch('/api/dropbox/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Dropbox upload (backend) failed: ${txt}`)
  }
  const json = await res.json()
  return json.url
}

export default { uploadFile }

export const deleteBySharedLink = async (sharedUrl) => {
  const res = await fetch('/api/dropbox/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sharedUrl })
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Dropbox delete (backend) failed: ${txt}`)
  }
  return true
}
