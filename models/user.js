const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    id : {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profile_photo: {
        type: String,
        required: true
    },
    hasAward: {
        type: Boolean,
        required: true,
        default: false
    }

})

module.exports = mongoose.model('User', userSchema)