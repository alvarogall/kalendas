const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Event'
  },
  calendarId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Calendar'
  },
  channel: {
    type: String,
    enum: ['email', 'in-app'],
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'error'],
    default: 'pending'
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastError: {
    type: String
  }
}, {
  timestamps: true
})

notificationSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Notification', notificationSchema)