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

    const from = location.state?.from?.pathname || "/home"

    const handleEmailChange = (e) => {
        setEmail(e.target.value)
        if (error) setError(null)
    }

    const handlePasswordChange = (e) => {
        setPassword(e.target.value)
        if (error) setError(null)
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
            setError(err.message || "An unexpected error occurred during login.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={handleEmailChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                        />
                    </div>
                    {error && (
                        <div className="text-sm text-red-500">
                            {error}
                        </div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Login"}
                    </Button>
                    <div className="text-sm text-center">
                        Don't have an account?{" "}
                        <Link to="/auth/signup" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}