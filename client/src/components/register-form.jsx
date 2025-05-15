"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        userType: "attendee",
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleRadioChange = (value) => {
        setFormData((prev) => ({ ...prev, userType: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // Handle registration logic here
        console.log("Registration with:", formData)
    }

    return (
        <div className="flex justify-center items-center min-h-[70vh]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>User Type</Label>
                            <RadioGroup value={formData.userType} onValueChange={handleRadioChange} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="attendee" id="attendee" />
                                    <Label htmlFor="attendee" className="cursor-pointer">
                                        Attendee - Book tickets and attend events
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="organizer" id="organizer" />
                                    <Label htmlFor="organizer" className="cursor-pointer">
                                        Organizer - Create and manage events
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <Button type="submit" className="w-full bg-black hover:bg-gray-800">
                            Create Account
                        </Button>
                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link to="/login" className="text-black hover:underline">
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
