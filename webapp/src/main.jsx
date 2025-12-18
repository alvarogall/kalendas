import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { googleClientId } from './services/config'
import { apiBaseUrl } from './services/config'

import { GoogleOAuthProvider } from '@react-oauth/google'

console.info('[Kalendas] apiBaseUrl =', apiBaseUrl)
console.info('[Kalendas] googleClientId =', googleClientId)

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
)
