import './App.css'
import Routes from './routes/Routes.jsx'
import 'react-tooltip/dist/react-tooltip.css'
import { ThemeProvider } from "./components/theme-provider"

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Routes />
    </ThemeProvider>

  )
}

export default App
