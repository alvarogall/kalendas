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
  duration: {
    type: Number, // en minutos
    required: [true, 'Debe especificarse la duración del evento'],
    min: [1, 'La duración mínima es de 1 minuto']
  },
  location: {
    type: String,
    required: [true, 'Debe especificarse el lugar del evento']
  },
  organizer: {
    type: String, // o ObjectId si luego se vincula con usuario autenticado
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
    type: String // URL a Google Maps, OpenStreetMap...
  },
  comments: [
    {
      user: { type: String, required: true }, // o ref a usuario si existe
      text: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }
  ],
  notifications: [
    {
      user: { type: String, required: true },
      minutesBefore: { type: Number, default: 30 }, // tiempo de antelación
      active: { type: Boolean, default: true }
    }
  ],
  createdBy: {
    type: String, // se reemplazará luego por el ID del usuario OAuth
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
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
