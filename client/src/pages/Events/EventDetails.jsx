import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from "../../components/ui/use-toast";
import { StarIcon } from "@radix-ui/react-icons";
import apiClient from '../../helpers/apiCore';

export default function EventDetails() {
    const { id } = useParams();
    const { toast } = useToast();
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const response = await apiClient.get(`/events/${id}`);
                setEvent(response.data);
            } catch (error) {
                console.error('Error fetching event details:', error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to load event details. Please try again.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchEventDetails();
    }, [id]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-lg"></div>
                <div className="mt-8 space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold">Event not found</h1>
                <p className="mt-2 text-gray-600">The event you're looking for doesn't exist or has been removed.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero Image */}
            <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
                <img
                    src={event.hero_image_url || '/placeholder-event.jpg'}
                    alt={event.title}
                    className="object-cover w-full h-full"
                />
            </div>

            {/* Event Header */}
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <h1 className="text-4xl font-bold">{event.title}</h1>
                    {event.avg_rating && (
                        <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full">
                            <StarIcon className="h-5 w-5 text-yellow-400" />
                            <span className="font-semibold">{event.avg_rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-gray-600">
                    <p>{format(new Date(event.start_at), 'EEEE, MMMM d, yyyy • h:mm a')}</p>
                    <p>•</p>
                    <p>{event.venue_name}, {event.city}</p>
                </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">About this event</h2>
                        <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                    </section>

                    {event.rules && (
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Rules</h2>
                            <p className="text-gray-600 whitespace-pre-wrap">{event.rules}</p>
                        </section>
                    )}

                    {event.facilities?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Venue Facilities</h2>
                            <div className="flex flex-wrap gap-2">
                                {event.facilities.map((facility, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                                    >
                                        {facility}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Pricing</h3>
                        <p className="text-3xl font-bold">${event.base_price}</p>
                        <button className="w-full mt-4 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors">
                            Get Tickets
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Event Stats</h3>
                        <div className="space-y-2">
                            <p className="flex justify-between">
                                <span className="text-gray-600">Tickets Sold</span>
                                <span className="font-semibold">{event.tickets_sold}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-gray-600">Views</span>
                                <span className="font-semibold">{event.view_count}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-gray-600">Venue Capacity</span>
                                <span className="font-semibold">{event.capacity}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 