const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 3
  },
  organizer: {
    type: String,
    required: true
  },
  organizerEmail: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 5000
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  keywords: {
    type: [String],
    default: []
  },
  notificationChannel: {
    type: String,
    enum: ['email', 'in-app'],
    default: 'email'
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar',
    default: null
  },
  subCalendars: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar'
  }],
  sourceUrl: {
    type: String,
    default: null
  },
  lastSyncedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

calendarSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
});

module.exports = mongoose.model('Calendar', calendarSchema);