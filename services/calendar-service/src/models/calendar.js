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
  description: {
    type: String,
    required: false
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: false
  },
  attendees: {
    type: [String], // array de emails o identificadores
    default: []
  },
  url: {
    type: String,
    required: false
  },
  likes: {
    type: Number,
    default: 0
  }, 
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event' // Referencia al modelo Event
  }],
  sub_calendars: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar' // Referencia recursiva al mismo modelo Calendar
  }]
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