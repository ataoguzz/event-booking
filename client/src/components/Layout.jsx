import Navbar from "@/components/navbar.jsx"
import { Toaster } from "@/components/ui/toaster"

export default function Layout({ children }) {
    return (
        <>
            <Navbar />
            <div className="w-screen min-h-screen bg-white">
                <div className="pt-16">{children}</div>
            </div>
            <Toaster />
        </>
    )
}
