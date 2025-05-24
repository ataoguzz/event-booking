import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { QrCode, Calendar, Clock, MapPin, Download, Eye, Star, Search, Ticket } from 'lucide-react';

export default function MyTickets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Mock data - would come from API in real app
  const tickets = [
    {
      id: 'TIX-001-28974',
      eventId: 1,
      eventName: 'Summer Music Festival',
      date: '2023-07-15',
      time: '18:00',
      venue: 'Central Park',
      location: 'New York, NY',
      seat: 'General Admission',
      price: 75,
      purchaseDate: '2023-05-10',
      status: 'upcoming',
      imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80'
    },
    {
      id: 'TIX-002-39281',
      eventId: 2,
      eventName: 'Tech Conference 2023',
      date: '2023-09-10',
      time: '09:00',
      venue: 'Convention Center',
      location: 'San Francisco, CA',
      seat: 'VIP Pass',
      price: 250,
      purchaseDate: '2023-06-22',
      status: 'upcoming',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    },
    {
      id: 'TIX-003-12938',
      eventId: 3,
      eventName: 'Comedy Night',
      date: '2023-06-25',
      time: '20:00',
      venue: 'The Laugh Factory',
      location: 'Los Angeles, CA',
      seat: 'Row C, Seat 15',
      price: 35,
      purchaseDate: '2023-06-02',
      status: 'past',
      imageUrl: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80',
      attended: true,
      reviewed: true,
      rating: 5
    },
    {
      id: 'TIX-004-84721',
      eventId: 4,
      eventName: 'Art Exhibition',
      date: '2023-04-05',
      time: '10:00',
      venue: 'Modern Art Gallery',
      location: 'Chicago, IL',
      seat: 'General Admission',
      price: 20,
      purchaseDate: '2023-03-28',
      status: 'past',
      imageUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      attended: true,
      reviewed: false
    },
    {
      id: 'TIX-005-37201',
      eventId: 5,
      eventName: 'Jazz in the Garden',
      date: '2023-06-30',
      time: '19:30',
      venue: 'Botanical Gardens',
      location: 'Boston, MA',
      seat: 'Section B, Row 5',
      price: 45,
      purchaseDate: '2023-05-15',
      status: 'upcoming',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80'
    }
  ];

  const upcomingTickets = tickets.filter(ticket => ticket.status === 'upcoming');
  const pastTickets = tickets.filter(ticket => ticket.status === 'past');

  // Filter tickets based on search
  const filteredTickets = tickets.filter(ticket => 
    ticket.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredUpcomingTickets = upcomingTickets.filter(ticket => 
    ticket.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredPastTickets = pastTickets.filter(ticket => 
    ticket.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  const closeTicketDialog = () => {
    setSelectedTicket(null);
  };

  const handleDownloadTicket = (ticketId) => {
    // This would connect to an API endpoint to generate and download the PDF ticket
    console.log(`Downloading ticket ${ticketId}`);
    alert(`Ticket ${ticketId} downloaded successfully!`);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage your purchased tickets and reservations</p>
        </div>

        {/* Ticket Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{tickets.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{upcomingTickets.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                ${tickets.reduce((sum, ticket) => sum + ticket.price, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search tickets by event name, venue, or ticket ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Tickets ({filteredTickets.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({filteredUpcomingTickets.length})</TabsTrigger>
            <TabsTrigger value="past">Past Events ({filteredPastTickets.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <TicketsList 
              tickets={filteredTickets} 
              onViewTicket={handleViewTicket} 
              onDownloadTicket={handleDownloadTicket}
            />
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-0">
            <TicketsList 
              tickets={filteredUpcomingTickets} 
              onViewTicket={handleViewTicket} 
              onDownloadTicket={handleDownloadTicket}
            />
          </TabsContent>
          
          <TabsContent value="past" className="mt-0">
            <TicketsList 
              tickets={filteredPastTickets} 
              onViewTicket={handleViewTicket} 
              onDownloadTicket={handleDownloadTicket}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket View Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={closeTicketDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ticket Details</DialogTitle>
              <DialogDescription>
                View the details of your ticket for {selectedTicket.eventName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg flex justify-center">
                <div className="text-center">
                  <QrCode size={150} className="mx-auto mb-2" />
                  <p className="text-sm font-mono">{selectedTicket.id}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Event</span>
                  <span className="font-medium">{selectedTicket.eventName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date & Time</span>
                  <span className="font-medium">
                    {new Date(selectedTicket.date).toLocaleDateString()} at {selectedTicket.time}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Venue</span>
                  <span className="font-medium">{selectedTicket.venue}, {selectedTicket.location}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Seat</span>
                  <span className="font-medium">{selectedTicket.seat}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-medium">${selectedTicket.price}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Purchase Date</span>
                  <span className="font-medium">{new Date(selectedTicket.purchaseDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={closeTicketDialog}>
                Close
              </Button>
              <Button onClick={() => handleDownloadTicket(selectedTicket.id)}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}

function TicketsList({ tickets, onViewTicket, onDownloadTicket }) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg">
        <h3 className="text-lg font-medium">No tickets found</h3>
        <p className="text-muted-foreground mt-1">Try adjusting your search or browse events to purchase tickets</p>
        <Button className="mt-4" asChild>
          <Link to="/browse-events">Browse Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="overflow-hidden">
          <div className="relative h-48">
            <img 
              src={ticket.imageUrl} 
              alt={ticket.eventName}
              className="w-full h-full object-cover" 
            />
            <Badge 
              className={`absolute top-4 right-4 ${
                ticket.status === 'upcoming' ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              {ticket.status === 'upcoming' ? 'Upcoming' : 'Past'}
            </Badge>
          </div>
          
          <CardHeader>
            <CardTitle className="text-xl">{ticket.eventName}</CardTitle>
            <CardDescription>{ticket.seat}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar size={16} className="mr-2 text-gray-500" />
              <span>{new Date(ticket.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <Clock size={16} className="mr-2 text-gray-500" />
              <span>{ticket.time}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <MapPin size={16} className="mr-2 text-gray-500" />
              <span>{ticket.venue}, {ticket.location}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <Ticket size={16} className="mr-2 text-gray-500" />
              <span>Ticket ID: {ticket.id}</span>
            </div>
            
            {ticket.status === 'past' && ticket.reviewed && (
              <div className="flex items-center text-sm">
                <Star size={16} className="mr-2 text-yellow-500 fill-yellow-500" />
                <span>Your rating: {ticket.rating}/5</span>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onViewTicket(ticket)}>
              <Eye size={16} className="mr-2" />
              View
            </Button>
            
            <Button 
              className="flex-1" 
              onClick={() => onDownloadTicket(ticket.id)}
            >
              <Download size={16} className="mr-2" />
              PDF
            </Button>
            
            {ticket.status === 'past' && !ticket.reviewed && (
              <Button variant="outline" className="flex-1" asChild>
                <Link to={`/events/${ticket.eventId}/review`}>
                  <Star size={16} className="mr-2" />
                  Review
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 