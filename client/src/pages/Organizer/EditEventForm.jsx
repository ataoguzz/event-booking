import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Calendar } from "@/components/ui/calendar.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx";
import { Alert, AlertDescription } from "@/components/ui/alert.jsx";
import { CalendarIcon, Upload, X, MapPin, PlusCircle, Trash2, DollarSign, Hash } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { format, parseISO } from "date-fns";
import apiClient from "@/helpers/apiCore.js";
import { useAuth } from "@/contexts/AuthContext.jsx";

const SERVER_BASE_URL = 'http://localhost:3001';

const mapCategoryToType = (category) => {
    const mapping = {
        'CONCERT': 'Concert',
        'THEATER': 'Theater',
        'STANDUP': 'Stand-up Comedy',
        'CONFERENCE': 'Conference',
        'WORKSHOP': 'Workshop',
        'FESTIVAL': 'Festival',
        'SPORTS': 'Sports Event',
        'OTHER': 'Other',
    };
    return mapping[category.toUpperCase()] || 'Other';
};


const EditEventForm = ({ eventToEdit, onClose, onEventSaved }) => {
    const { user } = useAuth(); // To get organizerAccountId if needed for the PUT request body

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        eventType: "",
        startDate: null,
        endDate: null,
        startTime: "",
        endTime: "",
        venue: "", // venue ID
        rules: "",
        // Images and Tiers will be handled by separate states
    });

    const [images, setImages] = useState([]); // For managing existing and new images
    // Structure: { id: string | number, file?: File, url: string, name: string, isNew?: boolean, markedForDeletion?: boolean }
    const [ticketTiers, setTicketTiers] = useState([]); // [{ id: string (from DB or new), tierName: '', price: '', quantity: '', _originalId?: number (for existing tiers) }]

    const [venues, setVenues] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const nextTierClientId = useRef(1); // For new client-side tiers

    // Pre-fill form when eventToEdit data is available
    useEffect(() => {
        if (eventToEdit) {
            setFormData({
                title: eventToEdit.title || "",
                description: eventToEdit.description || "",
                eventType: eventToEdit.category ? mapCategoryToType(eventToEdit.category) : "",
                startDate: eventToEdit.start_at ? parseISO(eventToEdit.start_at) : null,
                endDate: eventToEdit.end_at ? parseISO(eventToEdit.end_at) : null,
                startTime: eventToEdit.start_at ? format(parseISO(eventToEdit.start_at), 'HH:mm') : "",
                endTime: eventToEdit.end_at ? format(parseISO(eventToEdit.end_at), 'HH:mm') : "",
                venue: eventToEdit.venue_id?.toString() || "",
                rules: eventToEdit.rules || "",
            });

            setImages(
                eventToEdit.images?.map(img => ({
                    id: img.image_id, // Use DB image_id as key
                    url: `${SERVER_BASE_URL}${img.url}`,
                    name: img.caption || 'event_image',
                    isNew: false,
                    markedForDeletion: false,
                })) || []
            );

            setTicketTiers(
                eventToEdit.ticket_tiers?.map(tier => ({
                    id: tier.tier_id, // Use existing DB tier_id for updates
                    tierName: tier.tier_name,
                    price: tier.price.toString(),
                    quantity: tier.quantity.toString(),
                    // _originalId: tier.tier_id, // Keep track of original ID for backend matching
                })) || [{ id: `new-${nextTierClientId.current++}`, tierName: '', price: '', quantity: '' }] // Default if no tiers
            );

            const SVenue = venues.find(v => v.id.toString() === eventToEdit.venue_id?.toString());
            setSelectedVenue(SVenue || null);
        }
    }, [eventToEdit, venues]);

    console.log("edip1");
    console.log(eventToEdit);
    console.log(formData);

    useEffect(() => { // Fetch venues for the dropdown
        const fetchVenues = async () => {
            try {
                const response = await apiClient.get("/venues/venues");
                setVenues(response.data || []);
            } catch (error) {
                console.error("Error fetching venues for edit form:", error);
                setErrors(prev => ({ ...prev, venuesApi: "Could not load venues." }));
            }
        };
        fetchVenues();
    }, []);

    const handleInputChange = (field, value) => {
        if (field === 'venue') {
            const SVenue = venues.find(v => v.id.toString() === value);
            setSelectedVenue(SVenue || null);
            // Potentially reset/re-evaluate ticket tiers if venue changes capacity logic
        }
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handleTierChange = (id, field, value) => {
        setTicketTiers(prevTiers =>
            prevTiers.map(tier => (tier.id === id ? { ...tier, [field]: value } : tier))
        );
        // Simplified error clearing
        if(errors.ticketTiers && errors.ticketTiers[id] && errors.ticketTiers[id][field]) {
            setErrors(prev => ({...prev, ticketTiers: {...prev.ticketTiers, [id]: {...prev.ticketTiers[id], [field]: null}}}));
        }
    };

    const addTier = () => {
        setTicketTiers([...ticketTiers, { id: `new-${nextTierClientId.current++}`, tierName: '', price: '', quantity: '' }]);
    };

    const removeTier = (id) => {
        if (ticketTiers.length > 1) {
            setTicketTiers(ticketTiers.filter(tier => tier.id !== id));
        } else {
            alert("An event must have at least one ticket tier.");
        }
    };

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        const newImageObjects = files.map(file => ({
            id: `new-${file.name}-${Date.now()}`, // Temp client ID
            file,
            url: URL.createObjectURL(file),
            name: file.name,
            isNew: true,
        }));
        setImages(prev => [...prev, ...newImageObjects].slice(0, 10)); // Example limit
    };

    const markImageForDeletion = (id) => {
        setImages(prev =>
            prev.map(img => (img.id === id ? { ...img, markedForDeletion: !img.markedForDeletion } : img))
        );
    };
    const removeNewImage = (id) => { // For images not yet saved
        setImages(prev => prev.filter(img => !(img.id === id && img.isNew)));
    };

    const validateForm = () => {
        // ... (Similar validation logic as CreateEvent, adapt for edit)
        // Ensure total tier quantity respects selectedVenue.capacity
        // Return true/false
        return true; // Placeholder
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !user.account_id || user.role !== 'organizer') {
            alert("Authentication or Authorization issue."); return;
        }
        if (!validateForm()) {
            setErrors(prev => ({...prev, formApi: "Please correct errors."})); return;
        }
        setIsSubmitting(true);
        setErrors(prev => ({...prev, formApi: null}));

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                if (key === 'startDate' || key === 'endDate') {
                    if (formData[key] instanceof Date) {
                        data.append(key, format(formData[key], "yyyy-MM-dd"));
                    } else {
                        data.append(key, formData[key]);
                    }
                } else {
                    data.append(key, formData[key]);
                }
            }
        });
        data.append('organizerAccountId', user.account_id.toString()); // As per earlier convention

        const finalTicketTiers = ticketTiers.map(tier => {
            const { id, ...rest } = tier; // Remove client-side temporary 'id' if it's a new one
            if (typeof id === 'string' && id.startsWith('new-')) {
                return { ...rest }; // New tier, backend will assign tier_id
            }
            return { tier_id: id, ...rest }; // Existing tier, send its tier_id for update/matching
        });
        data.append('ticketTiersData', JSON.stringify(finalTicketTiers));

        for (let pair of data.entries()) {
            console.log('FormData for PUT:', pair[0] + ': ' + pair[1]);
        }
        // Image handling for FormData:
        const imagesToKeepIds = images.filter(img => !img.isNew && !img.markedForDeletion).map(img => img.id);
        const imagesToDeleteIds = images.filter(img => !img.isNew && img.markedForDeletion).map(img => img.id);
        const newImageFiles = images.filter(img => img.isNew && img.file);

        data.append('imagesToKeep', JSON.stringify(imagesToKeepIds));
        data.append('imagesToDelete', JSON.stringify(imagesToDeleteIds));
        newImageFiles.forEach(imgObj => {
            data.append('newImages', imgObj.file, imgObj.name); // 'newImages' field for multer
        });
        // If you always re-upload all images when editing images, simplify this:
        // Just send the new set of files for 'images' field, backend deletes all old and adds new.

        try {
            await apiClient.put(`/event/${eventToEdit.event_id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onEventSaved();
        } catch (err) {
            console.error('Error updating event:', err);
            setErrors(prev => ({ ...prev, formApi: err.data?.message || err.message || 'Failed to update event.'}));
            alert(err.data?.message || 'Failed to update event.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!eventToEdit) return <div className="p-4">Loading event data...</div>;

    return (
        <form onSubmit={handleSubmit} id="edit-event-form" className="space-y-6 overflow-y-auto p-1 pr-3 max-h-[calc(95vh-150px)]"> {/* Adjust max-h as needed */}
            {/* Basic Info Card - Title, Type, Description */}
            <Card>
                <CardHeader><CardTitle>Edit Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1">
                        <Label htmlFor="edit-title">Event Title *</Label>
                        <Input id="edit-title" name="title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>
                    {/* Event Type */}
                    {/* Description */}
                </CardContent>
            </Card>

            {/* Dates & Times Card */}
            {/* Venue Card */}
            {/* Ticket Tiers Card - map over 'ticketTiers' state */}
            <Card>
                <CardHeader>
                    <CardTitle>Ticket Tiers & Pricing</CardTitle>
                    {/* ... Description, venue capacity ... */}
                </CardHeader>
                <CardContent className="space-y-4">
                    {errors.ticketTiersGeneral && <Alert variant="destructive"><AlertDescription>{errors.ticketTiersGeneral}</AlertDescription></Alert>}
                    {ticketTiers.map((tier, index) => (
                        <Card key={tier.id} className="p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="font-semibold">Tier {index + 1}</Label>
                                {ticketTiers.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeTier(tier.id)}><Trash2 className="h-4 w-4" /></Button>}
                            </div>
                            {/* Inputs for tier.tierName, tier.price, tier.quantity */}
                            <div className="grid grid-cols-3 gap-2">
                                <div><Label htmlFor={`tierName-${tier.id}`}>Name*</Label><Input id={`tierName-${tier.id}`} value={tier.tierName} onChange={e => handleTierChange(tier.id, 'tierName', e.target.value)} /></div>
                                <div><Label htmlFor={`price-${tier.id}`}>Price*</Label><Input type="number" id={`price-${tier.id}`} value={tier.price} onChange={e => handleTierChange(tier.id, 'price', e.target.value)} /></div>
                                <div><Label htmlFor={`quantity-${tier.id}`}>Qty*</Label><Input type="number" id={`quantity-${tier.id}`} value={tier.quantity} onChange={e => handleTierChange(tier.id, 'quantity', e.target.value)} /></div>
                            </div>
                            {errors.ticketTiers?.[tier.id]?.tierName && <p className="text-xs text-red-500">{errors.ticketTiers[tier.id].tierName}</p>}
                            {/* other tier errors */}
                        </Card>
                    ))}
                    <Button type="button" variant="outline" onClick={addTier}><PlusCircle className="mr-2 h-4 w-4" />Add Tier</Button>
                </CardContent>
            </Card>


            {/* Image Management Card */}
            <Card>
                <CardHeader><CardTitle>Event Images</CardTitle></CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Label htmlFor="edit-new-images">Upload New Images</Label>
                        <Input id="edit-new-images" type="file" multiple accept="image/*" onChange={handleImageUpload} />
                    </div>
                    <Label>Current Images:</Label>
                    {images.length === 0 && <p className="text-sm text-muted-foreground">No images uploaded yet.</p>}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {images.map((image) => (
                            <div key={image.id} className="relative group">
                                <img src={image.url} alt={image.name} className="w-full h-32 object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity">
                                    {image.isNew ? (
                                        <Button type="button" variant="destructive" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => removeNewImage(image.id)}><Trash2 className="h-4 w-4" /></Button>
                                    ) : (
                                        <Button type="button" variant={image.markedForDeletion ? "secondary" : "destructive"} size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => markImageForDeletion(image.id)}>
                                            {image.markedForDeletion ? "Keep" : <><Trash2 className="h-4 w-4 mr-1" />Delete</>}
                                        </Button>
                                    )}
                                </div>
                                {image.markedForDeletion && <div className="absolute bottom-1 right-1 text-xs bg-red-500 text-white px-1 rounded">Marked for Deletion</div>}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Rules Card */}
            {/* Submit/Cancel Buttons are usually part of DialogFooter in parent, or here */}
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Save Changes"}
                </Button>
            </div>
            {errors.formApi && <Alert variant="destructive" className="mt-2"><AlertDescription>{errors.formApi}</AlertDescription></Alert>}
        </form>
    );
};

export { EditEventForm }; // Export if it's in its own file