import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import apiClient from '../../helpers/apiCore';
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
  const [venueRequests, setVenueRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const approvedRequests = venueRequests.filter(v => v.status === 'APPROVED');
  const pendingRequests = venueRequests.filter(v => v.status === 'PENDING');
  const rejectedRequests = venueRequests.filter(v => v.status === 'REJECTED');

  const getFilteredRequests = () => {
    switch (activeTab) {
      case 'APPROVED':
        return approvedRequests;
      case 'PENDING':
        return pendingRequests;
      case 'REJECTED':
        return rejectedRequests;
      default:
        return venueRequests;
    }
  };

  const filteredRequests = getFilteredRequests().filter(venue => {
    const matchesSearch =
      searchTerm === '' ||
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = cityFilter === 'all' || cityFilter === '' || venue.city === cityFilter;
    const matchesStatus = statusFilter === 'all' || statusFilter === '' || venue.status === statusFilter;

    return matchesSearch && matchesCity && matchesStatus;
  });

  const uniqueCities = [...new Set(venueRequests.map(venue => venue.city))];
  
  const approvedCount = approvedRequests.length;
  const pendingCount = pendingRequests.length;
  const rejectedCount = rejectedRequests.length;
  
  const handleDeleteVenue = (venueId) => {
    console.log(`Delete venue ${venueId}`);
    setShowDeleteDialog(false);
  };
  
  const handleApproveVenue = (venueId, approved) => {
    console.log(`${approved ? 'Approve' : 'Reject'} venue ${venueId}`);
    setShowApproveDialog(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const [counts, setCounts] = useState({ APPROVED: 0, PENDING: 0, REJECTED: 0 });

useEffect(() => {
  setLoading(true);
  setError(null);

  // Build query params
  const params = new URLSearchParams();
  if (activeTab !== 'all') params.append('status', activeTab);
  if (cityFilter && cityFilter !== 'all') params.append('city', cityFilter);
  if (searchTerm) params.append('search', searchTerm);

  apiClient.get(`/admin/venuesRequests?${params.toString()}`)
    .then(res => {
      setVenueRequests(res.data.venues);
      setCounts(res.data.counts);
      setLoading(false);
    })
    .catch(() => {
      setError('Failed to load venue requests');
      setLoading(false);
    });
}, [activeTab, cityFilter, searchTerm]);

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
              All Requests
              <Badge variant="outline" className="ml-2">{venueRequests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="APPROVED">
              Approved
              <Badge variant="outline" className="ml-2">{counts.APPROVED}</Badge>
            </TabsTrigger>
            <TabsTrigger value="PENDING">
              Pending
              <Badge variant="outline" className="ml-2">{counts.PENDING}</Badge>
            </TabsTrigger>
            <TabsTrigger value="REJECTED">
              Rejected
              <Badge variant="outline" className="ml-2">{counts.REJECTED}</Badge>
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
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
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
          {filteredRequests.map((venue) => (
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
                    <span className="font-medium text-muted-foreground">Seated:</span> {venue.seated ? 'Yes' : 'No'}
                  </div>
                  {venue.seated ? (
                    <>
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Rows:</span> {venue.rows}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Columns:</span> {venue.columns}
                      </div>
                    </>
                  ) : null}
                  
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-3">
                {venue.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={async () => {
                        await apiClient.post('/admin/evaluateVenueRequest', {
                          request_id: venue.id,
                          action: 'APPROVED',
                        });
                        // Refresh the list
                        const params = new URLSearchParams();
                        if (activeTab !== 'all') params.append('status', activeTab);
                        if (cityFilter && cityFilter !== 'all') params.append('city', cityFilter);
                        if (searchTerm) params.append('search', searchTerm);
                        const res = await apiClient.get(`/admin/venuesRequests?${params.toString()}`);
                        setVenueRequests(res.data);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        await apiClient.post('/admin/evaluateVenueRequest', {
                          request_id: venue.id,
                          action: 'REJECTED',
                        });
                        // Refresh the list
                        const params = new URLSearchParams();
                        if (activeTab !== 'all') params.append('status', activeTab);
                        if (cityFilter && cityFilter !== 'all') params.append('city', cityFilter);
                        if (searchTerm) params.append('search', searchTerm);
                        const res = await apiClient.get(`/admin/venuesRequests?${params.toString()}`);
                        setVenueRequests(res.data);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {filteredRequests.length === 0 && (
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