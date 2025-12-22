import axios from 'axios'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// Important: App.jsx sets a global axios Authorization header for our API.
// If we reuse that axios instance for Cloudinary, the browser will send a CORS preflight
// (because of the Authorization header) and Cloudinary may reject it, resulting in
// a generic "Network Error".
const cloudinaryAxios = axios.create({
  withCredentials: false
})
delete cloudinaryAxios.defaults.headers.common?.Authorization

const uploadImage = async (file) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing. Check .env file.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  try {
    const response = await cloudinaryAxios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      {}
    )
    return response.data.secure_url
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error)
    throw error
  }
}

export default { uploadImage }
