import { useState } from "react"
import { Link, useNavigate } from "react-router-dom" 
import { Button } from "../components/ui/button" 
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { useAuth } from "../contexts/AuthContext" // Import useAuth

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        userType: "attendee", 
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const { register } = useAuth() 
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (error) setError(null); 
    }

    const handleRadioChange = (value) => {
        setFormData((prev) => ({ ...prev, userType: value }))
        if (error) setError(null);
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const registrationData = {
            full_name: formData.fullName, 
            email: formData.email,
            password: formData.password,
            role: formData.userType, 
        }

        try {
            const response = await register(registrationData) 
            console.log("Registration successful:", response)
            navigate("/home") 
        } catch (err) {
            console.error("Registration failed:", err)
            setError(err.message || "An unexpected error occurred during registration.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-[70vh] bg-white p-4">
            <Card className="w-full max-w-md bg-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
                            <p>{error}</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                                minLength={6} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>User Type</Label>
                            <RadioGroup
                                value={formData.userType}
                                onValueChange={handleRadioChange}
                                className="space-y-2"
                                disabled={isLoading}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="attendee" id="attendee" disabled={isLoading} />
                                    <Label htmlFor="attendee" className={`cursor-pointer ${isLoading ? 'opacity-50' : ''}`}>
                                        Attendee - Book tickets and attend events
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="organizer" id="organizer" disabled={isLoading} />
                                    <Label htmlFor="organizer" className={`cursor-pointer ${isLoading ? 'opacity-50' : ''}`}>
                                        Organizer - Create and manage events
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <Button type="submit" className="w-full bg-black hover:bg-gray-800" disabled={isLoading}>
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link to="/login" className={`text-black hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}