import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { googleClientId } from './services/config'

import { GoogleOAuthProvider } from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
)
