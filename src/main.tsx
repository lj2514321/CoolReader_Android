import { createRoot } from 'react-dom/client'
import './styles/colors.css'
import './styles/typography.css'
import './styles/glass.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
