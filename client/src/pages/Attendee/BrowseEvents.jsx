import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Badge } from '@/components/ui/badge.jsx'; // Keep for EventCard
import { Separator } from '@/components/ui/separator.jsx';
import { Calendar as CalendarIcon, Clock, MapPin, Star, DollarSign, Filter, Search } from 'lucide-react'; // Removed X
import apiClient from '../../helpers/apiCore.js';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-asc');

  useEffect(() => {
    apiClient.get('/venue/cities').then(r => setCities(r.data)).catch(console.error);
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);

    const params = {
      search: searchQuery || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      city: locationFilter !== 'all' ? locationFilter : undefined,
      price_min: priceRange[0] !== 0 ? priceRange[0] : undefined,
      price_max: priceRange[1] !== 500 ? priceRange[1] : undefined,
      sort: ({
        'date-asc': 'soonest', 'date-desc': 'latest',
        'price-asc': 'price_low', 'price-desc': 'price_high',
        'rating-desc': 'rating_high'
      })[sortBy],
      limit: 30,
      page: 1
    };

    if (startDate) {
      params.date_from = format(startDate, 'yyyy-MM-dd');
    }
    if (endDate) {
      params.date_to = format(endDate, 'yyyy-MM-dd');
    }


    try {
      console.log("Params:", params);
      const response = await apiClient.get('/event', { params });
      console.log("Response:", response.data);
      setEvents(response.data);
    } catch (error) {
      console.error("Error loading events:", error); 
      setEvents([]); 
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, locationFilter, priceRange, startDate, endDate, sortBy]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventTypes = ["CONCERT", "THEATER", "SPORTS", "STANDUP", "CONFERENCE", "WORKSHOP", "FESTIVAL", "OTHER"];

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

  const clearAllFilters = () => {
    setSearchQuery('');
    setPriceRange([0, 500]);
    setStartDate(null);
    setEndDate(null);
    setCategoryFilter('all');
    setLocationFilter('all');
    setSortBy('date-asc');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Browse Events</h1>
          <p className="text-muted-foreground mt-1">Discover upcoming events and experiences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              className="pl-10"
              placeholder="Search events, venues, or keywords..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
              }}
            />
          </div>
          <Select value={sortBy} onValueChange={value => {
            setSortBy(value);
          }}>
            <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Date (Soonest)</SelectItem>
              <SelectItem value="date-desc">Date (Latest)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">
          <FiltersSidebar
            priceRange={priceRange}
            setPriceRange={value => {
              setPriceRange(value);
            }}
            startDate={startDate}
            setStartDate={value => {
              setStartDate(value);
            }}
            endDate={endDate}
            setEndDate={value => {
              setEndDate(value);
            }}
            categoryFilter={categoryFilter}
            setCategoryFilter={value => {
              setCategoryFilter(value);
            }}
            locationFilter={locationFilter}
            setLocationFilter={value => {
              setLocationFilter(value);
            }}
            eventTypes={eventTypes}
            eventTypeLabels={eventTypeLabels}
            cities={cities}
            clearAll={clearAllFilters}
          />

          <div>
            {loading ? (
              <p className="text-center py-10">Loading…</p>
            ) : events.length === 0 ? (
              <div className="text-center py-16 border rounded-lg">
                <h3 className="text-lg font-medium">No events found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {events.map(ev => <EventCard key={ev.event_id} ev={ev} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DatePickerField({ date, setDate, placeholder, disabledDates }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <UICalendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={disabledDates}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function FiltersSidebar(props) {
  const {
    priceRange, setPriceRange,
    startDate, setStartDate, endDate, setEndDate,
    categoryFilter, setCategoryFilter,
    locationFilter, setLocationFilter,
    eventTypes, eventTypeLabels, cities,
    clearAll 
  } = props;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Filters</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <FilterGroup label="Date Range" icon={<CalendarIcon size={16} />}>
            <div className="space-y-2">
              <DatePickerField
                date={startDate}
                setDate={setStartDate}
                placeholder="Start date"
                disabledDates={(date) => endDate && date > endDate}
              />
              <DatePickerField
                date={endDate}
                setDate={setEndDate}
                placeholder="End date"
                disabledDates={(date) => startDate && date < startDate}
              />
            </div>
          </FilterGroup>
          <Separator />
          <FilterGroup label="Category" icon={<Filter size={16} />}>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {eventTypes.map(c => <SelectItem key={c} value={c}>{eventTypeLabels[c]}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterGroup>
          <Separator />
          <FilterGroup label="Location" icon={<MapPin size={16} />}>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterGroup>
          <Separator />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm flex items-center"><DollarSign size={16} className="mr-2" />Price</h4>
              <span className="text-sm text-muted-foreground">${priceRange[0]} - ${priceRange[1]}</span>
            </div>
            <Slider min={0} max={500} step={10} value={priceRange} onValueChange={setPriceRange} />
          </div>
          <Separator />
          <Button variant="outline" className="w-full" onClick={clearAll}>Clear All Filters</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterGroup({ label, icon, children }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm flex items-center gap-1">{icon}{label}</h4>
      {children}
    </div>
  );
}

function EventCard({ ev }) {
  const rating = ev.organizer_rating ? Number(ev.organizer_rating).toFixed(1) : '–';
  // Ensure ev.price_from is a number before toFixed
  const price = typeof ev.price_from === 'number' ? Number(ev.price_from).toFixed(0) : 'N/A';
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <img src={ev.cover_url} alt={ev.title} className="w-full h-full object-cover" />
        <Badge className="absolute top-3 right-3 bg-black text-white">${price}</Badge>
        <Badge className="absolute top-3 left-3 bg-blue-600 text-white">{ev.category}</Badge>
      </div>
      <CardHeader>
        <CardTitle className="text-xl">{ev.title}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          {rating} · {ev.organizer_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center"><CalendarIcon size={16} className="mr-2 text-gray-500" />
          {ev.start_at ? new Date(ev.start_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Date N/A'}
        </div>
        <div className="flex items-center"><Clock size={16} className="mr-2 text-gray-500" />
          {ev.start_at ? new Date(ev.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time N/A'}
        </div>
        <div className="flex items-center"><MapPin size={16} className="mr-2 text-gray-500" />
          {ev.venue_name || 'Venue N/A'}, {ev.city || 'City N/A'}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full"><Link to={`/event/${ev.event_id}`}>View Details</Link></Button>
      </CardFooter>
    </Card>
  );
}