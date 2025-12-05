import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

import { GoogleOAuthProvider } from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="594205109660-gdeudsgtc9bn3hqf8tipfv3diet3b0f0.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
)
