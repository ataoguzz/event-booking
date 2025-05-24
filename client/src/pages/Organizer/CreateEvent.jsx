"use client"

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Calendar } from "@/components/ui/calendar.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.jsx";
import { Alert, AlertDescription } from "@/components/ui/alert.jsx";
import { CalendarIcon, Upload, X, MapPin } from "lucide-react"; // Removed Plus (for tags)
import { cn } from "@/lib/utils.js";
import { format } from "date-fns";
import apiClient from "@/helpers/apiCore.js";
import { useAuth } from "@/contexts/AuthContext.jsx";

const CreateEvent = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

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
        rules: "",
        images: [],
    });

    // const [newTag, setNewTag] = useState(""); // Removed for tags
    const [isVenueDialogOpen, setIsVenueDialogOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [venues, setVenues] = useState([]);
    const [venueRequest, setVenueRequest] = useState({name: "", address: "", capacity: "", description: ""});

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const response = await apiClient.get("/venues/venues");
                setVenues(response.data || []);
            } catch (error) {
                console.error("Error fetching venues:", error);
                setErrors(prev => ({ ...prev, venues: "Could not load venues." }));
            }
        };
        fetchVenues();
    }, []);

    const eventTypes = [
        "Concert", "Theater", "Stand-up Comedy", "Conference", "Workshop",
        "Festival", "Sports Event", "Exhibition", "Dance Performance", "Other",
    ];
    // const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"]; // Removed

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        const newImages = files.map((file) => ({
            id: Date.now() + Math.random(),
            file,
            url: URL.createObjectURL(file),
            name: file.name,
        }));
        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...newImages].slice(0, 10),
        }));
        if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));
    };

    const removeImage = (imageId) => {
        const imageToRemove = formData.images.find(img => img.id === imageId);
        if (imageToRemove && imageToRemove.url.startsWith('blob:')) {
            URL.revokeObjectURL(imageToRemove.url);
        }
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((img) => img.id !== imageId),
        }));
    };

    // addTag and removeTag functions removed

    const handleVenueRequest = async () => { /* ... (for later) ... */ };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Event title is required";
        if (!formData.description.trim()) newErrors.description = "Event description is required";
        if (!formData.eventType) newErrors.eventType = "Event type is required";
        if (!formData.startDate) newErrors.startDate = "Start date is required";
        if (!formData.startTime) newErrors.startTime = "Start time is required";
        if (!formData.endDate) newErrors.endDate = "End date is required"; // Assuming end date is always required by schema
        if (!formData.endTime) newErrors.endTime = "End time is required"; // Assuming end time is always required

        if (formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
            newErrors.endDate = "End date cannot be before start date.";
        }
        if (formData.endDate && formData.startDate && formData.endTime && formData.startTime &&
            formData.endDate.getTime() === formData.startDate.getTime() && formData.endTime <= formData.startTime) {
            newErrors.endTime = "End time must be after start time on the same day.";
        }

        if (!formData.venue) newErrors.venue = "Venue selection is required";
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Valid positive price is required";
        // Capacity validation removed
        if (formData.images.length === 0) newErrors.images = "At least one image is required";
        // Contact email validation removed

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !user.account_id) {
            setErrors(prev => ({ ...prev, form: "User not authenticated or account ID missing. Cannot create event." }));
            alert("Authentication error. Please log in again.");
            return;
        }

        if (!validateForm()) return;
        setIsSubmitting(true);
        console.log("edip1");
        console.log(user);

        const data = new FormData();

        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('eventType', formData.eventType);
        if (formData.startDate) data.append('startDate', format(formData.startDate, "yyyy-MM-dd"));
        data.append('startTime', formData.startTime);
        if (formData.endDate) data.append('endDate', format(formData.endDate, "yyyy-MM-dd"));
        data.append('endTime', formData.endTime);
        data.append('venue', formData.venue);
        data.append('price', formData.price);
        if (formData.rules) data.append('rules', formData.rules);

        data.append('organizerAccountId', user.account_id.toString());

        formData.images.forEach(imageObj => {
            data.append('images', imageObj.file, imageObj.name);
        });
        console.log("edip2");
        try {
            const response = await apiClient.post('/event/create', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log("Event created:", response.data);
            alert("Event created successfully!");
            //navigate('/organizer/my-events'); // Or to the new event's page
        } catch (error) {
            console.error("Error creating event:", error);
            const errorMsg = error.data?.message || error.message || "Error creating event. Please try again.";
            setErrors(prev => ({ ...prev, form: errorMsg }));
            alert(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto py-8 px-4 overflow-x-hidden">
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
                            {/* Title and Event Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Event Title *</Label>
                                    <Input id="title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} placeholder="Enter event title" className={errors.title ? "border-red-500" : ""} />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="eventType">Event Type *</Label>
                                    <Select value={formData.eventType} onValueChange={(value) => handleInputChange("eventType", value)}>
                                        <SelectTrigger className={errors.eventType ? "border-red-500" : ""}> <SelectValue placeholder="Select event type" /> </SelectTrigger>
                                        <SelectContent>{eventTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                                    </Select>
                                    {errors.eventType && <p className="text-sm text-red-500">{errors.eventType}</p>}
                                </div>
                            </div>
                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Event Description *</Label>
                                <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} placeholder="Describe your event in detail" rows={4} className={errors.description ? "border-red-500" : ""} />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>
                            {/* Tags section removed */}
                        </CardContent>
                    </Card>

                    {/* Date and Time */}
                    <Card>
                        <CardHeader><CardTitle>Date and Time</CardTitle><CardDescription>When will your event take place?</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Start Date */}
                                <div className="space-y-2">
                                    <Label>Start Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.startDate && "text-muted-foreground", errors.startDate && "border-red-500")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.startDate} onSelect={(date) => handleInputChange("startDate", date)} initialFocus /></PopoverContent>
                                    </Popover>
                                    {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
                                </div>
                                {/* End Date */}
                                <div className="space-y-2">
                                    <Label>End Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.endDate && "text-muted-foreground", errors.endDate && "border-red-500")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.endDate} onSelect={(date) => handleInputChange("endDate", date)} initialFocus /></PopoverContent>
                                    </Popover>
                                    {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
                                </div>
                                {/* Start Time */}
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time *</Label>
                                    <Input id="startTime" type="time" value={formData.startTime} onChange={(e) => handleInputChange("startTime", e.target.value)} className={errors.startTime ? "border-red-500" : ""} />
                                    {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
                                </div>
                                {/* End Time */}
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time *</Label>
                                    <Input id="endTime" type="time" value={formData.endTime} onChange={(e) => handleInputChange("endTime", e.target.value)} className={errors.endTime ? "border-red-500" : ""} />
                                    {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Venue Selection */}
                    <Card>
                        <CardHeader><CardTitle>Venue</CardTitle><CardDescription>Choose where your event will take place. Capacity is determined by the venue.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Venue *</Label>
                                <Select value={formData.venue} onValueChange={(value) => handleInputChange("venue", value)}>
                                    <SelectTrigger className={errors.venue ? "border-red-500" : ""}> <SelectValue placeholder="Choose a venue" /> </SelectTrigger>
                                    <SelectContent>
                                        {venues.length > 0 ? venues.map((v) => (
                                            <SelectItem key={v.id} value={v.id.toString()}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{v.name}</span>
                                                    <span className="text-sm text-muted-foreground"> {v.address} • Capacity: {v.capacity?.toLocaleString() || 'N/A'} </span>
                                                </div>
                                            </SelectItem>
                                        )) : <SelectItem value="loading" disabled>Loading venues...</SelectItem>}
                                    </SelectContent>
                                </Select>
                                {errors.venue && <p className="text-sm text-red-500">{errors.venue}</p>}
                                {errors.venues && <p className="text-sm text-red-500">{errors.venues}</p>}
                            </div>
                            <Alert><MapPin className="h-4 w-4" /><AlertDescription> Can't find your venue?{" "} <Dialog open={isVenueDialogOpen} onOpenChange={setIsVenueDialogOpen}><DialogTrigger asChild><Button variant="link" className="p-0 h-auto"> Request a new venue </Button></DialogTrigger><DialogContent> {/* ... Venue Request Dialog ... */} </DialogContent></Dialog> </AlertDescription></Alert>
                        </CardContent>
                    </Card>

                    {/* Pricing (Capacity and Currency removed) */}
                    <Card>
                        <CardHeader><CardTitle>Pricing</CardTitle><CardDescription>Set your event ticket price.</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2"> {/* Simplified from grid */}
                                <Label htmlFor="price">Ticket Price (USD) *</Label>
                                <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => handleInputChange("price", e.target.value)} placeholder="0.00" className={errors.price ? "border-red-500" : ""} />
                                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                            </div>
                            {/* Currency and Capacity Input removed */}
                        </CardContent>
                    </Card>

                    {/* Event Images (Same as before) */}
                    <Card>
                        <CardHeader><CardTitle>Event Images</CardTitle><CardDescription>Upload at least one image for your event</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="images">Upload Images *</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <input id="images" type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    <Label htmlFor="images" className="cursor-pointer">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                                    </Label>
                                </div>
                                {errors.images && <p className="text-sm text-red-500">{errors.images}</p>}
                            </div>
                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {formData.images.map((image) => (
                                        <div key={image.id} className="relative group">
                                            <img src={image.url || "/placeholder.svg"} alt={image.name} className="w-full h-32 object-cover rounded-lg" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(image.id)}> <X className="h-4 w-4" /> </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Additional Information (Rules only, rest removed) */}
                    <Card>
                        <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="rules">Event Rules</Label>
                                <Textarea id="rules" value={formData.rules} onChange={(e) => handleInputChange("rules", e.target.value)} placeholder="List any rules or guidelines for attendees" rows={3} />
                            </div>
                            {/* Age Restriction, Refund Policy, Contact Info removed */}
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    {errors.form && (<Alert variant="destructive" className="mt-4"><AlertDescription>{errors.form}</AlertDescription></Alert>)}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild> <Link to="/organizer/my-events">Cancel</Link> </Button>
                        <Button type="submit" disabled={isSubmitting}> {isSubmitting ? "Creating Event..." : "Create Event"} </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default CreateEvent;