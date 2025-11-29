const express = require('express')
const fetch = require('node-fetch')
const multer = require('multer')
const logger = require('../utils/logger')

const router = express.Router()
// Only parse JSON bodies for routes that need it (delete endpoint)
router.use(express.json())
const upload = multer()

const getAccessToken = async () => {
  const clientId = process.env.DROPBOX_CLIENT_ID
  const clientSecret = process.env.DROPBOX_CLIENT_SECRET
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Dropbox credentials not configured')

  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', refreshToken)
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)

  const res = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Dropbox token refresh failed: ${txt}`)
  }
  const json = await res.json()
  return json.access_token
}

// Upload file: expects multipart/form-data with field `file`
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file' })
    const accessToken = await getAccessToken()

    const filename = req.file.originalname || 'upload'
    const dropboxPath = `/kalendas/${Date.now()}_${filename}`

    // Upload content
    const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath, mode: 'add', autorename: true, mute: false })
      },
      body: req.file.buffer
    })

    if (!uploadRes.ok) {
      const txt = await uploadRes.text()
      throw new Error(`Dropbox upload failed: ${txt}`)
    }
    const uploadJson = await uploadRes.json()

    // Create shared link with default settings
    const shareRes = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: uploadJson.path_lower })
    })

    if (!shareRes.ok) {
      const txt = await shareRes.text()
      throw new Error(`Dropbox create shared link failed: ${txt}`)
    }
    const shareJson = await shareRes.json()

    res.json({ url: shareJson.url })
  } catch (err) {
    logger.error('Dropbox upload error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Delete by shared link: expects JSON { sharedUrl }
router.post('/delete', async (req, res) => {
  try {
    const { sharedUrl } = req.body
    if (!sharedUrl) return res.status(400).json({ error: 'Missing sharedUrl' })
    const accessToken = await getAccessToken()

    // Resolve shared link metadata to get path
    const metaRes = await fetch('https://api.dropboxapi.com/2/sharing/get_shared_link_metadata', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
    const delRes = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    })

    if (!delRes.ok) {
      const txt = await delRes.text()
      throw new Error(`Dropbox delete_v2 failed: ${txt}`)
    }

    res.json({ ok: true })
  } catch (err) {
    logger.error('Dropbox delete error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
