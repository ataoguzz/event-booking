import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Calendar, Clock, MapPin, Users, Edit, Eye, Trash2, Search, Filter } from 'lucide-react';

export default function MyEvents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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
      capacity: 5000,
      soldTickets: 3245,
      status: 'published',
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80'
    },
    {
      id: 2,
      title: 'Tech Conference 2023',
      type: 'Conference',
      date: '2023-09-10',
      time: '09:00',
      venue: 'Convention Center',
      location: 'San Francisco, CA',
      capacity: 1200,
      soldTickets: 980,
      status: 'published',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    },
    {
      id: 3,
      title: 'Comedy Night',
      type: 'Stand-up Comedy',
      date: '2023-06-25',
      time: '20:00',
      venue: 'The Laugh Factory',
      location: 'Los Angeles, CA',
      capacity: 300,
      soldTickets: 0,
      status: 'draft',
      image: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80'
    },
    {
      id: 4,
      title: 'Art Exhibition',
      type: 'Exhibition',
      date: '2023-08-05',
      time: '10:00',
      venue: 'Modern Art Gallery',
      location: 'Chicago, IL',
      capacity: 500,
      soldTickets: 215,
      status: 'published',
      image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    }
  ];

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Group events by status for tabs
  const publishedEvents = filteredEvents.filter(event => event.status === 'published');
  const draftEvents = filteredEvents.filter(event => event.status === 'draft');

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
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Concert">Concert</SelectItem>
                <SelectItem value="Conference">Conference</SelectItem>
                <SelectItem value="Stand-up Comedy">Stand-up Comedy</SelectItem>
                <SelectItem value="Exhibition">Exhibition</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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
            <EventCards events={filteredEvents} />
          </TabsContent>
          
          <TabsContent value="published" className="mt-0">
            <EventCards events={publishedEvents} />
          </TabsContent>
          
          <TabsContent value="draft" className="mt-0">
            <EventCards events={draftEvents} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function EventCards({ events }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg">
        <h3 className="text-lg font-medium">No events found</h3>
        <p className="text-muted-foreground mt-1">Try adjusting your filters or create a new event</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden">
          <div className="relative h-48">
            <img 
              src={event.image} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
            <Badge 
              className={`absolute top-4 right-4 ${
                event.status === 'published' ? 'bg-green-500' : 'bg-amber-500'
              }`}
            >
              {event.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
          </div>
          
          <CardHeader>
            <CardTitle className="text-xl">{event.title}</CardTitle>
            <CardDescription>{event.type}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar size={16} className="mr-2 text-gray-500" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
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
            
            <div className="flex items-center text-sm">
              <Users size={16} className="mr-2 text-gray-500" />
              <span>{event.soldTickets} / {event.capacity} tickets sold</span>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/events/${event.id}`}>
                <Eye size={16} className="mr-2" />
                View
              </Link>
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/events/${event.id}/edit`}>
                  <Edit size={16} className="mr-2" />
                  Edit
                </Link>
              </Button>
              
              <Button variant="destructive" size="sm">
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 