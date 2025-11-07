const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5
  },
  author: {
    type: String,
    required: true
  },
  authorEmail: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  attendees: {
    type: [String],
    default: []
  },
  url: {
    type: String
  },
  likes: {
    type: Number,
    default: 0
  },
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  sub_calendars: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar'
  }],
  notificationChannel: {
    type: String,
    enum: ['email', 'in-app'],
    default: 'email'
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