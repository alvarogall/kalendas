const preferencesRouter = require('express').Router()
const UserPreference = require('../models/userPreference')

const requireAuth = (req, res) => {
  if (!req.user || !req.user.email) {
    res.status(401).json({ error: 'Autenticación requerida' })
    return false
  }
  return true
}

const normalizeIdArray = (raw, max = 2000) => {
  if (!Array.isArray(raw)) return []
  const out = []
  const seen = new Set()
  for (const v of raw) {
    const s = String(v || '').trim()
    if (!s) continue
    // Mongo ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(s)) continue
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
    if (out.length >= max) break
  }
  return out
}

preferencesRouter.get('/', async (req, res) => {
  if (!requireAuth(req, res)) return
  const userEmail = String(req.user.email)

  const pref = await UserPreference.findOne({ userEmail })
  if (!pref) {
    return res.json({ trackedCalendarIds: [], selectedCalendarIds: [] })
  }

  res.json({
    trackedCalendarIds: Array.isArray(pref.trackedCalendarIds) ? pref.trackedCalendarIds : [],
    selectedCalendarIds: Array.isArray(pref.selectedCalendarIds) ? pref.selectedCalendarIds : []
  })
})

preferencesRouter.put('/', async (req, res) => {
  if (!requireAuth(req, res)) return
  const userEmail = String(req.user.email)

  const trackedCalendarIds = normalizeIdArray(req.body?.trackedCalendarIds)
  const selectedCalendarIds = normalizeIdArray(req.body?.selectedCalendarIds)

  const updated = await UserPreference.findOneAndUpdate(
    { userEmail },
    { userEmail, trackedCalendarIds, selectedCalendarIds },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  )

  res.json({
    trackedCalendarIds: updated.trackedCalendarIds,
    selectedCalendarIds: updated.selectedCalendarIds
  })
})

module.exports = preferencesRouter
