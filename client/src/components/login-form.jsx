import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom" 
import { Button } from "../components/ui/button" 
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { useAuth } from "../contexts/AuthContext.jsx" 

export default function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const { login } = useAuth() 
    const navigate = useNavigate()
    const location = useLocation() 

    
    const from = location.state?.from?.pathname || "/home"; 

    const handleEmailChange = (e) => {
        setEmail(e.target.value)
        if (error) setError(null); 
    }

    const handlePasswordChange = (e) => {
        setPassword(e.target.value)
        if (error) setError(null);
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await login({ email, password }) 
            console.log("Login successful:", response)
            navigate(from, { replace: true })
        } catch (err) {
            console.error("Login failed:", err)
            /
            setError(err.message || "An unexpected error occurred during login.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-[70vh]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
                            <p>{error}</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email" 
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                required
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    to="/auth/forgot-password"
                                    className={`text-sm text-gray-600 hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                name="password" 
                                type="password"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-black hover:bg-gray-800" disabled={isLoading}>
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <Link
                                    to="/auth/signup" 
                                    className={`text-black hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}