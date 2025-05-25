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
import VenueRequestLayoutPreview from '@/components/VenueRequestLayoutPreview.jsx'; // Adjust path
import {
    Dialog,
    DialogContent,
    DialogDescription, // Not used in your current JSX for venue request
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog.jsx";
import { Alert, AlertDescription } from "@/components/ui/alert.jsx";
import { CalendarIcon, Upload, X, MapPin, PlusCircle, Trash2, DollarSign, Hash, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { format } from "date-fns";
// import { v4 as uuidv4 } from 'uuid'; // REMOVE THIS LINE
import apiClient from "@/helpers/apiCore.js";
import { useAuth } from "@/contexts/AuthContext.jsx";
import SeatAssignment from "@/components/SeatAssignment.jsx";
import { useToast } from "@/hooks/use-toast";

const CreateEvent = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

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

    // Initialize the first tier with an ID from the ref
    const getInitialTier = () => {
        const id = nextTierId.current;
        nextTierId.current += 1;
        return { id: id, tierName: '', price: '', quantity: '' };
    };

    const [ticketTiers, setTicketTiers] = useState([getInitialTier()]);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [isVenueDialogOpen, setIsVenueDialogOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [venues, setVenues] = useState([]);
    const [venueRequest, setVenueRequest] = useState({
        name: "",
        address: "",
        city: "",
        capacity: "",
        is_seated: false,
        requested_layout_rows: '',
        requested_layout_cols: '',
        description: "",
    });
    const [seatAssignments, setSeatAssignments] = useState({});

    const resetForm = () => {
        setFormData({
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
        setTicketTiers([getInitialTier()]);
        setSelectedVenue(null);
        setSeatAssignments({});
        setErrors({});
    };

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

    const handleTierChange = (id, field, value) => { /* ... same as before ... */
        const oldTier = ticketTiers.find(tier => tier.id === id);

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
                    totalTierQuantity += parseInt(tier.quantity, 10);
                }
                if (Object.keys(currentTierErrors).length > 0) {
                    tierErrors[tier.id] = currentTierErrors;
                }
            });
        }
        if (hasTierError) {
            newErrors.ticketTiers = tierErrors; // Store all tier-specific errors
        }


        if (selectedVenue && selectedVenue.capacity > 0 && totalTierQuantity > selectedVenue.capacity) {
            newErrors.ticketTiersGeneral = `Total quantity of tickets (${totalTierQuantity.toLocaleString()}) cannot exceed venue capacity (${selectedVenue.capacity.toLocaleString()}).`;
        }
        if (selectedVenue && selectedVenue.capacity === 0 && totalTierQuantity > 0 && selectedVenue.isSeated) {
            newErrors.ticketTiersGeneral = `This seated venue has a capacity of 0. Please check venue details.`;
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
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateVenueRequest = () => {
        const newVRErrors = {};
        if (!venueRequest.name.trim()) newVRErrors.name = "Venue name is required.";
        if (!venueRequest.address.trim()) newVRErrors.address = "Address is required.";
        if (!venueRequest.city.trim()) newVRErrors.city = "City is required.";
        if (!venueRequest.capacity.trim()) newVRErrors.capacity = "Estimated capacity is required."; // Capacity is TEXT in DB, so simple trim check

        if (venueRequest.is_seated) {
            if (!venueRequest.requested_layout_rows || parseInt(venueRequest.requested_layout_rows, 10) <= 0) {
                newVRErrors.requested_layout_rows = "Number of rows must be a positive integer for seated venues.";
            }
            if (!venueRequest.requested_layout_cols || parseInt(venueRequest.requested_layout_cols, 10) <= 0) {
                newVRErrors.requested_layout_cols = "Number of seats per row must be a positive integer for seated venues.";
            }
        }
        setErrors(prev => ({ ...prev, venueRequest: newVRErrors }));
        return Object.keys(newVRErrors).length === 0;
    };

    const submitVenueRequest = async () => {
        if (!validateVenueRequest()) {
            setErrors(prev => ({ ...prev, venueRequest: { ...prev.venueRequest, form: "Please correct the errors above." }}));
            return;
        }

        setIsSubmitting(true);
        setErrors(prev => ({ ...prev, venueRequest: { ...prev.venueRequest, form: null }}));

        const payload = {
            name: venueRequest.name,
            address: venueRequest.address,
            city: venueRequest.city,
            capacity: venueRequest.capacity,
            is_seated: venueRequest.is_seated,
            notes: venueRequest.description,
            organizer_account_id: user.account_id,
        };

        if (venueRequest.is_seated) {
            payload.requested_layout_rows = parseInt(venueRequest.requested_layout_rows, 10);
            payload.requested_layout_cols = parseInt(venueRequest.requested_layout_cols, 10);
        }

        try {
            console.log(payload);
            await apiClient.post("/venue/request", payload);
            toast({
                title: "Success!",
                description: "Venue request submitted successfully! An admin will review it shortly.",
            });
            setIsVenueDialogOpen(false);
            setVenueRequest({name: "", address: "", city: "", capacity: "", is_seated: false, requested_layout_rows: '', requested_layout_cols: '', description: ""});
        } catch (error) {
            console.error("Error submitting venue request:", error);
            setErrors(prev => ({ ...prev, venueRequest: { ...prev.venueRequest, form: error.data?.message || "Failed to submit venue request." }}));
            toast({
                variant: "destructive",
                title: "Error",
                description: error.data?.message || "There was an issue submitting your venue request. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !user.account_id) {
            setErrors(prev => ({ ...prev, formApi: "User not authenticated or account ID missing. Cannot create event." }));
            toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "Please log in again.",
            });
            return;
        }

        if (!validateForm()) {
            setErrors(prev => ({ ...prev, formApi: "Please correct the errors in the form."}));
            return;
        }

        setIsLoading(true);
        setIsSubmitting(true);
        setErrors(prev => ({ ...prev, formApi: null }));

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
            
            toast({
                title: "Success!",
                description: "Event created successfully!",
            });
            
            // Reset the form after successful creation
            resetForm();
            
        } catch (error) {
            console.error("Error creating event:", error);
            const errorMsg = error.data?.message || error.message || "Error creating event. Please try again.";
            setErrors(prev => ({ ...prev, formApi: errorMsg }));
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMsg,
            });
        } finally {
            setIsLoading(false);
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <p className="ml-4 text-xl">Creating your event...</p>
                </div>
            </Layout>
        );
    }

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

                    <Dialog open={isVenueDialogOpen} onOpenChange={setIsVenueDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="link" className="p-0 h-auto"> Request a new venue </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] flex flex-col"> {/* Max width and height, flex col */}
                            <DialogHeader>
                                <DialogTitle>Request New Venue</DialogTitle>
                                <DialogDescription>
                                    Fill in the details for the venue you'd like to request. An admin will review it.
                                </DialogDescription>
                            </DialogHeader>

                            {/* Scrollable content area */}
                            <div className="grid gap-4 py-4 overflow-y-auto px-1"> {/* Added overflow-y-auto and some padding */}
                                {/* Name */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="vr-name" className="text-right">Name *</Label>
                                    <Input id="vr-name" value={venueRequest.name} onChange={(e) => setVenueRequest(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" placeholder="Venue Name" />
                                </div>
                                {errors.venueRequest?.name && <p className="col-start-2 col-span-3 text-sm text-red-500 -mt-2">{errors.venueRequest.name}</p>}

                                {/* Address */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="vr-address" className="text-right">Address *</Label>
                                    <Input id="vr-address" value={venueRequest.address} onChange={(e) => setVenueRequest(prev => ({ ...prev, address: e.target.value }))} className="col-span-3" placeholder="Full Street Address" />
                                </div>
                                {errors.venueRequest?.address && <p className="col-start-2 col-span-3 text-sm text-red-500 -mt-2">{errors.venueRequest.address}</p>}

                                {/* City */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="vr-city" className="text-right">City *</Label>
                                    <Input id="vr-city" value={venueRequest.city} onChange={(e) => setVenueRequest(prev => ({ ...prev, city: e.target.value }))} className="col-span-3" placeholder="City" />
                                </div>
                                {errors.venueRequest?.city && <p className="col-start-2 col-span-3 text-sm text-red-500 -mt-2">{errors.venueRequest.city}</p>}

                                {/* Est. Capacity */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="vr-capacity" className="text-right">Est. Capacity *</Label>
                                    <Input id="vr-capacity" type="text" value={venueRequest.capacity} onChange={(e) => setVenueRequest(prev => ({ ...prev, capacity: e.target.value }))} className="col-span-3" placeholder="e.g., 500 or 500-700" />
                                </div>
                                {errors.venueRequest?.capacity && <p className="col-start-2 col-span-3 text-sm text-red-500 -mt-2">{errors.venueRequest.capacity}</p>}

                                {/* Seating Type Checkbox */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="vr-is_seated" className="text-right">Seating Type</Label>
                                    <div className="col-span-3 flex items-center space-x-2">
                                        <input type="checkbox" id="vr-is_seated" checked={venueRequest.is_seated} onChange={(e) => setVenueRequest(prev => ({ ...prev, is_seated: e.target.checked, requested_layout_rows: e.target.checked ? prev.requested_layout_rows : '', requested_layout_cols: e.target.checked ? prev.requested_layout_cols : ''}))} />
                                        <Label htmlFor="vr-is_seated">This is a seated venue</Label>
                                    </div>
                                </div>

                                {/* Conditional Section for Seated Venue Layout */}
                                {venueRequest.is_seated && (
                                    <div className="col-span-4 space-y-4 border-t pt-4 mt-2">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="vr-rows" className="text-right">Layout Rows *</Label>
                                            <Input 
                                                id="vr-rows" 
                                                type="number" 
                                                value={venueRequest.requested_layout_rows}
                                                onChange={(e) => setVenueRequest(prev => ({ ...prev, requested_layout_rows: e.target.value }))}
                                                className="col-span-3" 
                                                placeholder="e.g., 10" 
                                                min="1"
                                            />
                                        </div>
                                        {errors.venueRequest?.requested_layout_rows && (
                                            <p className="col-start-2 col-span-3 text-sm text-red-500 -mt-2">
                                                {errors.venueRequest.requested_layout_rows}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="vr-cols" className="text-right">Seats per Row *</Label>
                                            <Input 
                                                id="vr-cols" 
                                                type="number" 
                                                value={venueRequest.requested_layout_cols}
                                                onChange={(e) => setVenueRequest(prev => ({ ...prev, requested_layout_cols: e.target.value }))}
                                                className="col-span-3" 
                                                placeholder="e.g., 20" 
                                                min="1"
                                            />
                                        </div>
                                        {errors.venueRequest?.requested_layout_cols && (
                                            <p className="col-start-2 col-span-3 text-sm text-red-500 -mt-2">
                                                {errors.venueRequest.requested_layout_cols}
                                            </p>
                                        )}

                                        {/* Render the preview if dimensions are valid numbers > 0 */}
                                        {(parseInt(venueRequest.requested_layout_rows, 10) > 0 && parseInt(venueRequest.requested_layout_cols, 10) > 0) && (
                                            <div className="col-span-4 mt-2">
                                                <VenueRequestLayoutPreview
                                                    rows={parseInt(venueRequest.requested_layout_rows, 10)}
                                                    cols={parseInt(venueRequest.requested_layout_cols, 10)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Notes */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="vr-description" className="text-right">Notes</Label>
                                    <Textarea 
                                        id="vr-description" 
                                        value={venueRequest.description} 
                                        onChange={(e) => setVenueRequest(prev => ({ ...prev, description: e.target.value }))} 
                                        className="col-span-3" 
                                        placeholder="Any additional details or notes..." 
                                    />
                                </div>
                                {errors.venueRequest?.form && (
                                    <p className="col-start-2 col-span-3 text-sm text-red-500 -mt-2">
                                        {errors.venueRequest.form}
                                    </p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsVenueDialogOpen(false)} 
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={submitVenueRequest} 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Submit Request
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

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
                            {errors.ticketTiersGeneral && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errors.ticketTiersGeneral}</AlertDescription>
                                </Alert>
                            )}
                            {ticketTiers.map((tier, index) => (
                                <Card key={tier.id} className="p-4 space-y-3 bg-muted/40">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base font-semibold">Tier {index + 1}</Label>
                                        {ticketTiers.length > 1 && (
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => removeTier(tier.id)} 
                                                className="text-red-500 hover:text-red-700"
                                            >
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
                                            {errors.ticketTiers?.[tier.id]?.tierName && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.ticketTiers[tier.id].tierName}
                                                </p>
                                            )}
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
                                            {errors.ticketTiers?.[tier.id]?.price && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.ticketTiers[tier.id].price}
                                                </p>
                                            )}
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
                                                    placeholder="0"
                                                    min="1"
                                                    step="1"
                                                    className={`pl-8 ${errors.ticketTiers?.[tier.id]?.quantity ? "border-red-500" : ""}`}
                                                />
                                            </div>
                                            {errors.ticketTiers?.[tier.id]?.quantity && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.ticketTiers[tier.id].quantity}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={addTier} 
                                className="w-full mt-2"
                            >
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
                                        <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                                    </Label>
                                </div>
                                {errors.images && (
                                    <p className="text-sm text-red-500">{errors.images}</p>
                                )}
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

                    {/* Additional Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
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
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    {errors.formApi && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertDescription>{errors.formApi}</AlertDescription>
                        </Alert>
                    )}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link to="/my-events">Cancel</Link>
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting || !user || user.role !== 'organizer'}
                        >
                            {isSubmitting ? "Creating Event..." : "Create Event"}
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default CreateEvent;