import './App.css'
import Routes from './routes/Routes.jsx'
import 'react-tooltip/dist/react-tooltip.css'
import { ToastProvider } from './components/ui/toast'
import { Toaster } from './components/ui/toaster'

function App() {
    return (
        <ToastProvider>
            <Routes />
            <Toaster />
        </ToastProvider>
    )
}

export default App