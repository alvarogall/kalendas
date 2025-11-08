const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        maxlength: 1000
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

commentSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;    
    }
});

module.exports = mongoose.model('Comment', commentSchema);