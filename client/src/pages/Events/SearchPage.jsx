import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchFilters from '../../components/search/SearchFilters';
import EventGrid from '../../components/events/EventGrid';
import { useToast } from "../../components/ui/use-toast";
import apiClient from '../../helpers/apiCore';

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [filters, setFilters] = useState({
        location: searchParams.get('location') || '',
        startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : null,
        endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : null,
        category: searchParams.get('category') || '',
        minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0,
        maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 1000,
        sortBy: searchParams.get('sortBy') || 'date_asc'
    });

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            // Convert dates to ISO strings for the API
            const queryParams = {};
            
            if (filters.location) queryParams.location = filters.location;
            if (filters.startDate) queryParams.startDate = filters.startDate.toISOString();
            if (filters.endDate) queryParams.endDate = filters.endDate.toISOString();
            if (filters.category) queryParams.category = filters.category;
            if (filters.minPrice !== undefined) queryParams.minPrice = filters.minPrice.toString();
            if (filters.maxPrice !== undefined) queryParams.maxPrice = filters.maxPrice.toString();
            if (filters.sortBy) queryParams.sortBy = filters.sortBy;

            const response = await apiClient.get('/events/search', queryParams);
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to load events. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        // Update URL with current filters
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                if (value instanceof Date) {
                    params.append(key, value.toISOString());
                } else {
                    params.append(key, value.toString());
                }
            }
        });
        setSearchParams(params);
    }, [filters]);

    const handleSearch = () => {
        fetchEvents();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-6">Discover Events</h1>
                <SearchFilters
                    filters={filters}
                    setFilters={setFilters}
                    onSearch={handleSearch}
                />
            </div>

            <EventGrid events={events} isLoading={isLoading} />
        </div>
    );
} 