import { createRoot } from 'react-dom/client'
import { App } from './App.jsx'
import './styles.css'

const rootElement = document.getElementById('root')
if (rootElement) {
  const root = rootElement._greenthreeRoot || createRoot(rootElement)
  rootElement._greenthreeRoot = root
  root.render(<App />)
}
