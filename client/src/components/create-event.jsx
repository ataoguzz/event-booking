"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import Layout from "@/components/Layout.jsx"
import { Button } from "@/components/ui/button.jsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Label } from "@/components/ui/label.jsx"
import { Textarea } from "@/components/ui/textarea.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx"
import { Badge } from "@/components/ui/badge.jsx"
import { Calendar } from "@/components/ui/calendar.jsx"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.jsx"
import { Alert, AlertDescription } from "@/components/ui/alert.jsx"
import { CalendarIcon, Upload, X, Plus, MapPin } from "lucide-react"
import { cn } from "@/lib/utils.js"
import { format } from "date-fns"

const CreateEvent = () => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        eventType: "",
        startDate: null,
        endDate: null,
        startTime: "",
        endTime: "",
        venue: "",
        price: "",
        currency: "USD",
        capacity: "",
        rules: "",
        tags: [],
        images: [],
        ageRestriction: "",
        refundPolicy: "",
        contactEmail: "",
        contactPhone: "",
    })

    const [newTag, setNewTag] = useState("")
    const [isVenueDialogOpen, setIsVenueDialogOpen] = useState(false)
    const [venueRequest, setVenueRequest] = useState({
        name: "",
        address: "",
        capacity: "",
        description: "",
    })
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Mock venue data - replace with actual API call
    const venues = [
        { id: 1, name: "Madison Square Garden", address: "New York, NY", capacity: 20000 },
        { id: 2, name: "Hollywood Bowl", address: "Los Angeles, CA", capacity: 17500 },
        { id: 3, name: "Red Rocks Amphitheatre", address: "Morrison, CO", capacity: 9525 },
        { id: 4, name: "The Apollo Theater", address: "New York, NY", capacity: 1500 },
        { id: 5, name: "Blue Note", address: "New York, NY", capacity: 300 },
    ]

    const eventTypes = [
        "Concert",
        "Theater",
        "Stand-up Comedy",
        "Conference",
        "Workshop",
        "Festival",
        "Sports Event",
        "Exhibition",
        "Dance Performance",
        "Other",
    ]

    const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"]

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: "",
            }))
        }
    }

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files)
        const newImages = files.map((file) => ({
            id: Date.now() + Math.random(),
            file,
            url: URL.createObjectURL(file),
            name: file.name,
        }))

        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...newImages],
        }))
    }

    const removeImage = (imageId) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((img) => img.id !== imageId),
        }))
    }

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()],
            }))
            setNewTag("")
        }
    }

    const removeTag = (tagToRemove) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }))
    }

    const handleVenueRequest = async () => {
        // Mock API call to request new venue
        console.log("Venue request:", venueRequest)
        // Reset form and close dialog
        setVenueRequest({ name: "", address: "", capacity: "", description: "" })
        setIsVenueDialogOpen(false)
        // Show success message
        alert("Venue request submitted! An admin will review it shortly.")
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.title.trim()) newErrors.title = "Event title is required"
        if (!formData.description.trim()) newErrors.description = "Event description is required"
        if (!formData.eventType) newErrors.eventType = "Event type is required"
        if (!formData.startDate) newErrors.startDate = "Start date is required"
        if (!formData.startTime) newErrors.startTime = "Start time is required"
        if (!formData.venue) newErrors.venue = "Venue selection is required"
        if (!formData.price || formData.price <= 0) newErrors.price = "Valid price is required"
        if (!formData.capacity || formData.capacity <= 0) newErrors.capacity = "Valid capacity is required"
        if (formData.images.length === 0) newErrors.images = "At least one image is required"
        if (!formData.contactEmail.trim()) newErrors.contactEmail = "Contact email is required"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)

        try {
            // Mock API call - replace with actual implementation
            console.log("Creating event:", formData)

            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 2000))

            // Success - redirect to events list or show success message
            alert("Event created successfully!")
        } catch (error) {
            console.error("Error creating event:", error)
            alert("Error creating event. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
                    <p className="text-muted-foreground mt-2">Fill in the details to create your event</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Essential details about your event</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Event Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange("title", e.target.value)}
                                        placeholder="Enter event title"
                                        className={errors.title ? "border-red-500" : ""}
                                    />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="eventType">Event Type *</Label>
                                    <Select value={formData.eventType} onValueChange={(value) => handleInputChange("eventType", value)}>
                                        <SelectTrigger className={errors.eventType ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select event type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {eventTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.eventType && <p className="text-sm text-red-500">{errors.eventType}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Event Description *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    placeholder="Describe your event in detail"
                                    rows={4}
                                    className={errors.description ? "border-red-500" : ""}
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                            {tag}
                                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="Add a tag"
                                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                    />
                                    <Button type="button" onClick={addTag} variant="outline">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date and Time */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Date and Time</CardTitle>
                            <CardDescription>When will your event take place?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Start Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.startDate && "text-muted-foreground",
                                                    errors.startDate && "border-red-500",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={formData.startDate}
                                                onSelect={(date) => handleInputChange("startDate", date)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.endDate && "text-muted-foreground",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date (optional)"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={formData.endDate}
                                                onSelect={(date) => handleInputChange("endDate", date)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time *</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                                        className={errors.startTime ? "border-red-500" : ""}
                                    />
                                    {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Venue Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Venue</CardTitle>
                            <CardDescription>Choose where your event will take place</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Venue *</Label>
                                <Select value={formData.venue} onValueChange={(value) => handleInputChange("venue", value)}>
                                    <SelectTrigger className={errors.venue ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Choose a venue" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {venues.map((venue) => (
                                            <SelectItem key={venue.id} value={venue.id.toString()}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{venue.name}</span>
                                                    <span className="text-sm text-muted-foreground">
                            {venue.address} • Capacity: {venue.capacity.toLocaleString()}
                          </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.venue && <p className="text-sm text-red-500">{errors.venue}</p>}
                            </div>

                            <Alert>
                                <MapPin className="h-4 w-4" />
                                <AlertDescription>
                                    Can't find your venue?{" "}
                                    <Dialog open={isVenueDialogOpen} onOpenChange={setIsVenueDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="p-0 h-auto">
                                                Request a new venue
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Request New Venue</DialogTitle>
                                                <DialogDescription>
                                                    Submit a request for a new venue. An admin will review and add it to the system.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="venueName">Venue Name</Label>
                                                    <Input
                                                        id="venueName"
                                                        value={venueRequest.name}
                                                        onChange={(e) => setVenueRequest((prev) => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Enter venue name"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="venueAddress">Address</Label>
                                                    <Input
                                                        id="venueAddress"
                                                        value={venueRequest.address}
                                                        onChange={(e) => setVenueRequest((prev) => ({ ...prev, address: e.target.value }))}
                                                        placeholder="Enter full address"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="venueCapacity">Capacity</Label>
                                                    <Input
                                                        id="venueCapacity"
                                                        type="number"
                                                        value={venueRequest.capacity}
                                                        onChange={(e) => setVenueRequest((prev) => ({ ...prev, capacity: e.target.value }))}
                                                        placeholder="Maximum capacity"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="venueDescription">Description</Label>
                                                    <Textarea
                                                        id="venueDescription"
                                                        value={venueRequest.description}
                                                        onChange={(e) => setVenueRequest((prev) => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Additional details about the venue"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" onClick={() => setIsVenueDialogOpen(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button onClick={handleVenueRequest}>Submit Request</Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    {/* Pricing and Capacity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing and Capacity</CardTitle>
                            <CardDescription>Set your event pricing and capacity limits</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Ticket Price *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => handleInputChange("price", e.target.value)}
                                        placeholder="0.00"
                                        className={errors.price ? "border-red-500" : ""}
                                    />
                                    {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((currency) => (
                                                <SelectItem key={currency} value={currency}>
                                                    {currency}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Event Capacity *</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => handleInputChange("capacity", e.target.value)}
                                        placeholder="Maximum attendees"
                                        className={errors.capacity ? "border-red-500" : ""}
                                    />
                                    {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Event Images */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Images</CardTitle>
                            <CardDescription>Upload at least one image for your event</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="images">Upload Images *</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <input
                                        id="images"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <Label htmlFor="images" className="cursor-pointer">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-600">Click to upload images or drag and drop</p>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                                    </Label>
                                </div>
                                {errors.images && <p className="text-sm text-red-500">{errors.images}</p>}
                            </div>

                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {formData.images.map((image) => (
                                        <div key={image.id} className="relative group">
                                            <img
                                                src={image.url || "/placeholder.svg"}
                                                alt={image.name}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeImage(image.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Additional Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                            <CardDescription>Rules, policies, and contact information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="rules">Event Rules</Label>
                                <Textarea
                                    id="rules"
                                    value={formData.rules}
                                    onChange={(e) => handleInputChange("rules", e.target.value)}
                                    placeholder="List any rules or guidelines for attendees"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="ageRestriction">Age Restriction</Label>
                                    <Select
                                        value={formData.ageRestriction}
                                        onValueChange={(value) => handleInputChange("ageRestriction", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select age restriction" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No restriction</SelectItem>
                                            <SelectItem value="13+">13+</SelectItem>
                                            <SelectItem value="16+">16+</SelectItem>
                                            <SelectItem value="18+">18+</SelectItem>
                                            <SelectItem value="21+">21+</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="refundPolicy">Refund Policy</Label>
                                    <Select
                                        value={formData.refundPolicy}
                                        onValueChange={(value) => handleInputChange("refundPolicy", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select refund policy" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full">Full refund until 24h before</SelectItem>
                                            <SelectItem value="partial">50% refund until 24h before</SelectItem>
                                            <SelectItem value="none">No refunds</SelectItem>
                                            <SelectItem value="custom">Custom policy</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail">Contact Email *</Label>
                                    <Input
                                        id="contactEmail"
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                                        placeholder="contact@example.com"
                                        className={errors.contactEmail ? "border-red-500" : ""}
                                    />
                                    {errors.contactEmail && <p className="text-sm text-red-500">{errors.contactEmail}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone">Contact Phone</Label>
                                    <Input
                                        id="contactPhone"
                                        type="tel"
                                        value={formData.contactPhone}
                                        onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link to="/my-events">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating Event..." : "Create Event"}
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}

export default CreateEvent
