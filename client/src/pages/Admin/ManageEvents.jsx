import React, { useState } from 'react';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Calendar as CalendarIcon, Search, Edit, Trash2, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function ManageEvents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  
  // Mock data
  const events = [
    {
      id: 'EV1001',
      name: 'Summer Music Festival',
      organizer: 'Music Events Inc.',
      organizerId: 'ORG123',
      date: '2023-08-15',
      category: 'Concerts',
      location: 'Central Park, New York',
      status: 'active',
      isVerified: true,
      ticketsSold: 2500,
      capacity: 3000,
      revenue: 45000
    },
    {
      id: 'EV1042',
      name: 'Tech Conference 2023',
      organizer: 'TechTalks Group',
      organizerId: 'ORG456',
      date: '2023-09-20',
      category: 'Conferences',
      location: 'Convention Center, San Francisco',
      status: 'active',
      isVerified: true,
      ticketsSold: 1850,
      capacity: 2000,
      revenue: 38500
    },
    {
      id: 'EV1078',
      name: 'International Food Fair',
      organizer: 'FoodCulture Events',
      organizerId: 'ORG789',
      date: '2023-07-10',
      category: 'Food & Drink',
      location: 'Exhibition Hall, Chicago',
      status: 'active',
      isVerified: true,
      ticketsSold: 2100,
      capacity: 2500,
      revenue: 31200
    },
    {
      id: 'EV1103',
      name: 'Sports Championship Finals',
      organizer: 'Sports League Org',
      organizerId: 'ORG321',
      date: '2023-06-30',
      category: 'Sports',
      location: 'Stadium, Los Angeles',
      status: 'completed',
      isVerified: true,
      ticketsSold: 1650,
      capacity: 2000,
      revenue: 28900
    },
    {
      id: 'EV1150',
      name: 'Local Art Exhibition',
      organizer: 'Community Arts Group',
      organizerId: 'ORG654',
      date: '2023-09-05',
      category: 'Arts',
      location: 'Art Gallery, Portland',
      status: 'pending',
      isVerified: false,
      ticketsSold: 0,
      capacity: 200,
      revenue: 0
    },
    {
      id: 'EV1189',
      name: 'Business Networking Gala',
      organizer: 'Enterprise Network',
      organizerId: 'ORG987',
      date: '2023-08-25',
      category: 'Business',
      location: 'Grand Hotel, Boston',
      status: 'active',
      isVerified: true,
      ticketsSold: 320,
      capacity: 400,
      revenue: 16000
    },
    {
      id: 'EV1210',
      name: 'Science Fair',
      organizer: 'Education First',
      organizerId: 'ORG135',
      date: '2023-10-15',
      category: 'Education',
      location: 'Science Museum, Seattle',
      status: 'pending',
      isVerified: false,
      ticketsSold: 0,
      capacity: 500,
      revenue: 0
    },
    {
      id: 'EV1245',
      name: 'Comedy Night Special',
      organizer: 'Laugh Factory',
      organizerId: 'ORG246',
      date: '2023-07-20',
      category: 'Entertainment',
      location: 'Comedy Club, Austin',
      status: 'cancelled',
      isVerified: true,
      ticketsSold: 75,
      capacity: 150,
      revenue: 1500
    }
  ];

  // Filter events based on search term and filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      searchTerm === '' || 
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || categoryFilter === '' || event.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || statusFilter === '' || event.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const uniqueCategories = [...new Set(events.map(event => event.category))];
  
  const handleDeleteEvent = (eventId) => {
    // API call
    console.log(`Delete event ${eventId}`);
    setShowDeleteDialog(false);
  };
  
  const handleVerifyEvent = (eventId, verified) => {
    // API call
    console.log(`${verified ? 'Verify' : 'Unverify'} event ${eventId}`);
    setShowVerifyDialog(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Events</h1>
            <p className="text-muted-foreground mt-1">View, verify and manage platform events</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="default">
              Export Data
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search events, organizers or IDs..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="md:col-span-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-1">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>
              Showing {filteredEvents.length} of {events.length} events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 text-sm font-medium">Event ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Event Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Organizer</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Verified</th>
                    <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{event.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{event.name}</td>
                      <td className="px-4 py-3 text-sm">{event.organizer}</td>
                      <td className="px-4 py-3 text-sm">{new Date(event.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{event.category}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {event.isVerified ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <XCircle className="h-5 w-5 text-gray-400" />
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-right space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowVerifyDialog(true);
                          }}
                        >
                          {event.isVerified ? 
                            <AlertTriangle className="h-4 w-4 text-yellow-500" /> : 
                            <CheckCircle className="h-4 w-4" />
                          }
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedEvent && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the event "{selectedEvent.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteEvent(selectedEvent.id)}>
                Delete Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Verify Confirmation Dialog */}
      {showVerifyDialog && selectedEvent && (
        <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedEvent.isVerified ? 'Remove Verification' : 'Verify Event'}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent.isVerified 
                  ? `Are you sure you want to remove verification from "${selectedEvent.name}"? The event will no longer appear as verified to users.`
                  : `Are you sure you want to verify "${selectedEvent.name}"? This will mark the event as officially verified by the platform.`
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant={selectedEvent.isVerified ? "destructive" : "default"}
                onClick={() => handleVerifyEvent(selectedEvent.id, !selectedEvent.isVerified)}
              >
                {selectedEvent.isVerified ? 'Remove Verification' : 'Verify Event'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
} 