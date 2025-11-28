// Minimal Dropbox client for direct uploads from the browser (dev only).
// Uses `VITE_DROPBOX_TOKEN` from environment and supports an optional
// `VITE_DROPBOX_PROXY` prefix to route requests through a local CORS proxy
// (e.g. cors-anywhere) for development when Dropbox blocks uploads via CORS.

const token = import.meta.env.VITE_DROPBOX_TOKEN
const proxyPrefix = import.meta.env.VITE_DROPBOX_PROXY || ''

if (!token) {
  // don't throw at import time — functions will check
}

const uploadFile = async (file) => {
  if (!token) throw new Error('Dropbox token not configured (VITE_DROPBOX_TOKEN)')
  const dropboxPath = `/kalendas/${Date.now()}_${file.name}`

  // Upload file content (optionally via proxyPrefix)
  const uploadUrl = `${proxyPrefix}https://content.dropboxapi.com/2/files/upload`
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath, mode: 'add', autorename: true, mute: false })
    },
    body: file
  })

  if (!uploadRes.ok) {
    const txt = await uploadRes.text()
    throw new Error(`Dropbox upload failed: ${txt}`)
  }
  const uploadJson = await uploadRes.json()

  // Create shared link
  const shareUrl = `${proxyPrefix}https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings`
  const shareRes = await fetch(shareUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path: uploadJson.path_lower })
  })

  if (!shareRes.ok) {
    const txt = await shareRes.text()
    throw new Error(`Dropbox create shared link failed: ${txt}`)
  }
  const shareJson = await shareRes.json()

  // Dropbox shared link ends with ?dl=0; if you want direct download use ?raw=1 or dl=1
  return shareJson.url
}

export default { uploadFile }

// Delete a file given a Dropbox shared link URL. This resolves the shared link
// metadata to obtain the internal path and then deletes the file via files/delete_v2.
export const deleteBySharedLink = async (sharedUrl) => {
  if (!token) throw new Error('Dropbox token not configured (VITE_DROPBOX_TOKEN)')

  // Get metadata for the shared link to obtain the path_lower
  const metaUrl = `${proxyPrefix}https://api.dropboxapi.com/2/sharing/get_shared_link_metadata`
  const metaRes = await fetch(metaUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: sharedUrl })
  })

  if (!metaRes.ok) {
    const txt = await metaRes.text()
    throw new Error(`Dropbox get_shared_link_metadata failed: ${txt}`)
  }
  const meta = await metaRes.json()
  const path = meta.path_lower || meta.path || null
  if (!path) throw new Error('Could not determine Dropbox path from shared link metadata')

  // Delete the file by path
  const delUrl = `${proxyPrefix}https://api.dropboxapi.com/2/files/delete_v2`
  const delRes = await fetch(delUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path })
  })

  if (!delRes.ok) {
    const txt = await delRes.text()
    throw new Error(`Dropbox delete_v2 failed: ${txt}`)
  }

  return true
}
