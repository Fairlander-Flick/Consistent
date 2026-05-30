import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/tokens.css'
import './styles/login.css'
import './styles/planner.css'
import App from './App.jsx'
import { registerSW } from './lib/registerSW'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

registerSW()
