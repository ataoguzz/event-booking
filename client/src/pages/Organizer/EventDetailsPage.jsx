// src/pages/EventDetailsPage.jsx (Simplified Example)
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '@/helpers/apiCore';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Calendar, Clock, MapPin, Users, Tag, DollarSign, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const mapCategoryToType = (category) => { /* ... same as in MyEvents ... */ };

export default function EventDetailsPage() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!eventId) return;
        const fetchEventDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiClient.get(`/event/${eventId}`);
                setEvent(response.data);
            } catch (err) {
                console.error(`Error fetching event ${eventId}:`, err);
                setError(err.data?.message || err.message || 'Failed to load event details.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEventDetails();
    }, [eventId]);

    if (isLoading) {
        return <Layout><div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div></Layout>;
    }
    if (error) {
        return <Layout><div className="text-center py-10 text-red-500">Error: {error} <Link to="/"><Button variant="link">Go Home</Button></Link></div></Layout>;
    }
    if (!event) {
        return <Layout><div className="text-center py-10">Event not found.</div></Layout>;
    }

    const heroImage = event.hero_image_url ? event.hero_image_url : (event.images && event.images.length > 0 ? event.images[0].url : "https://via.placeholder.com/800x400?text=Event+Image");

    return (
        <Layout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <Button variant="outline" asChild className="mb-6">
                    <Link to="/my-events"> {/* Or to general events list if coming from there */}
                        <ChevronLeft className="h-4 w-4 mr-2" /> Back to Events
                    </Link>
                </Button>

                <Card>
                    <CardHeader className="p-0">
                        <img src={heroImage} alt={event.title} className="w-full h-64 md:h-96 object-cover rounded-t-lg" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
                        <p className="text-lg text-muted-foreground mb-1">Organized by: {event.organizer_display_name}</p>
                        <Badge variant="outline" className="mb-4">{mapCategoryToType(event.category)}</Badge>

                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-muted-foreground">
                            <div className="flex items-center"><Calendar className="h-5 w-5 mr-3 text-primary" /> {format(parseISO(event.start_at), "eeee, MMMM d, yyyy")}</div>
                            <div className="flex items-center"><Clock className="h-5 w-5 mr-3 text-primary" /> {format(parseISO(event.start_at), "p")} - {format(parseISO(event.end_at), "p")}</div>
                            <div className="flex items-center col-span-1 md:col-span-2"><MapPin className="h-5 w-5 mr-3 text-primary" /> {event.venue_name} - {event.venue_address}, {event.venue_city}</div>
                        </div>

                        <h2 className="text-2xl font-semibold mt-8 mb-3">About this event</h2>
                        <div className="prose max-w-none text-muted-foreground">
                            <p>{event.description || "No description provided."}</p>
                        </div>

                        {event.rules && (
                            <>
                                <h3 className="text-xl font-semibold mt-6 mb-2">Event Rules</h3>
                                <p className="text-muted-foreground whitespace-pre-line">{event.rules}</p>
                            </>
                        )}

                        <h2 className="text-2xl font-semibold mt-8 mb-3">Tickets</h2>
                        {event.ticket_tiers && event.ticket_tiers.length > 0 ? (
                            <div className="space-y-3">
                                {event.ticket_tiers.map(tier => (
                                    <Card key={tier.tier_id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-lg">{tier.tier_name}</p>
                                            {tier.description && <p className="text-sm text-muted-foreground">{tier.description}</p>}
                                            <p className="text-sm text-muted-foreground">Available: {tier.quantity} </p> {/* TODO: Show remaining if possible */}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-primary">${parseFloat(tier.price).toFixed(2)}</p>
                                            <Button size="sm" className="mt-1">Buy Ticket</Button> {/* TODO: Implement buy ticket */}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Ticket information not available or event might be free (check details).</p>
                        )}

                        {event.images && event.images.filter(img => img.url !== event.hero_image_url).length > 0 && (
                            <>
                                <h2 className="text-2xl font-semibold mt-8 mb-3">More Images</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {event.images.filter(img => img.url !== event.hero_image_url && img.url !== heroImage).map(image => (
                                        <img key={image.image_id} src={image.url} alt={image.caption || event.title} className="rounded-lg object-cover aspect-square" />
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}