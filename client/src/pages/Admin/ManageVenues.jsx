import React, { useState } from 'react';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { Search, MapPin, Users, Building, CheckCircle, XCircle, AlertTriangle, Edit, Trash2, Eye } from 'lucide-react';

export default function ManageVenues() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Mock data
  const venues = [
    {
      id: 'VEN1001',
      name: 'Central Park Stadium',
      city: 'New York',
      address: '5th Ave, New York, NY 10022',
      capacity: 5000,
      amenities: ['Parking', 'Food Court', 'Restrooms', 'VIP Lounge'],
      status: 'approved',
      owner: 'City Parks Department',
      contactEmail: 'venues@cityparks.gov',
      contactPhone: '(212) 555-1234',
      eventsHosted: 28,
      dateAdded: '2022-01-15'
    },
    {
      id: 'VEN1042',
      name: 'The Grand Convention Center',
      city: 'San Francisco',
      address: '747 Howard St, San Francisco, CA 94103',
      capacity: 3500,
      amenities: ['Wi-Fi', 'AV Equipment', 'Catering', 'Parking'],
      status: 'approved',
      owner: 'SF Events Group',
      contactEmail: 'bookings@grandconvention.com',
      contactPhone: '(415) 555-7890',
      eventsHosted: 42,
      dateAdded: '2022-03-20'
    },
    {
      id: 'VEN1078',
      name: 'Waterfront Exhibition Hall',
      city: 'Chicago',
      address: '301 E North Water St, Chicago, IL 60611',
      capacity: 2800,
      amenities: ['Lakefront View', 'Parking', 'Security', 'Catering'],
      status: 'approved',
      owner: 'Chicago Events Authority',
      contactEmail: 'info@waterfront-hall.com',
      contactPhone: '(312) 555-6543',
      eventsHosted: 35,
      dateAdded: '2022-05-12'
    },
    {
      id: 'VEN1103',
      name: 'Historic Theater',
      city: 'Boston',
      address: '106 Boylston St, Boston, MA 02116',
      capacity: 1200,
      amenities: ['Historic Building', 'Premium Sound', 'VIP Boxes'],
      status: 'approved',
      owner: 'Boston Arts Foundation',
      contactEmail: 'events@historictheater.org',
      contactPhone: '(617) 555-9876',
      eventsHosted: 56,
      dateAdded: '2021-11-03'
    },
    {
      id: 'VEN1150',
      name: 'Mountain View Arena',
      city: 'Denver',
      address: '1000 Chopper Cir, Denver, CO 80204',
      capacity: 4200,
      amenities: ['Mountain Views', 'Parking', 'Food Court', 'Premium Lounges'],
      status: 'pending',
      owner: 'Denver Sports & Events',
      contactEmail: 'booking@mtnviewarena.com',
      contactPhone: '(303) 555-2468',
      eventsHosted: 0,
      dateAdded: '2023-02-17'
    },
    {
      id: 'VEN1189',
      name: 'Sunset Beach Resort',
      city: 'Miami',
      address: '4525 Collins Ave, Miami Beach, FL 33140',
      capacity: 1800,
      amenities: ['Beach Access', 'Outdoor Space', 'Catering', 'Parking'],
      status: 'pending',
      owner: 'Miami Hospitality Group',
      contactEmail: 'events@sunsetbeachresort.com',
      contactPhone: '(305) 555-1357',
      eventsHosted: 0,
      dateAdded: '2023-03-08'
    },
    {
      id: 'VEN1210',
      name: 'Tech Conference Center',
      city: 'Seattle',
      address: '705 Pike St, Seattle, WA 98101',
      capacity: 2500,
      amenities: ['High-Speed Wi-Fi', 'AV Equipment', 'Breakout Rooms', 'Catering'],
      status: 'approved',
      owner: 'NW Tech Alliance',
      contactEmail: 'venues@nwtechalliance.org',
      contactPhone: '(206) 555-7531',
      eventsHosted: 23,
      dateAdded: '2022-08-14'
    },
    {
      id: 'VEN1245',
      name: 'Downtown Music Hall',
      city: 'Austin',
      address: '310 W 2nd St, Austin, TX 78701',
      capacity: 1500,
      amenities: ['Premium Sound', 'Bar Service', 'Green Room', 'Security'],
      status: 'rejected',
      owner: 'Austin Music Live',
      contactEmail: 'bookings@downtownmusichall.com',
      contactPhone: '(512) 555-8642',
      eventsHosted: 0,
      dateAdded: '2023-01-30'
    }
  ];

  // Filter venues based on search term, filters, and active tab
  const filteredVenues = venues.filter(venue => {
    const matchesSearch = 
      searchTerm === '' || 
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = cityFilter === 'all' || cityFilter === '' || venue.city === cityFilter;
    const matchesStatus = statusFilter === 'all' || statusFilter === '' || venue.status === statusFilter;
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'approved' && venue.status === 'approved') ||
      (activeTab === 'pending' && venue.status === 'pending') ||
      (activeTab === 'rejected' && venue.status === 'rejected');
    
    return matchesSearch && matchesCity && matchesStatus && matchesTab;
  });

  const uniqueCities = [...new Set(venues.map(venue => venue.city))];
  
  const approvedCount = venues.filter(venue => venue.status === 'approved').length;
  const pendingCount = venues.filter(venue => venue.status === 'pending').length;
  const rejectedCount = venues.filter(venue => venue.status === 'rejected').length;
  
  const handleDeleteVenue = (venueId) => {
    // API call 
    console.log(`Delete venue ${venueId}`);
    setShowDeleteDialog(false);
  };
  
  const handleApproveVenue = (venueId, approved) => {
    // API call
    console.log(`${approved ? 'Approve' : 'Reject'} venue ${venueId}`);
    setShowApproveDialog(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Venues</h1>
            <p className="text-muted-foreground mt-1">Review and approve venue registrations</p>
          </div>
          
        </div>

        {/* Tab Navigation */}
        <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All Venues
              <Badge variant="outline" className="ml-2">{venues.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              <Badge variant="outline" className="ml-2">{approvedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Approval
              <Badge variant="outline" className="ml-2">{pendingCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              <Badge variant="outline" className="ml-2">{rejectedCount}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search venues by name, city or ID..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="md:col-span-3">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-1">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSearchTerm('');
                setCityFilter('');
                setStatusFilter('');
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <Card key={venue.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-1">{venue.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {venue.city}
                    </CardDescription>
                  </div>
                  {getStatusBadge(venue.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">ID:</span> {venue.id}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Address:</span> {venue.address}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Capacity:</span> {venue.capacity.toLocaleString()} people
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Owner:</span> {venue.owner}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Contact:</span> {venue.contactEmail}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-muted-foreground mb-1">Amenities:</div>
                    <div className="flex flex-wrap gap-1">
                      {venue.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="font-normal">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="h-4 w-4 mr-1" />
                  {venue.eventsHosted} events hosted
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setSelectedVenue(venue);
                      // Open details dialog or link to details page
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {venue.status === 'pending' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setSelectedVenue(venue);
                        setShowApproveDialog(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => {
                      setSelectedVenue(venue);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {filteredVenues.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No venues match your filters</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedVenue && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Venue</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the venue "{selectedVenue.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteVenue(selectedVenue.id)}>
                Delete Venue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approve/Reject Confirmation Dialog */}
      {showApproveDialog && selectedVenue && (
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Venue</DialogTitle>
              <DialogDescription>
                Do you want to approve "{selectedVenue.name}" as a valid venue on the platform? This will make it available for organizers to book for their events.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="destructive" 
                onClick={() => handleApproveVenue(selectedVenue.id, false)}
              >
                Reject Venue
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowApproveDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                onClick={() => handleApproveVenue(selectedVenue.id, true)}
              >
                Approve Venue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
} 