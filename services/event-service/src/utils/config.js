require('dotenv').config()

const PORT = process.env.PORT

const MONGODB_URI = process.env.MONGODB_URI
 
module.exports = {
  MONGODB_URI,
  PORT,
  COMMENT_SERVICE_URL: process.env.COMMENT_SERVICE_URL
}