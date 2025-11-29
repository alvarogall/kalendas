const express = require('express')
const fetch = require('node-fetch')
const multer = require('multer')
const router = express.Router()
const storage = multer.memoryStorage()
const upload = multer({ storage })

const CLIENT_ID = process.env.DROPBOX_CLIENT_ID
const CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET
const REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN

async function getAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error('Missing Dropbox OAuth credentials (DROPBOX_CLIENT_ID/SECRET/REFRESH_TOKEN)')
  }

  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', REFRESH_TOKEN)
  params.append('client_id', CLIENT_ID)
  params.append('client_secret', CLIENT_SECRET)

  const res = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  const j = await res.json()
  if (!res.ok) {
    throw new Error(j.error_description || JSON.stringify(j))
  }
  return j.access_token
}

async function createSharedLink(token, path) {
  const url = 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  })
  if (res.ok) return res.json()

  const txt = await res.text()
  // If shared link already exists, list shared links for the path
  if (res.status === 409) {
    const listRes = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, direct_only: true })
    })
    if (listRes.ok) return listRes.json()
  }
  throw new Error(`create_shared_link failed: ${txt}`)
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required (form field name: file)' })

    const token = await getAccessToken()

    const dropboxPath = `/kalendas/${Date.now()}_${req.file.originalname}`

    // Upload
    const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath, mode: 'add', autorename: true, mute: false })
      },
      body: req.file.buffer
    })

    const uploadText = await uploadRes.text()
    if (!uploadRes.ok) {
      return res.status(502).json({ error: 'Dropbox upload failed', details: uploadText })
    }

    const uploadJson = JSON.parse(uploadText)

    // Create shared link (or reuse existing)
    const shared = await createSharedLink(token, uploadJson.path_lower || uploadJson.path_display || uploadJson.path)

    // shared.url may be nested in list_shared_links response
    const url = shared.url || (shared.links && shared.links[0] && shared.links[0].url) || null

    res.json({ url, path: uploadJson.path_lower || uploadJson.path_display })
  } catch (err) {
    console.error('Upload error:', err)
    // include stack for easier debugging in dev
    res.status(500).json({ error: err.message, stack: err.stack })
  }
})

// Delete by shared link URL: { url: 'https://www.dropbox...' }
router.post('/delete', async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: 'url is required in body' })

    const token = await getAccessToken()

    // Get metadata for shared link
    const metaRes = await fetch('https://api.dropboxapi.com/2/sharing/get_shared_link_metadata', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    const metaText = await metaRes.text()
    if (!metaRes.ok) {
      console.error('get_shared_link_metadata failed:', metaText)
      return res.status(502).json({ error: 'Dropbox metadata fetch failed', details: metaText })
    }
    const meta = JSON.parse(metaText)
    const path = meta.path_lower || meta.path || null
    if (!path) return res.status(500).json({ error: 'Could not determine Dropbox path from shared link metadata' })

    // Delete file by path
    const delRes = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    })

    const delText = await delRes.text()
    if (!delRes.ok) {
      console.error('delete_v2 failed:', delText)
      return res.status(502).json({ error: 'Dropbox delete failed', details: delText })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Delete error:', err)
    res.status(500).json({ error: err.message, stack: err.stack })
  }
})

module.exports = router
