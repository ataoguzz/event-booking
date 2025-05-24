import { useState, useEffect } from 'react'; // Added useEffect
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Calendar, Clock, MapPin, Users, Edit, Eye, Trash2, Search, Filter, Loader2 } from 'lucide-react'; // Added Loader2
import apiClient from '@/helpers/apiCore.js'; // Assuming this is your configured apiClient
import { format, parseISO } from 'date-fns';
import { useAuth } from "@/contexts/AuthContext.jsx";

const SERVER_BASE_URL ='http://localhost:3001';

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


export default function MyEvents() {
  const { user } = useAuth();
  const [allFetchedEvents, setAllFetchedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.post('/event/my-events', {organizerAccountId: user.account_id});
        console.log(response);
        const transformedEvents = response.data.map(event => ({
          id: event.event_id,
          title: event.title,
          type: mapCategoryToType(event.category), // Map from backend 'CATEGORY' to frontend 'Type'
          date: event.start_at ? format(parseISO(event.start_at), 'yyyy-MM-dd') : 'N/A',
          time: event.start_at ? format(parseISO(event.start_at), 'HH:mm') : 'N/A',
          venue: event.venue_name || 'N/A',
          location: event.venue_city || 'N/A',
          capacity: event.venue_capacity || 0,
          soldTickets: event.tickets_sold || 0,
          status: event.status ? event.status.toLowerCase() : 'unknown',
          image: event.hero_image_url ? `${SERVER_BASE_URL}${event.hero_image_url}` : 'https://via.placeholder.com/300x200?text=No+Image',
          // Keep original backend data if needed for other operations
          _original: event
        }));
        setAllFetchedEvents(transformedEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.data?.message || err.message || 'Failed to fetch events.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  // Filter events based on search and filters
  const filteredEvents = allFetchedEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || event.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const publishedEvents = filteredEvents.filter(event => event.status === 'published');
  const draftEvents = filteredEvents.filter(event => event.status === 'draft');
  // You might want to add other statuses if your backend returns them (e.g., 'cancelled', 'completed')
  // and if you want to display them in separate tabs or filter by them.

  // Event types for filter dropdown - dynamically generate from fetched events or keep static list
  const uniqueEventTypes = ['all', ...new Set(allFetchedEvents.map(event => event.type))];


  if (isLoading) {
    return (
        <Layout>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="ml-4 text-xl">Loading your events...</p>
          </div>
        </Layout>
    );
  }


  if (error) {
    return (
        <Layout>
          <div className="text-center py-16 text-red-600">
            <h3 className="text-xl font-medium">Error loading events</h3>
            <p className="mt-1">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
          </div>
        </Layout>
    );
  }

  return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Events</h1>
              <p className="text-muted-foreground mt-1">Manage all your events in one place</p>
            </div>

            <Button size="lg" asChild>
              <Link to="/create-event">Create New Event</Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                  placeholder="Search events by title or venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-auto md:w-[180px]">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueEventTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type === 'all' ? 'All Types' : type}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-auto md:w-[180px]">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  {/* Add other relevant statuses from your backend enum if needed */}
                  {/* <SelectItem value="cancelled">Cancelled</SelectItem> */}
                  {/* <SelectItem value="completed">Completed</SelectItem> */}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All ({filteredEvents.length})</TabsTrigger>
              <TabsTrigger value="published">Published ({publishedEvents.length})</TabsTrigger>
              <TabsTrigger value="draft">Draft ({draftEvents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <EventCards events={filteredEvents} onDeleteEvent={handleDeleteEvent}/>
            </TabsContent>

            <TabsContent value="published" className="mt-0">
              <EventCards events={publishedEvents} onDeleteEvent={handleDeleteEvent}/>
            </TabsContent>

            <TabsContent value="draft" className="mt-0">
              <EventCards events={draftEvents} onDeleteEvent={handleDeleteEvent} />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
  );
}


const handleDeleteEvent = async (eventId, eventTitle) => {
  if (!window.confirm(`Are you sure you want to delete the event "${eventTitle}"? This action cannot be undone.`)) {
    return;
  }

  setIsLoading(true); // You might want a more specific loading state for delete
  try {
    await apiClient.delete(`/event/${eventId}`); // Matches router: DELETE /api/event/:eventId
    alert(`Event "${eventTitle}" deleted successfully.`);
    // Update the local state to remove the deleted event
    setAllFetchedEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    // Or trigger a re-fetch:
    // setRefreshTrigger(prev => prev + 1); // And add refreshTrigger to useEffect dependency array
  } catch (err) {
    console.error(`Error deleting event ${eventId}:`, err);
    setError(err.data?.message || err.message || `Failed to delete event "${eventTitle}".`);
    alert(err.data?.message || `Failed to delete event "${eventTitle}". Please try again.`);
  } finally {
    setIsLoading(false);
  }
};

function EventCards({ events }) {
  if (events.length === 0) {
    return (
        <div className="text-center py-16 border rounded-lg bg-card">
          <h3 className="text-lg font-medium text-card-foreground">No events found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your filters or create a new event</p>
        </div>
    );
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
            <Card key={event.id} className="overflow-hidden flex flex-col">
              <div className="relative h-48 w-full">
                <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/300x200?text=Image+Error"; }} // Fallback for broken images
                />
                <Badge
                    variant={event.status === 'published' ? 'default' : 'secondary'} // Use theme variants
                    className={`absolute top-4 right-4 ${
                        event.status === 'published' ? 'bg-green-500 text-green-foreground' : 'bg-amber-500 text-amber-foreground' // Example custom colors
                    }`}
                >
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
              </div>

              <CardHeader className="pb-2"> {/* Reduced padding */}
                <CardTitle className="text-xl truncate" title={event.title}>{event.title}</CardTitle>
                <CardDescription>{event.type}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-1.5 text-sm flex-grow"> {/* Reduced spacing and font size */}
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2 text-muted-foreground" />
                  <span suppressHydrationWarning>{/* Suppress warning for server/client mismatch due to toLocaleDateString if SSR */}
                    {event.date !== 'N/A' ? format(new Date(event.date), "PPP") : 'Date N/A'}
              </span>
                </div>

                <div className="flex items-center">
                  <Clock size={14} className="mr-2 text-muted-foreground" />
                  <span>{event.time}</span>
                </div>

                <div className="flex items-center">
                  <MapPin size={14} className="mr-2 text-muted-foreground" />
                  <span className="truncate" title={`${event.venue}, ${event.location}`}>{event.venue}{event.location && event.location !== 'N/A' ? `, ${event.location}` : ''}</span>
                </div>

                <div className="flex items-center">
                  <Users size={14} className="mr-2 text-muted-foreground" />
                  <span>{event.soldTickets} / {event.capacity} tickets</span> {/* Simplified display */}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between items-center pt-4"> {/* Added items-center */}
                <Button variant="outline" size="sm" asChild>
                  {/* TODO: Update link to actual event view page if different from /events/:id */}
                  <Link to={`/event-details/${event.id}`}> {/* Assuming event details page */}
                    <Eye size={14} className="mr-1.5" />
                    View
                  </Link>
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    {/* TODO: Update link to actual event edit page */}
                    <Link to={`/organizer/edit-event/${event.id}`}>
                      <Edit size={14} className="mr-1.5" />
                      Edit
                    </Link>
                  </Button>

                  <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteEvent(event.id, event.title)} // Call onDeleteEvent
                  >
                    <Trash2 size={14} className="mr-1.5" />
                    {/* Delete */}
                  </Button>
                </div>
              </CardFooter>
            </Card>
        ))}
      </div>
  );
}