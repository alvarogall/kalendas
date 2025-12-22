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
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      // Sin default para que el subdocumento no se materialice si no hay coordenadas.
      // (Las coordenadas son opcionales.)
      default: undefined
    },
    coordinates: {
      type: [Number], // [longitude, latitude] en orden GeoJSON estándar
      // coordinates[0] = longitude (este-oeste)
      // coordinates[1] = latitude (norte-sur)
      validate: {
        validator: function(v) {
          // Coordenadas son opcionales.
          if (v == null) return true
          if (Array.isArray(v) && v.length === 0) return true
          return Array.isArray(v) && v.length === 2 &&
                 v[0] >= -180 && v[0] <= 180 &&  // longitud válida
                 v[1] >= -90 && v[1] <= 90       // latitud válida
        },
        message: 'Coordenadas inválidas. Formato: [longitud, latitud]'
      }
    }
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
    maxlength: 5000
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
