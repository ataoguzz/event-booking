import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Calendar, Clock, MapPin, Star, DollarSign, Filter, Search, X } from 'lucide-react';

export default function BrowseEvents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-asc');
  const [activeFilters, setActiveFilters] = useState([]);

  // Mock data - would come from API in real app
  const events = [
    {
      id: 1,
      title: 'Summer Music Festival',
      type: 'Concert',
      date: '2023-07-15',
      time: '18:00',
      venue: 'Central Park',
      location: 'New York, NY',
      price: 75,
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80'
    },
    {
      id: 2,
      title: 'Tech Conference 2023',
      type: 'Conference',
      date: '2023-09-10',
      time: '09:00',
      venue: 'Convention Center',
      location: 'San Francisco, CA',
      price: 250,
      rating: 4.5,
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    },
    {
      id: 3,
      title: 'Comedy Night',
      type: 'Stand-up Comedy',
      date: '2023-06-25',
      time: '20:00',
      venue: 'The Laugh Factory',
      location: 'Los Angeles, CA',
      price: 35,
      rating: 4.6,
      imageUrl: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80'
    },
    {
      id: 4,
      title: 'Art Exhibition',
      type: 'Exhibition',
      date: '2023-08-05',
      time: '10:00',
      venue: 'Modern Art Gallery',
      location: 'Chicago, IL',
      price: 20,
      rating: 4.4,
      imageUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    },
    {
      id: 5,
      title: 'Jazz in the Garden',
      type: 'Concert',
      date: '2023-06-30',
      time: '19:30',
      venue: 'Botanical Gardens',
      location: 'Boston, MA',
      price: 45,
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80'
    },
    {
      id: 6,
      title: 'Food & Wine Festival',
      type: 'Festival',
      date: '2023-07-22',
      time: '12:00',
      venue: 'Riverfront Park',
      location: 'Portland, OR',
      price: 65,
      rating: 4.9,
      imageUrl: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1262&q=80'
    }
  ];

  // Available event types for filter
  const eventTypes = Array.from(new Set(events.map(event => event.type)));
  
  // Available locations for filter
  const locations = Array.from(new Set(events.map(event => event.location)));

  const addFilter = (type, value) => {
    // Don't add "all" filters
    if (value === 'all') {
      removeFiltersByType(type);
      return;
    }
    
    // Remove any existing filter of the same type
    removeFiltersByType(type);
    
    // Add the new filter
    setActiveFilters([...activeFilters, { type, value }]);
  };

  const removeFiltersByType = (type) => {
    setActiveFilters(activeFilters.filter(filter => filter.type !== type));
  };

  const removeFilter = (filterToRemove) => {
    setActiveFilters(activeFilters.filter(filter => 
      !(filter.type === filterToRemove.type && filter.value === filterToRemove.value)
    ));
    
    // Reset the corresponding filter state
    if (filterToRemove.type === 'price') {
      setPriceRange([0, 500]);
    } else if (filterToRemove.type === 'date') {
      setDateFilter('all');
    } else if (filterToRemove.type === 'category') {
      setCategoryFilter('all');
    } else if (filterToRemove.type === 'location') {
      setLocationFilter('all');
    }
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setPriceRange([0, 500]);
    setDateFilter('all');
    setCategoryFilter('all');
    setLocationFilter('all');
    setSortBy('date-asc');
  };

  // Handle filter changes
  const handlePriceChange = (value) => {
    setPriceRange(value);
    removeFiltersByType('price');
    setActiveFilters([...activeFilters, { 
      type: 'price', 
      value: `$${value[0]} - $${value[1]}` 
    }]);
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    addFilter('date', value);
  };

  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    addFilter('category', value);
  };

  const handleLocationFilterChange = (value) => {
    setLocationFilter(value);
    addFilter('location', value);
  };

  // Filter events based on all criteria
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = event.price >= priceRange[0] && event.price <= priceRange[1];
    
    // Date filtering (simplified for demo)
    let matchesDate = true;
    const eventDate = new Date(event.date);
    const today = new Date();
    
    if (dateFilter === 'today') {
      matchesDate = eventDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      matchesDate = eventDate.toDateString() === tomorrow.toDateString();
    } else if (dateFilter === 'this-week') {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      matchesDate = eventDate >= today && eventDate <= endOfWeek;
    } else if (dateFilter === 'this-month') {
      matchesDate = eventDate.getMonth() === today.getMonth() && 
                  eventDate.getFullYear() === today.getFullYear();
    }
    
    const matchesCategory = categoryFilter === 'all' || event.type === categoryFilter;
    const matchesLocation = locationFilter === 'all' || event.location === locationFilter;
    
    return matchesSearch && matchesPrice && matchesDate && matchesCategory && matchesLocation;
  });

  // Sort events based on selected criteria
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'date-asc') {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === 'date-desc') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'price-asc') {
      return a.price - b.price;
    } else if (sortBy === 'price-desc') {
      return b.price - a.price;
    } else if (sortBy === 'rating-desc') {
      return b.rating - a.rating;
    }
    return 0;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Browse Events</h1>
          <p className="text-muted-foreground mt-1">Discover upcoming events and experiences</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search events, venues, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Date (Soonest)</SelectItem>
              <SelectItem value="date-desc">Date (Latest)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Date Filter */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Date</h4>
                  <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                    <SelectTrigger>
                      <Calendar size={16} className="mr-2" />
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this-week">This week</SelectItem>
                      <SelectItem value="this-month">This month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                {/* Category Filter */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Category</h4>
                  <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
                    <SelectTrigger>
                      <Filter size={16} className="mr-2" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {eventTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                {/* Location Filter */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Location</h4>
                  <Select value={locationFilter} onValueChange={handleLocationFilterChange}>
                    <SelectTrigger>
                      <MapPin size={16} className="mr-2" />
                      <SelectValue placeholder="Filter by location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {locations.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                {/* Price Range Filter */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">Price Range</h4>
                    <span className="text-sm text-muted-foreground">
                      ${priceRange[0]} - ${priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0, 500]}
                    min={0}
                    max={500}
                    step={10}
                    value={priceRange}
                    onValueChange={handlePriceChange}
                  />
                </div>
                
                <Separator />
                
                {/* Clear Filters */}
                <Button variant="outline" className="w-full" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Active Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {filter.type === 'date' && (
                        filter.value === 'today' ? 'Today' :
                        filter.value === 'tomorrow' ? 'Tomorrow' :
                        filter.value === 'this-week' ? 'This Week' :
                        filter.value === 'this-month' ? 'This Month' : 'Date'
                      )}
                      {filter.type === 'category' && filter.value}
                      {filter.type === 'location' && filter.value}
                      {filter.type === 'price' && filter.value}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFilter(filter)} 
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Events Grid */}
          <div>
            {sortedEvents.length === 0 ? (
              <div className="text-center py-16 border rounded-lg">
                <h3 className="text-lg font-medium">No events found</h3>
                <p className="text-muted-foreground mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <div className="relative h-48">
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-full object-cover" 
                      />
                      <Badge className="absolute top-3 right-3 bg-black">${event.price}</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <CardDescription className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 inline mr-1" />
                        {event.rating.toFixed(1)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar size={16} className="mr-2 text-gray-500" />
                        <span>{new Date(event.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock size={16} className="mr-2 text-gray-500" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin size={16} className="mr-2 text-gray-500" />
                        <span>{event.venue}, {event.location}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/events/${event.id}`}>View Details</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 