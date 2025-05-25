"use client"

import { useState, useEffect, useRef } from "react"; // Added useRef
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
    // DialogDescription, // Not used in your current JSX for venue request
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.jsx";
import { Alert, AlertDescription } from "@/components/ui/alert.jsx";
import { CalendarIcon, Upload, X, MapPin, PlusCircle, Trash2, DollarSign, Hash } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { format } from "date-fns";
// import { v4 as uuidv4 } from 'uuid'; // REMOVE THIS LINE
import apiClient from "@/helpers/apiCore.js";
import { useAuth } from "@/contexts/AuthContext.jsx";
import SeatAssignment from "@/components/SeatAssignment.jsx";

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

    // Use useRef for a persistent, incrementing ID that doesn't cause re-renders
    const nextTierId = useRef(1);

    // Helper function to calculate remaining capacity for a specific tier
    const getRemainingCapacity = (excludeTierId = null) => {
        if (!selectedVenue || selectedVenue.capacity <= 0) return Infinity;
        
        const usedCapacity = ticketTiers
            .filter(tier => tier.id !== excludeTierId)
            .reduce((sum, tier) => sum + (parseInt(tier.quantity, 10) || 0), 0);
        
        return Math.max(0, selectedVenue.capacity - usedCapacity);
    };

    // Initialize the first tier with an ID from the ref
    const getInitialTier = () => {
        const id = nextTierId.current;
        nextTierId.current += 1;
        return { id: id, tierName: '', price: '', quantity: '' };
    };

    const [ticketTiers, setTicketTiers] = useState([getInitialTier()]); // Use function to get initial tier

    const [selectedVenue, setSelectedVenue] = useState(null);
    const [isVenueDialogOpen, setIsVenueDialogOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [venues, setVenues] = useState([]);
    const [venueRequest, setVenueRequest] = useState({name: "", address: "", capacity: "", description: ""});
    const [seatAssignments, setSeatAssignments] = useState({}); // For seated venues

    // ... (useEffect for fetchVenues remains the same) ...
    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const response = await apiClient.get("/venue/venues");
                setVenues(response.data || []);
            } catch (error) {
                console.error("Error fetching venues:", error);
                setErrors(prev => ({ ...prev, venuesApi: "Could not load venues." })); // Changed error key
            }
        };
        fetchVenues();
    }, []);


    const eventTypes = [
        "CONCERT", "THEATER", "SPORTS", "STANDUP", "CONFERENCE", "WORKSHOP", "FESTIVAL", "OTHER",
    ];

    const eventTypeLabels = {
        "CONCERT": "CONCERT",
        "THEATER": "THEATER",
        "SPORTS": "SPORTS",
        "STANDUP": "STANDUP",
        "CONFERENCE": "CONFERENCE",
        "WORKSHOP": "WORKSHOP",
        "FESTIVAL": "FESTIVAL",
        "OTHER": "OTHER"
    };

    const handleInputChange = (field, value) => { /* ... same as before ... */
        if (field === 'venue') {
            const SVenue = venues.find(v => v.id.toString() === value);
            setSelectedVenue(SVenue || null);
            setFormData(prev => ({ ...prev, venue: value }));
            // Clear seat assignments when venue changes
            setSeatAssignments({});
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const handleTierChange = (id, field, value) => {
        const oldTier = ticketTiers.find(tier => tier.id === id);
        
        // If changing quantity, validate against venue capacity
        if (field === 'quantity' && selectedVenue && selectedVenue.capacity > 0) {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue > 0) {
                // Calculate total quantity excluding the current tier being changed
                const otherTiersTotal = ticketTiers
                    .filter(tier => tier.id !== id)
                    .reduce((sum, tier) => sum + (parseInt(tier.quantity, 10) || 0), 0);
                
                const newTotal = otherTiersTotal + numValue;
                
                // Prevent exceeding venue capacity
                if (newTotal > selectedVenue.capacity) {
                    const maxAllowed = selectedVenue.capacity - otherTiersTotal;
                    setErrors(prev => ({
                        ...prev,
                        ticketTiers: {
                            ...prev.ticketTiers,
                            [id]: {
                                ...prev.ticketTiers?.[id],
                                quantity: `Maximum ${maxAllowed} tickets allowed (venue capacity: ${selectedVenue.capacity.toLocaleString()})`
                            }
                        }
                    }));
                    return; // Don't update the value
                }
                
                // Prevent individual tier from exceeding venue capacity
                if (numValue > selectedVenue.capacity) {
                    setErrors(prev => ({
                        ...prev,
                        ticketTiers: {
                            ...prev.ticketTiers,
                            [id]: {
                                ...prev.ticketTiers?.[id],
                                quantity: `Cannot exceed venue capacity of ${selectedVenue.capacity.toLocaleString()}`
                            }
                        }
                    }));
                    return; // Don't update the value
                }
            }
        }
        
        // If changing price, validate it's not negative
        if (field === 'price') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue < 0) {
                setErrors(prev => ({
                    ...prev,
                    ticketTiers: {
                        ...prev.ticketTiers,
                        [id]: {
                            ...prev.ticketTiers?.[id],
                            price: "Price cannot be negative"
                        }
                    }
                }));
                return; // Don't update negative prices
            }
        }
        
        setTicketTiers(prevTiers =>
            prevTiers.map(tier =>
                tier.id === id ? { ...tier, [field]: value } : tier
            )
        );
        
        // Update seat assignments if tier name changed
        if (field === 'tierName' && oldTier && oldTier.tierName !== value) {
            const newSeatAssignments = { ...seatAssignments };
            Object.keys(newSeatAssignments).forEach(seatId => {
                if (newSeatAssignments[seatId] === oldTier.tierName) {
                    newSeatAssignments[seatId] = value;
                }
            });
            setSeatAssignments(newSeatAssignments);
        }
        
        // Clear errors for this field if value is being updated successfully
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
        const newId = nextTierId.current; // Get current ID
        nextTierId.current += 1;        // Increment for next time
        setTicketTiers([...ticketTiers, { id: newId, tierName: '', price: '', quantity: '' }]);
    };

    const removeTier = (idToRemove) => { /* ... same as before ... */
        if (ticketTiers.length > 1) {
            const tierToRemove = ticketTiers.find(tier => tier.id === idToRemove);
            setTicketTiers(ticketTiers.filter(tier => tier.id !== idToRemove));
            
            // Clean up seat assignments that reference the removed tier
            if (tierToRemove) {
                const newSeatAssignments = { ...seatAssignments };
                Object.keys(newSeatAssignments).forEach(seatId => {
                    if (newSeatAssignments[seatId] === tierToRemove.tierName) {
                        delete newSeatAssignments[seatId];
                    }
                });
                setSeatAssignments(newSeatAssignments);
            }
        } else {
            alert("You must have at least one ticket tier.");
        }
    };

    const handleImageUpload = (event) => { /* ... same as before ... */
        const files = Array.from(event.target.files);
        const newImages = files.map((file) => ({
            id: Date.now() + Math.random(), // This can remain as is for image previews
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

    const removeImage = (imageId) => { /* ... same as before ... */
        const imageToRemove = formData.images.find(img => img.id === imageId);
        if (imageToRemove && imageToRemove.url.startsWith('blob:')) {
            URL.revokeObjectURL(imageToRemove.url);
        }
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((img) => img.id !== imageId),
        }));
    };

    const handleVenueRequest = async () => { /* ... */ };

    const validateForm = () => {
        const newErrors = {};
        // Basic event info validation
        if (!formData.title.trim()) newErrors.title = "Event title is required";
        if (!formData.description.trim()) newErrors.description = "Event description is required";
        if (!formData.eventType) newErrors.eventType = "Event type is required";
        if (!formData.startDate) newErrors.startDate = "Start date is required";
        if (!formData.startTime) newErrors.startTime = "Start time is required";
        if (!formData.endDate) newErrors.endDate = "End date is required";
        if (!formData.endTime) newErrors.endTime = "End time is required";

        if (formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
            newErrors.endDate = "End date cannot be before start date.";
        }
        if (formData.endDate && formData.startDate && formData.endTime && formData.startTime &&
            formData.endDate.getTime() === formData.startDate.getTime() && formData.endTime <= formData.startTime) {
            newErrors.endTime = "End time must be after start time on the same day.";
        }


        if (!formData.venue) newErrors.venue = "Venue selection is required";
        if (formData.images.length === 0) newErrors.images = "At least one image is required";

        // Ticket Tiers Validation
        let totalTierQuantity = 0;
        const tierErrors = {}; // This will store errors by tier.id
        let hasTierError = false;
        if (!ticketTiers || ticketTiers.length === 0) {
            newErrors.ticketTiersGeneral = "At least one ticket tier is required."; // General error for tiers
            hasTierError = true; // To prevent form submission
        } else {
            ticketTiers.forEach(tier => {
                const currentTierErrors = {};
                if (!tier.tierName.trim()) {
                    currentTierErrors.tierName = "Tier name is required.";
                    hasTierError = true;
                }
                if (!tier.price || parseFloat(tier.price) < 0) { // Allow 0 for free tiers
                    currentTierErrors.price = "Price must be a non-negative number.";
                    hasTierError = true;
                }
                if (!tier.quantity || parseInt(tier.quantity, 10) <= 0) {
                    currentTierErrors.quantity = "Quantity must be a positive integer.";
                    hasTierError = true;
                } else {
                    const quantity = parseInt(tier.quantity, 10);
                    totalTierQuantity += quantity;
                    
                    // Validate individual tier quantity against venue capacity
                    if (selectedVenue && selectedVenue.capacity > 0 && quantity > selectedVenue.capacity) {
                        currentTierErrors.quantity = `Tier quantity (${quantity.toLocaleString()}) cannot exceed venue capacity (${selectedVenue.capacity.toLocaleString()}).`;
                        hasTierError = true;
                    }
                }
                if (Object.keys(currentTierErrors).length > 0) {
                    tierErrors[tier.id] = currentTierErrors;
                }
            });
        }
        if (hasTierError) {
            newErrors.ticketTiers = tierErrors; // Store all tier-specific errors
        }

        // Validate total ticket quantity against venue capacity
        if (selectedVenue && selectedVenue.capacity > 0 && totalTierQuantity > selectedVenue.capacity) {
            newErrors.ticketTiersGeneral = `Total ticket quantity (${totalTierQuantity.toLocaleString()}) cannot exceed venue capacity (${selectedVenue.capacity.toLocaleString()}).`;
        }
        
        // Special validation for seated venues with zero capacity
        if (selectedVenue && selectedVenue.capacity === 0 && totalTierQuantity > 0 && selectedVenue.isSeated) {
            newErrors.ticketTiersGeneral = `This seated venue has a capacity of 0. Please check venue details or contact support.`;
        }
        
        // For non-seated venues, warn if total tickets significantly exceed capacity
        if (selectedVenue && !selectedVenue.isSeated && selectedVenue.capacity > 0 && totalTierQuantity > selectedVenue.capacity * 1.1) {
            newErrors.ticketTiersGeneral = `Warning: Total tickets (${totalTierQuantity.toLocaleString()}) significantly exceed venue capacity (${selectedVenue.capacity.toLocaleString()}). This may cause overcrowding.`;
        }

        // Validate seat assignments for seated venues
        if (selectedVenue && selectedVenue.isSeated) {
            const assignedSeats = Object.keys(seatAssignments).length;
            if (assignedSeats === 0) {
                newErrors.seatAssignments = "Please assign tiers to seats for this seated venue.";
            } else {
                // Validate that all assigned tiers exist in ticket tiers
                const tierNames = ticketTiers.map(tier => tier.tierName);
                const invalidAssignments = Object.values(seatAssignments).filter(tierName => !tierNames.includes(tierName));
                if (invalidAssignments.length > 0) {
                    newErrors.seatAssignments = "Some seat assignments reference invalid tier names.";
                }
                
                // Validate that seat assignments don't exceed ticket quantities
                const assignmentCounts = {};
                Object.values(seatAssignments).forEach(tierName => {
                    assignmentCounts[tierName] = (assignmentCounts[tierName] || 0) + 1;
                });
                
                const overAssignedTiers = [];
                ticketTiers.forEach(tier => {
                    const assignedCount = assignmentCounts[tier.tierName] || 0;
                    const ticketQuantity = parseInt(tier.quantity, 10) || 0;
                    if (assignedCount > ticketQuantity) {
                        overAssignedTiers.push(`${tier.tierName} (${assignedCount} seats assigned, ${ticketQuantity} tickets available)`);
                    }
                });
                
                if (overAssignedTiers.length > 0) {
                    newErrors.seatAssignments = `The following tiers have more assigned seats than available tickets: ${overAssignedTiers.join(', ')}. Please adjust seat assignments or increase ticket quantities.`;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => { /* ... same as before, it correctly strips the 'id' from tiers ... */
        e.preventDefault();

        if (!user || !user.account_id) {
            setErrors(prev => ({ ...prev, formApi: "User not authenticated or account ID missing. Cannot create event." }));
            alert("Authentication error. Please log in again.");
            return;
        }


        if (!validateForm()) {
            // Let user see inline errors, maybe set a general form error too
            setErrors(prev => ({ ...prev, formApi: "Please correct the errors in the form."}));
            return;
        }
        setIsSubmitting(true);
        setErrors(prev => ({ ...prev, formApi: null })); // Clear previous general form error


        const data = new FormData();

        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('eventType', formData.eventType);
        if (formData.startDate) data.append('startDate', format(formData.startDate, "yyyy-MM-dd"));
        data.append('startTime', formData.startTime);
        if (formData.endDate) data.append('endDate', format(formData.endDate, "yyyy-MM-dd"));
        data.append('endTime', formData.endTime);
        data.append('venue', formData.venue);
        if (formData.rules) data.append('rules', formData.rules);

        data.append('organizerAccountId', user.account_id.toString());

        // Exclude temporary client-side 'id' from each tier object
        data.append('ticketTiersData', JSON.stringify(ticketTiers.map(({ id, ...rest }) => rest)));

        // Add seat assignments for seated venues
        if (selectedVenue && selectedVenue.isSeated && Object.keys(seatAssignments).length > 0) {
            data.append('seatAssignments', JSON.stringify(seatAssignments));
        }

        formData.images.forEach(imageObj => {
            data.append('images', imageObj.file, imageObj.name);
        });

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
            setErrors(prev => ({ ...prev, formApi: errorMsg })); // Display API error
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
                {/* Conditional rendering for auth/role can be added here if desired */}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information Card */}
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
                                        <SelectContent>{eventTypes.map((type) => (<SelectItem key={type} value={type}>{eventTypeLabels[type]}</SelectItem>))}</SelectContent>
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

                    {/* Date and Time Card */}
                    <Card>
                        <CardHeader><CardTitle>Date and Time</CardTitle><CardDescription>When will your event take place?</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Date/Time inputs as provided */}
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

                    {/* Venue Selection Card */}
                    <Card>
                        <CardHeader><CardTitle>Venue</CardTitle>
                            <CardDescription>
                                Choose your event venue.
                                {selectedVenue && ` Selected: ${selectedVenue.name} (Capacity: ${selectedVenue.capacity?.toLocaleString() || 'N/A'}${selectedVenue.isSeated ? ", Seated" : ", GA"})`}
                            </CardDescription>
                        </CardHeader>
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
                                                    <span className="text-sm text-muted-foreground"> {v.address} • Capacity: {v.capacity?.toLocaleString() || 'N/A'} {v.isSeated ? "(Seated)" : "(GA)"}</span>
                                                </div>
                                            </SelectItem>
                                        )) : <SelectItem value="loading" disabled>Loading venues...</SelectItem>}
                                    </SelectContent>
                                </Select>
                                {errors.venue && <p className="text-sm text-red-500">{errors.venue}</p>}
                                {errors.venuesApi && <p className="text-sm text-red-500">{errors.venuesApi}</p>}
                            </div>
                            <Alert><MapPin className="h-4 w-4" /><AlertDescription> Can't find your venue?{" "} <Dialog open={isVenueDialogOpen} onOpenChange={setIsVenueDialogOpen}><DialogTrigger asChild><Button variant="link" className="p-0 h-auto"> Request a new venue </Button></DialogTrigger><DialogContent> {/* ... Venue Request Dialog ... */} </DialogContent></Dialog> </AlertDescription></Alert>
                        </CardContent>
                    </Card>

                    {/* Ticket Tiers Pricing Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Tiers & Pricing</CardTitle>
                            <CardDescription>
                                Define different ticket tiers for your event.
                                {selectedVenue && selectedVenue.isSeated === false && " For non-seated venues, these will be General Admission tiers."}
                                {selectedVenue && selectedVenue.isSeated && " For seated venues, you'll assign these tiers to specific seats in the next step."}
                                {selectedVenue && ` Max venue capacity: ${selectedVenue.capacity?.toLocaleString() || 'N/A'}. ${selectedVenue.isSeated ? 'Assign tiers to seats below.' : 'Ensure total ticket quantity doesn\'t exceed this.'}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {errors.ticketTiersGeneral && <Alert variant="destructive"><AlertDescription>{errors.ticketTiersGeneral}</AlertDescription></Alert>}
                            
                            {/* Capacity Indicator */}
                            {selectedVenue && selectedVenue.capacity > 0 && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium">Total Tickets vs Venue Capacity:</span>
                                        <span className={`font-bold ${
                                            (() => {
                                                const total = ticketTiers.reduce((sum, tier) => sum + (parseInt(tier.quantity, 10) || 0), 0);
                                                return total > selectedVenue.capacity ? 'text-red-600' : 
                                                       total > selectedVenue.capacity * 0.9 ? 'text-yellow-600' : 'text-green-600';
                                            })()
                                        }`}>
                                            {ticketTiers.reduce((sum, tier) => sum + (parseInt(tier.quantity, 10) || 0), 0).toLocaleString()} / {selectedVenue.capacity.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                                        <span>Remaining capacity:</span>
                                        <span className="font-medium">
                                            {Math.max(0, selectedVenue.capacity - ticketTiers.reduce((sum, tier) => sum + (parseInt(tier.quantity, 10) || 0), 0)).toLocaleString()} tickets
                                        </span>
                                    </div>
                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                (() => {
                                                    const total = ticketTiers.reduce((sum, tier) => sum + (parseInt(tier.quantity, 10) || 0), 0);
                                                    const percentage = (total / selectedVenue.capacity) * 100;
                                                    return percentage > 100 ? 'bg-red-500' : 
                                                           percentage > 90 ? 'bg-yellow-500' : 'bg-green-500';
                                                })()
                                            }`}
                                            style={{
                                                width: `${Math.min(
                                                    (ticketTiers.reduce((sum, tier) => sum + (parseInt(tier.quantity, 10) || 0), 0) / selectedVenue.capacity) * 100,
                                                    100
                                                )}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {ticketTiers.map((tier, index) => (
                                <Card key={tier.id} className="p-4 space-y-3 bg-muted/40"> {/* Use key={tier.id} */}
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base font-semibold">Tier {index + 1}</Label>
                                        {ticketTiers.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeTier(tier.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-4 w-4 mr-1" /> Remove
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 items-start">
                                        <div className="space-y-1 md:col-span-1">
                                            <Label htmlFor={`tierName-${tier.id}`}>Tier Name *</Label>
                                            <Input
                                                id={`tierName-${tier.id}`}
                                                value={tier.tierName}
                                                onChange={(e) => handleTierChange(tier.id, 'tierName', e.target.value)}
                                                placeholder="e.g., General, VIP"
                                                className={errors.ticketTiers?.[tier.id]?.tierName ? "border-red-500" : ""}
                                            />
                                            {errors.ticketTiers?.[tier.id]?.tierName && <p className="text-xs text-red-500 mt-1">{errors.ticketTiers[tier.id].tierName}</p>}
                                        </div>
                                        <div className="space-y-1 md:col-span-1">
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
                                            {errors.ticketTiers?.[tier.id]?.price && <p className="text-xs text-red-500 mt-1">{errors.ticketTiers[tier.id].price}</p>}
                                        </div>
                                        <div className="space-y-1 md:col-span-1">
                                            <Label htmlFor={`quantity-${tier.id}`}>Quantity *</Label>
                                            <div className="relative">
                                                <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id={`quantity-${tier.id}`}
                                                    type="number"
                                                    value={tier.quantity}
                                                    onChange={(e) => handleTierChange(tier.id, 'quantity', e.target.value)}
                                                    onInput={(e) => {
                                                        // Prevent typing values that exceed remaining venue capacity
                                                        if (selectedVenue && selectedVenue.capacity > 0) {
                                                            const inputValue = parseInt(e.target.value, 10);
                                                            const remainingCapacity = getRemainingCapacity(tier.id);
                                                            
                                                            if (!isNaN(inputValue) && inputValue > remainingCapacity) {
                                                                e.target.value = remainingCapacity.toString();
                                                            }
                                                        }
                                                    }}
                                                    placeholder="0"
                                                    min="1"
                                                    max={selectedVenue && selectedVenue.capacity > 0 ? getRemainingCapacity(tier.id) : undefined}
                                                    step="1"
                                                    className={`pl-8 ${errors.ticketTiers?.[tier.id]?.quantity ? "border-red-500" : ""}`}
                                                />
                                            </div>
                                            {errors.ticketTiers?.[tier.id]?.quantity && <p className="text-xs text-red-500 mt-1">{errors.ticketTiers[tier.id].quantity}</p>}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <Button type="button" variant="outline" onClick={addTier} className="w-full mt-2">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Ticket Tier
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Seat Assignment Card - only show for seated venues */}
                    {selectedVenue && selectedVenue.isSeated && (
                        <SeatAssignment 
                            selectedVenue={selectedVenue}
                            ticketTiers={ticketTiers}
                            seatAssignments={seatAssignments}
                            setSeatAssignments={setSeatAssignments}
                            errors={errors}
                        />
                    )}

                    {/* Event Images Card */}
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


                    {/* Additional Information Card */}
                    <Card>
                        <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="rules">Event Rules</Label>
                                <Textarea id="rules" value={formData.rules} onChange={(e) => handleInputChange("rules", e.target.value)} placeholder="List any rules or guidelines for attendees" rows={3} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    {errors.formApi && (<Alert variant="destructive" className="mt-4"><AlertDescription>{errors.formApi}</AlertDescription></Alert>)}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild> <Link to="/my-events">Cancel</Link> </Button>
                        <Button type="submit" disabled={isSubmitting || !user || user.role !== 'organizer'}> {isSubmitting ? "Creating Event..." : "Create Event"} </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default CreateEvent;