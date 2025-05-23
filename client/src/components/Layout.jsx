import Navbar from "@/components/navbar.jsx"

export default function Layout({ children }) {
    return (
        <>
            <Navbar />
            <div className="pt-16">{children}</div>
        </>
    )
}
