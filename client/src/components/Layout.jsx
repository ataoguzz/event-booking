import Navbar from "@/components/navbar.jsx"

export default function Layout({ children }) {
    return (
        <>
            <Navbar />
            <div className="w-screen min-h-screen bg-white">
                <div className="pt-16">{children}</div>
            </div>
        </>
    )
}
