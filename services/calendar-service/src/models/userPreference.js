const mongoose = require('mongoose')

const userPreferenceSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  trackedCalendarIds: {
    type: [String],
    default: []
  },
  selectedCalendarIds: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
})

userPreferenceSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('UserPreference', userPreferenceSchema)
