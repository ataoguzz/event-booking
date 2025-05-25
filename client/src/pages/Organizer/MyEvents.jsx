import {useState, useEffect, useCallback} from 'react'; // Added useEffect
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import {
  Dialog,
  DialogContent, DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
    DialogDescription,
    DialogClose
} from "@/components/ui/dialog.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Calendar, Clock, MapPin, Users, Edit, Eye, Trash2, Search, Filter, Loader2 } from 'lucide-react'; // Added Loader2
import apiClient from '@/helpers/apiCore.js'; // Assuming this is your configured apiClient
import { format, parseISO } from 'date-fns';
import { useAuth } from "@/contexts/AuthContext.jsx";
import {EditEventForm} from "@/pages/Organizer/EditEventForm.jsx";

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

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEventForView, setSelectedEventForView] = useState(null);
  const [isLoadingViewDetails, setIsLoadingViewDetails] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
  const [isLoadingEditDetails, setIsLoadingEditDetails] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null); // Will store { id, title }
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for th

  const fetchMyEvents = useCallback(async () => { // useCallback to avoid re-creating on every render
    if (!user || !user.account_id) {
      setAllFetchedEvents([]);
      setIsLoading(false);
      // setError("User not authenticated."); // Optionally set an error
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/event/my-events', { organizerAccountId: user.account_id });
      const transformedEvents = response.data.map(event => ({ /* ... as before ... */
        id: event.event_id,
        title: event.title,
        type: mapCategoryToType(event.category),
        date: event.start_at ? format(parseISO(event.start_at), 'yyyy-MM-dd') : 'N/A',
        time: event.start_at ? format(parseISO(event.start_at), 'HH:mm') : 'N/A',
        venue: event.venue_name || 'N/A',
        location: event.venue_city || 'N/A',
        capacity: event.venue_capacity || 0,
        soldTickets: event.tickets_sold || 0,
        status: event.status ? event.status.toLowerCase() : 'unknown',
        image: event.hero_image_url,
        _original: event
      }));
      setAllFetchedEvents(transformedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.data?.message || err.message || 'Failed to fetch events.');
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Depend on user object

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]); // fetchMyEvents is now stable due to useCallback


  const handleViewEvent = async (eventId) => {
    setIsLoadingViewDetails(true);
    setIsViewDialogOpen(true);
    setSelectedEventForView(null); // Clear previous
    try {
      const response = await apiClient.get(`/event/${eventId}`); // API endpoint for single event
      setSelectedEventForView(response.data);
    } catch (err) {
      console.error(`Error fetching details for event ${eventId}:`, err);
      alert(`Error: ${err.data?.message || err.message || 'Failed to load event details.'}`);
      setIsViewDialogOpen(false); // Close dialog on error
    } finally {
      setIsLoadingViewDetails(false);
    }
  };


  const handleOpenEditDialog = async (eventId) => {
    if (!eventId) return;
    setIsLoadingEditDetails(true);
    setSelectedEventForEdit(null); // Clear previous
    setIsEditDialogOpen(true); // Open dialog immediately to show loader inside
    try {
      // Fetch the full, most up-to-date event details including all images and ticket_tiers
      const response = await apiClient.get(`/event/${eventId}`);
      setSelectedEventForEdit(response.data); // This data will be passed to EditEventForm
    } catch (err) {
      console.error(`Error fetching event ${eventId} for edit:`, err);
      alert(`Error: ${err.data?.message || err.message || 'Failed to load event data for editing.'}`);
      setIsEditDialogOpen(false); // Close dialog on error
    } finally {
      setIsLoadingEditDetails(false);
    }
  };

  const openDeleteConfirmDialog = (eventId, eventTitle) => {
    setEventToDelete({ id: eventId, title: eventTitle });
    setIsDeleteDialogOpen(true);
  };

  // MyEvents.jsx

  const confirmDeleteEvent = async () => {
    if (!eventToDelete || !user || !user.account_id) {
      alert("Error: Event data missing or user not authenticated for deletion.");
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
      return;
    }

    setIsDeleting(true); // Start delete-specific loading
    setError(null); // Clear previous main list errors

    try {
      await apiClient.delete(`/event/${eventToDelete.id}`, {
        data: { organizerAccountId: user.account_id.toString() } // Send organizerAccountId in body
      });
      console.log(`Event "${eventToDelete.title}" (ID: ${eventToDelete.id}) deleted.`);
      await fetchMyEvents(); // REFRESH THE LIST
    } catch (err) {
      console.error(`Error deleting event ${eventToDelete.id}:`, err);
      alert(err.data?.message || `Failed to delete event "${eventToDelete.title}". Please try again.`);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete the event "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.delete(`/event/${eventId}`, {
        data: { organizerAccountId: user.account_id.toString() }
      });
      setAllFetchedEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      await fetchMyEvents();
    } catch (err) {
      console.error(`Error deleting event ${eventId}:`, err);
      setError(err.data?.message || err.message || `Failed to delete event "${eventTitle}".`);
      alert(err.data?.message || `Failed to delete event "${eventTitle}". Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };



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
              <EventCards events={filteredEvents} onViewEvent={handleViewEvent} onEditEvent={handleOpenEditDialog} onDeleteEventConfirm={openDeleteConfirmDialog} />
            </TabsContent>

            <TabsContent value="published" className="mt-0">
              <EventCards events={publishedEvents} onViewEvent={handleViewEvent} onEditEvent={handleOpenEditDialog} onDeleteEvent={openDeleteConfirmDialog} />
            </TabsContent>

            <TabsContent value="draft" className="mt-0">
              <EventCards events={draftEvents} onViewEvent={handleViewEvent} onEditEvent={handleOpenEditDialog} onDeleteEvent={openDeleteConfirmDialog} />
            </TabsContent>
          </Tabs>
        </div>
        {/* View Event Dialog */}
        <EventDetailsDialog
            event={isLoadingViewDetails ? null : selectedEventForView} // Show loader or content
            isOpen={isViewDialogOpen}
            onClose={() => {
              setIsViewDialogOpen(false);
              setSelectedEventForView(null);
            }}
        />

        {isEditDialogOpen && (
            <Dialog open={isEditDialogOpen} onOpenChange={() => {setIsEditDialogOpen(false); setSelectedEventForEdit(null);}}>
              <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Edit Event: {isLoadingEditDetails || !selectedEventForEdit ? "Loading..." : selectedEventForEdit.title}</DialogTitle>
                  <DialogDescription>
                    Modify your event details below.
                  </DialogDescription>
                </DialogHeader>
                {isLoadingEditDetails || !selectedEventForEdit ? (
                    <div className="flex justify-center items-center py-20">
                      <Loader2 className="h-12 w-12 animate-spin" />
                    </div>
                ) : (
                    <EditEventForm
                        eventToEdit={selectedEventForEdit}
                        onClose={() => {
                          setIsEditDialogOpen(false);
                          setSelectedEventForEdit(null);
                        }}
                        onEventSaved={() => {
                          setIsEditDialogOpen(false);
                          setSelectedEventForEdit(null);
                          fetchMyEvents(); // Re-fetch the list of events after saving
                        }}
                    />
                )}
              </DialogContent>
            </Dialog>
        )}

        {eventToDelete && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => {
              if (!isOpen) {
                setIsDeleteDialogOpen(false);
                setEventToDelete(null); // Clear on close if not through confirm
              }
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the event "{eventToDelete.title}"?
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteDialogOpen(false);
                        setEventToDelete(null);
                      }}
                      disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                      variant="destructive"
                      onClick={confirmDeleteEvent}
                      disabled={isDeleting}
                  >
                    {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete Event
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        )}
      </Layout>
  );
}

function EventDetailsDialog({ event, isOpen, onClose }) {
  if (!event) return null;

  const heroImage = event.hero_image_url || (event.images && event.images.length > 0 ? event.images[0].url : "https://via.placeholder.com/800x400?text=Event+Image");

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-bold mb-1">{event.title}</DialogTitle>
            <DialogDescription>Organized by: {event.organizer_display_name}</DialogDescription>
            <Badge variant="outline" className="w-fit">{mapCategoryToType(event.category)}</Badge>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <img src={heroImage} alt={event.title} className="w-full h-auto max-h-80 object-cover rounded-lg mb-4" />

            <div className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-primary" /> {format(parseISO(event.start_at), "eeee, MMMM d, yyyy")}</div>
              <div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-primary" /> {format(parseISO(event.start_at), "p")} - {format(parseISO(event.end_at), "p")}</div>
              <div className="flex items-center col-span-1 md:col-span-2"><MapPin className="h-4 w-4 mr-2 text-primary" /> {event.venue_name} - {event.venue_address}, {event.venue_city}</div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-1">About this event</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{event.description || "No description."}</p>
            </div>

            {event.rules && (
                <div>
                  <h3 className="text-lg font-semibold mb-1">Event Rules</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{event.rules}</p>
                </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2">Ticket Tiers</h3>
              {event.ticket_tiers && event.ticket_tiers.length > 0 ? (
                  <div className="space-y-2">
                    {event.ticket_tiers.map(tier => (
                        <div key={tier.tier_id} className="p-3 border rounded-md flex justify-between items-center text-sm">
                          <div>
                            <p className="font-medium">{tier.tier_name}</p>
                            {tier.description && <p className="text-xs text-muted-foreground">{tier.description}</p>}
                            <p className="text-xs text-muted-foreground">Quantity: {tier.quantity}</p>
                          </div>
                          <p className="font-semibold text-primary">${parseFloat(tier.price).toFixed(2)}</p>
                        </div>
                    ))}
                  </div>
              ) : (<p className="text-sm text-muted-foreground">No specific ticket tiers defined.</p>)}
            </div>

            {event.images && event.images.filter(img => img.url !== event.hero_image_url && img.url !== heroImage).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">More Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {event.images.filter(img => img.url !== event.hero_image_url && img.url !== heroImage).map(image => (
                        <img key={image.image_id} src={image.url} alt={image.caption || event.title} className="rounded-md object-cover aspect-square" />
                    ))}
                  </div>
                </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}

function EventCards({ events, onViewEvent, onEditEvent, onDeleteEventConfirm }) {
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
                <Button variant="outline" size="sm" onClick={() => onViewEvent(event.id)}> {/* Changed from Link */}
                  <Eye size={14} className="mr-1.5" /> View
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEditEvent(event.id)}> {/* Changed from Link, pass full event for prefill */}
                    <Edit size={14} className="mr-1.5" /> Edit
                  </Button>

                  <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteEventConfirm(event.id, event.title)} // Call onDeleteEvent
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