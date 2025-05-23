import Navbar from "@/components/navbar.jsx"

export default function Layout({ children }) {
    return (
        <>
            <Navbar />
            <div className="w-screen h-screen bg-auto bg-center">
            <div className="pt-16">{children}</div>
            </div>
        </>
    )
}
