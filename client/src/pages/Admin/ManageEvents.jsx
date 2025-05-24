import React, { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiCore';
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
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showInspectDialog, setShowInspectDialog] = useState(false);
  const [allCategories, setAllCategories] = useState([]);


  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiClient.get('/admin/getAllEvents');
        // axios automatically throws for HTTP errors by default, but if not:
        if (response.status !== 200) {
          throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
        }
        const data = response.data; // the parsed JSON body
        console.log('Events:', data);
        setEvents(data);
        const categories = [...new Set(data.map(event => event.category))];
        setAllCategories(categories);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    fetchEvents();
  }, []);

   useEffect(() => {
    const applyFilters = async () => {
      try {
        const params = new URLSearchParams();

        if (searchTerm.trim()) params.append('search', searchTerm.trim());
        if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (startDate) params.append('start', startDate);
        if (endDate) params.append('end', endDate);

        const response = await apiClient.get(`/admin/getAllEventsFilter?${params.toString()}`);
        if (response.status !== 200) {
          throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
        }
        const data = response.data;
        setEvents(data);
      } catch (error) {
        console.error('Error applying filters:', error);
      }
    };
    applyFilters();
  
  },[searchTerm, categoryFilter, statusFilter, startDate, endDate]);
  

  const uniqueCategories = allCategories;

  
  
  

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
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground mt-1">View, verify and manage platform events</p>
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
          <div className="md:col-span-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
          </div>

          <div className="md:col-span-2">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
          </div>

          {/* Optional Reset button */}
          <div className="md:col-span-1">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStatusFilter('');
                setStartDate('');
                setEndDate('');
                // Reload all events when resetting filters
                apiClient.get('/admin/getAllEvents').then(async (response) => {
                  if (!response.ok) throw new Error('Failed to fetch events');
                  const data = await response.json();
                  setEvents(data);
                }).catch(console.error);
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
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 text-sm font-medium">Event ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Event Title</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Organizer</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Start</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">End</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{event.event_id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{event.title}</td>
                      <td className="px-4 py-3 text-sm">{event.display_name}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(event.start_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(event.end_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                        minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">{event.category}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowInspectDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
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
        
      <Dialog open={showInspectDialog} onOpenChange={setShowInspectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected event.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-2 text-sm">
              <p><strong>Event ID:</strong> {selectedEvent.event_id}</p>
              <p><strong>Title:</strong> {selectedEvent.title}</p>
              <p><strong>Organizer:</strong> {selectedEvent.display_name}</p>
              <p><strong>Start:</strong> {new Date(selectedEvent.start_at).toLocaleString()}</p>
              <p><strong>End:</strong> {new Date(selectedEvent.end_at).toLocaleString()}</p>
              <p><strong>Category:</strong> {selectedEvent.category}</p>
              <p><strong>Status:</strong> {selectedEvent.status}</p>
              <p><strong>Venue:</strong> {selectedEvent.name}</p>
              <p><strong>City:</strong> {selectedEvent.city}</p>
              <p><strong>Address:</strong> {selectedEvent.address}</p>
              <p><strong>Capacity:</strong> {selectedEvent.capacity}</p>
              <p><strong>Is Seated:</strong> {selectedEvent.is_seated ? 'Yes' : 'No'}</p>
              <p><strong>Ticket Base Price:</strong> {selectedEvent.base_price || 'N/A'}</p>
              <p><strong>Sold Tickets:</strong> {selectedEvent.tickets_sold || 'N/A'}</p>
              <p><strong>Description:</strong> {selectedEvent.description || 'N/A'}</p>
              <p><strong>Rules:</strong> {selectedEvent.rules || 'N/A'}</p>
              {/* Add more fields as needed */}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInspectDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

     
    </Layout>
  );
} 