import React from 'react';
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Slider } from "../ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "@radix-ui/react-icons";

const categories = [
    { value: 'CONCERT', label: 'Concert' },
    { value: 'THEATER', label: 'Theater' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'STANDUP', label: 'Stand Up' },
    { value: 'CONFERENCE', label: 'Conference' },
    { value: 'WORKSHOP', label: 'Workshop' },
    { value: 'FESTIVAL', label: 'Festival' },
    { value: 'OTHER', label: 'Other' }
];

const sortOptions = [
    { value: 'date_asc', label: 'Date (Earliest)' },
    { value: 'date_desc', label: 'Date (Latest)' },
    { value: 'price_asc', label: 'Price (Low to High)' },
    { value: 'price_desc', label: 'Price (High to Low)' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' }
];

export default function SearchFilters({ filters, setFilters, onSearch }) {
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Location Filter */}
                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        placeholder="Enter city or venue"
                        value={filters.location || ''}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                    />
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="flex space-x-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.startDate ? format(filters.startDate, 'PPP') : 'Start date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={filters.startDate}
                                    onSelect={(date) => handleFilterChange('startDate', date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.endDate ? format(filters.endDate, 'PPP') : 'End date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={filters.endDate}
                                    onSelect={(date) => handleFilterChange('endDate', date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                        value={filters.category || ''}
                        onValueChange={(value) => handleFilterChange('category', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select
                        value={filters.sortBy || ''}
                        onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            {sortOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="pt-2">
                    <Slider
                        defaultValue={[0, 1000]}
                        max={1000}
                        step={10}
                        value={[filters.minPrice || 0, filters.maxPrice || 1000]}
                        onValueChange={([min, max]) => {
                            handleFilterChange('minPrice', min);
                            handleFilterChange('maxPrice', max);
                        }}
                    />
                    <div className="flex justify-between mt-2">
                        <span>${filters.minPrice || 0}</span>
                        <span>${filters.maxPrice || 1000}</span>
                    </div>
                </div>
            </div>

            {/* Search Button */}
            <Button 
                className="w-full bg-black text-white hover:bg-gray-800"
                onClick={onSearch}
            >
                Search Events
            </Button>
        </div>
    );
} 