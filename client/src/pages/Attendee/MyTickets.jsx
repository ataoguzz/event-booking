import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Calendar, Clock, MapPin, Download, Eye, Star, Search, Ticket, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import QRCode from 'react-qr-code';
import apiClient from '../../helpers/apiCore.js';

export default function MyTickets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/tickets');
        setTickets(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError(err.response?.data?.error || 'Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const upcomingTickets = tickets.filter(ticket => ticket.status === 'upcoming');
  const pastTickets = tickets.filter(ticket => ticket.status === 'past');

  // Filter tickets based on search
  const filteredTickets = tickets.filter(ticket => 
    ticket.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredUpcomingTickets = upcomingTickets.filter(ticket => 
    ticket.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredPastTickets = pastTickets.filter(ticket => 
    ticket.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewTicket = async (ticket) => {
    try {
      // Fetch detailed ticket information
      const response = await apiClient.get(`/tickets/${ticket.id}`);
      setSelectedTicket(response.data);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      alert('Failed to load ticket details');
    }
  };

  const closeTicketDialog = () => {
    setSelectedTicket(null);
  };

  const handleDownloadTicket = async (ticketId) => {
    try {
      // Download PDF using the new downloadFile method
      const response = await apiClient.downloadFile(`/tickets/${ticketId}/download`);
      
      // Create blob URL and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${ticketId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading ticket:', err);
      alert('Failed to download ticket PDF');
    }
  };

  const generateQRCodeData = (ticket) => {
    // Generate the same QR data structure as the backend
    return {
      ticket_id: ticket.id,
      event_id: ticket.eventId,
      qr_token: ticket.qr_token,
      guest_name: ticket.guestName,
      seat: ticket.seat,
      date: ticket.date,
      verification_hash: btoa(`${ticket.id}-${ticket.qr_token}-${ticket.eventId}`)
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your tickets...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage your purchased tickets and reservations</p>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                ${tickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0).toFixed(2)}
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
                  <div className="bg-white p-4 border rounded-lg inline-block">
                    <QRCode 
                      value={JSON.stringify(generateQRCodeData(selectedTicket))}
                      size={150}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <p className="text-sm font-mono mt-2">Ticket ID: {selectedTicket.id}</p>
                  <p className="text-xs text-gray-500 mt-1">Present this QR code at entry</p>
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
                    {new Date(selectedTicket.date).toLocaleDateString()} at {selectedTicket.time || 'TBD'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Venue</span>
                  <span className="font-medium">{selectedTicket.venue}</span>
                </div>

                {selectedTicket.venueAddress && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Address</span>
                    <span className="font-medium">{selectedTicket.venueAddress}, {selectedTicket.location}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Seat/Tier</span>
                  <span className="font-medium">{selectedTicket.seat}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Guest</span>
                  <span className="font-medium">{selectedTicket.guestName}</span>
                </div>

                {selectedTicket.guestEmail && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium">{selectedTicket.guestEmail}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-medium">${selectedTicket.price?.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Purchase Date</span>
                  <span className="font-medium">{new Date(selectedTicket.purchaseDate).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={selectedTicket.ticketStatus === 'PURCHASED' ? 'default' : 'secondary'}>
                    {selectedTicket.ticketStatus}
                  </Badge>
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
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="text-left p-4 font-medium">Event</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Venue</th>
              <th className="text-left p-4 font-medium">Seat/Tier</th>
              <th className="text-left p-4 font-medium">Guest</th>
              <th className="text-left p-4 font-medium">Price</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={ticket.imageUrl} 
                      alt={ticket.eventName}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <div className="font-medium text-sm">{ticket.eventName}</div>
                      <div className="text-xs text-muted-foreground">ID: {ticket.id}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    {new Date(ticket.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  {ticket.time && (
                    <div className="text-xs text-muted-foreground">{ticket.time}</div>
                  )}
                </td>
                <td className="p-4">
                  <div className="text-sm">{ticket.venue}</div>
                  <div className="text-xs text-muted-foreground">{ticket.location}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm">{ticket.seat}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm">{ticket.guestName}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium">
                    {ticket.price ? `$${ticket.price.toFixed(2)}` : 'Free'}
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant={ticket.status === 'upcoming' ? 'default' : 'secondary'} className="text-xs">
                    {ticket.status === 'upcoming' ? 'Upcoming' : 'Past'}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onViewTicket(ticket)}
                      className="text-xs"
                    >
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => onDownloadTicket(ticket.id)}
                      className="text-xs"
                    >
                      <Download size={14} className="mr-1" />
                      PDF
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 