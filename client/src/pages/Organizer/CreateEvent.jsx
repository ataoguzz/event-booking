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
import { v4 as uuidv4 } from 'uuid';
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
        rules: "",
        images: [],
    });

    const [ticketTiers, setTicketTiers] = useState([{ id: uuidv4(), tierName: '', price: '', quantity: '' }]);
    const [selectedVenue, setSelectedVenue] = useState(null); // To store full venue object
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
        if (field === 'venue') {
            const SVenue = venues.find(v => v.id.toString() === value);
            setSelectedVenue(SVenue || null);
            setFormData(prev => ({ ...prev, venue: value }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const handleTierChange = (id, field, value) => {
        setTicketTiers(prevTiers =>
            prevTiers.map(tier =>
                tier.id === id ? { ...tier, [field]: value } : tier
            )
        );
        // Clear specific tier error if any
        if (errors.ticketTiers && errors.ticketTiers[id] && errors.ticketTiers[id][field]) {
            setErrors(prev => ({
                ...prev,
                ticketTiers: {
                    ...prev.ticketTiers,
                    [id]: {
                        ...prev.ticketTiers?.[id],
                        [field]: null
                    }
                }
            }));
        }
    };

    const addTier = () => {
        setTicketTiers([...ticketTiers, { id: uuidv4(), tierName: '', price: '', quantity: '' }]);
    };

    const removeTier = (idToRemove) => {
        if (ticketTiers.length > 1) { // Prevent removing the last tier
            setTicketTiers(ticketTiers.filter(tier => tier.id !== idToRemove));
        } else {
            alert("You must have at least one ticket tier.");
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
        if (formData.images.length === 0) newErrors.images = "At least one image is required";

        // Ticket Tiers Validation
        let totalTierQuantity = 0;
        const tierErrors = {};
        let hasTierError = false;
        if (!ticketTiers || ticketTiers.length === 0) {
            newErrors.ticketTiersGeneral = "At least one ticket tier is required.";
            hasTierError = true;
        } else {
            ticketTiers.forEach(tier => {
                const currentTierErrors = {};
                if (!tier.tierName.trim()) {
                    currentTierErrors.tierName = "Tier name is required.";
                    hasTierError = true;
                }
                if (!tier.price || parseFloat(tier.price) <= 0) {
                    currentTierErrors.price = "Price must be a positive number.";
                    hasTierError = true;
                }
                if (!tier.quantity || parseInt(tier.quantity, 10) <= 0) {
                    currentTierErrors.quantity = "Quantity must be a positive integer.";
                    hasTierError = true;
                } else {
                    totalTierQuantity += parseInt(tier.quantity, 10);
                }
                if (Object.keys(currentTierErrors).length > 0) {
                    tierErrors[tier.id] = currentTierErrors;
                }
            });
        }
        if (hasTierError) newErrors.ticketTiers = tierErrors;

        if (selectedVenue && selectedVenue.capacity > 0 && totalTierQuantity > selectedVenue.capacity) {
            newErrors.ticketTiersGeneral = `Total quantity of tickets (${totalTierQuantity.toLocaleString()}) cannot exceed venue capacity (${selectedVenue.capacity.toLocaleString()}).`;
        }
        if (selectedVenue && selectedVenue.capacity === 0 && totalTierQuantity > 0 && selectedVenue.isSeated) {
            newErrors.ticketTiersGeneral = `This seated venue has a capacity of 0. Please check venue details or set ticket quantities to 0 if this is intended (e.g. free, registration only event).`;
        }


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

        data.append('ticketTiersData', JSON.stringify(ticketTiers.map(({ id, ...rest }) => rest))); // Exclude temporary frontend ID

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
            navigate('/my-events');
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
                {/* Title Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
                    <p className="text-muted-foreground mt-2">Fill in the details to create your event</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information Card (Title, Type, Description) - No changes needed here from last version */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Essential details about your event</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Event Title *</Label>
                                    <Input id="title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} className={errors.title ? "border-red-500" : ""} />
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
                            <div className="space-y-2">
                                <Label htmlFor="description">Event Description *</Label>
                                <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={4} className={errors.description ? "border-red-500" : ""} />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date and Time Card - No changes needed */}
                    <Card>
                        <CardHeader><CardTitle>Date and Time</CardTitle><CardDescription>When will your event take place?</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            {/* ... Date and Time inputs as before ... */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Start Date *</Label>
                                    <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.startDate && "text-muted-foreground", errors.startDate && "border-red-500")}><CalendarIcon className="mr-2 h-4 w-4" />{formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.startDate} onSelect={(date) => handleInputChange("startDate", date)} initialFocus /></PopoverContent></Popover>
                                    {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date *</Label>
                                    <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.endDate && "text-muted-foreground", errors.endDate && "border-red-500")}><CalendarIcon className="mr-2 h-4 w-4" />{formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.endDate} onSelect={(date) => handleInputChange("endDate", date)} initialFocus /></PopoverContent></Popover>
                                    {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time *</Label>
                                    <Input id="startTime" type="time" value={formData.startTime} onChange={(e) => handleInputChange("startTime", e.target.value)} className={errors.startTime ? "border-red-500" : ""} />
                                    {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time *</Label>
                                    <Input id="endTime" type="time" value={formData.endTime} onChange={(e) => handleInputChange("endTime", e.target.value)} className={errors.endTime ? "border-red-500" : ""} />
                                    {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                    {/* Venue Selection Card - No changes needed */}
                    <Card>
                        <CardHeader><CardTitle>Venue</CardTitle>
                            <CardDescription>
                                Choose your event venue.
                                {selectedVenue && ` Selected: ${selectedVenue.name} (Capacity: ${selectedVenue.capacity?.toLocaleString() || 'N/A'}${selectedVenue.isSeated ? ", Seated" : ""})`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Venue Select dropdown as before */}
                            <div className="space-y-2">
                                <Label>Select Venue *</Label>
                                <Select value={formData.venue} onValueChange={(value) => handleInputChange("venue", value)}>
                                    <SelectTrigger className={errors.venue ? "border-red-500" : ""}> <SelectValue placeholder="Choose a venue" /> </SelectTrigger>
                                    <SelectContent>
                                        {venues.length > 0 ? venues.map((v) => (
                                            <SelectItem key={v.id} value={v.id.toString()}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{v.name}</span>
                                                    <span className="text-sm text-muted-foreground"> {v.address} • Capacity: {v.capacity?.toLocaleString() || 'N/A'} {v.isSeated ? "(Seated)" : "(GA)"}</span>
                                                </div>
                                            </SelectItem>
                                        )) : <SelectItem value="loading" disabled>Loading venues...</SelectItem>}
                                    </SelectContent>
                                </Select>
                                {errors.venue && <p className="text-sm text-red-500">{errors.venue}</p>}
                                {errors.venuesApi && <p className="text-sm text-red-500">{errors.venuesApi}</p>}
                            </div>
                            {/* Venue Request Dialog */}
                        </CardContent>
                    </Card>

                    {/* Ticket Tiers Pricing Card - Replaces single price input */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Tiers & Pricing</CardTitle>
                            <CardDescription>
                                Define different ticket tiers for your event.
                                {selectedVenue && selectedVenue.isSeated === false && " For non-seated venues, you can define General Admission tiers."}
                                {selectedVenue && ` Venue capacity: ${selectedVenue.capacity?.toLocaleString() || 'N/A'}.`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {errors.ticketTiersGeneral && <Alert variant="destructive"><AlertDescription>{errors.ticketTiersGeneral}</AlertDescription></Alert>}
                            {ticketTiers.map((tier, index) => (
                                <Card key={tier.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-lg font-medium">Tier {index + 1}</Label>
                                        {ticketTiers.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeTier(tier.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        <div className="space-y-1">
                                            <Label htmlFor={`tierName-${tier.id}`}>Tier Name *</Label>
                                            <Input
                                                id={`tierName-${tier.id}`}
                                                value={tier.tierName}
                                                onChange={(e) => handleTierChange(tier.id, 'tierName', e.target.value)}
                                                placeholder="e.g., General Admission, VIP"
                                                className={errors.ticketTiers?.[tier.id]?.tierName ? "border-red-500" : ""}
                                            />
                                            {errors.ticketTiers?.[tier.id]?.tierName && <p className="text-sm text-red-500">{errors.ticketTiers[tier.id].tierName}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`price-${tier.id}`}>Price (USD) *</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id={`price-${tier.id}`}
                                                    type="number"
                                                    value={tier.price}
                                                    onChange={(e) => handleTierChange(tier.id, 'price', e.target.value)}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                    className={`pl-8 ${errors.ticketTiers?.[tier.id]?.price ? "border-red-500" : ""}`}
                                                />
                                            </div>
                                            {errors.ticketTiers?.[tier.id]?.price && <p className="text-sm text-red-500">{errors.ticketTiers[tier.id].price}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`quantity-${tier.id}`}>Quantity *</Label>
                                            <div className="relative">
                                                <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id={`quantity-${tier.id}`}
                                                    type="number"
                                                    value={tier.quantity}
                                                    onChange={(e) => handleTierChange(tier.id, 'quantity', e.target.value)}
                                                    placeholder="0"
                                                    min="1"
                                                    step="1"
                                                    className={`pl-8 ${errors.ticketTiers?.[tier.id]?.quantity ? "border-red-500" : ""}`}
                                                />
                                            </div>
                                            {errors.ticketTiers?.[tier.id]?.quantity && <p className="text-sm text-red-500">{errors.ticketTiers[tier.id].quantity}</p>}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <Button type="button" variant="outline" onClick={addTier} className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Ticket Tier
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Event Images Card - No changes needed */}
                    <Card>
                        <CardHeader><CardTitle>Event Images</CardTitle><CardDescription>Upload at least one image for your event</CardDescription></CardHeader>
                        <CardContent className="space-y-4"> {/* ... Image Upload UI ... */} </CardContent>
                    </Card>


                    {/* Additional Information (Rules) Card - No changes needed */}
                    <Card>
                        <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                        <CardContent className="space-y-6"> {/* ... Rules Textarea ... */} </CardContent>
                    </Card>


                    {/* Submit Button */}
                    {errors.formApi && (<Alert variant="destructive" className="mt-4"><AlertDescription>{errors.formApi}</AlertDescription></Alert>)}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild> <Link to="/my-events">Cancel</Link> </Button>
                        <Button type="submit" disabled={isSubmitting}> {isSubmitting ? "Creating Event..." : "Create Event"} </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default CreateEvent;