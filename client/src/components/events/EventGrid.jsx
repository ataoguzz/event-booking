import React from 'react';
import EventCard from './EventCard';

export default function EventGrid({ events, isLoading }) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                        <div className="bg-gray-200 aspect-video rounded-lg"></div>
                        <div className="space-y-3 mt-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!events?.length) {
        return (
            <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900">No events found</h3>
                <p className="mt-2 text-gray-600">Try adjusting your search filters</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event) => (
                <EventCard key={event.event_id} event={event} />
            ))}
        </div>
    );
} 