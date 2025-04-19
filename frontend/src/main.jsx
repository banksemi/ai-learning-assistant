import React from 'react'
import ReactDOM from 'react-dom/client'
// Import the wrapper component instead of App directly
import AppWrapper from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Render the wrapper which includes the Provider */}
    <AppWrapper />
  </React.StrictMode>,
)
