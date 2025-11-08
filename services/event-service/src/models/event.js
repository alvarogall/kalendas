const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título del evento es obligatorio'],
    minlength: 3
  },
  startTime: {
    type: Date,
    required: [true, 'Debe especificarse la hora de inicio del evento']
  },
  endTime: {
    type: Date,
    required: [true, 'Debe especificarse la hora de finalización del evento']
  },
  location: {
    type: String,
    required: [true, 'Debe especificarse el lugar del evento']
  },
  organizer: {
    type: String,
    required: [true, 'Debe especificarse el organizador del evento']
  },
  calendar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar',
    required: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  images: {
    type: [String], // URLs a Cloudinary, Drive, etc.
    default: []
  },
  attachments: {
    type: [String], // URLs a archivos adjuntos externos
    default: []
  },
  mapLink: {
    type: String
  }
}, {
  timestamps: true
});

eventSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('Event', eventSchema);
