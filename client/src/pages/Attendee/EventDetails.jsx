import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  Wifi,
  Car,
  Coffee,
  Accessibility
} from 'lucide-react';

// Mock data - replace with API call
const mockEventDetails = {
  event_id: 1,
  title: 'Tech Conference 2024',
  description: 'Join us for the annual Tech Conference, bringing together the brightest minds in technology and innovation. Explore the latest trends, network with industry leaders, and gain valuable insights into the future of tech.',
  rules: '• All attendees must have a valid ticket\n• No outside food or beverages allowed\n• Recording of sessions is prohibited without prior consent\n• Be respectful to speakers and fellow attendees\n• Please arrive 30 minutes before the event starts',
  start_at: '2024-10-26T09:00:00Z',
  end_at: '2024-10-28T17:00:00Z',
  status: 'PUBLISHED',
  hero_image_url: 'https://via.placeholder.com/1200x600.png?text=Event+Hero+Image',
  images: [
    { url: 'https://via.placeholder.com/800x400.png?text=Event+Image+1', caption: 'Keynote Session' },
    { url: 'https://via.placeholder.com/800x400.png?text=Event+Image+2', caption: 'Networking Event' },
    { url: 'https://via.placeholder.com/800x400.png?text=Event+Image+3', caption: 'Workshop' }
  ],
  organizer: {
    display_name: 'Tech Event Organizers Inc.',
    avatar_url: 'https://via.placeholder.com/100.png?text=Org+Logo',
    rating: 4.8
  },
  venue: {
    venue_id: 101,
    name: 'Grand Convention Center',
    address: '123 Innovation Drive',
    city: 'Techville',
    capacity: 2500,
    is_seated: true,
    facilities: [
      { facility_id: 1, name: 'Wi-Fi' },
      { facility_id: 2, name: 'Parking' },
      { facility_id: 3, name: 'Cafe' },
      { facility_id: 4, name: 'Wheelchair Accessible' }
    ]
  },
  ticket_tiers: [
    { tier: 'General Admission', price: 199.99 },
    { tier: 'VIP Pass', price: 499.99 },
    { tier: 'Student Pass', price: 99.99 }
  ]
};

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedTicketTier, setSelectedTicketTier] = useState(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    // fetch(`/api/events/${eventId}/details`)
    //   .then(res => {
    //     if (!res.ok) {
    //       throw new Error('Failed to fetch event details');
    //     }
    //     return res.json();
    //   })
    //   .then(data => {
    //     setEvent(data);
    //     setLoading(false);
    //   })
    //   .catch(err => {
    //     setError(err.message);
    //     setLoading(false);
    //   });

    // Using mock data for now
    setTimeout(() => {
      setEvent(mockEventDetails);
      setLoading(false);
    }, 1000);
  }, [eventId]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="text-center">Loading event details...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="text-center text-red-500">Error: {error}</div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="text-center">Event not found.</div>
        </div>
      </Layout>
    );
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % event.images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + event.images.length) % event.images.length);
  };
  
  const formatEventDate = (dateString) => {
    return format(new Date(dateString), "EEEE, MMMM do, yyyy");
  };

  const formatEventTime = (dateString) => {
    return format(new Date(dateString), "h:mm a");
  };

  const getFacilityIcon = (facilityName) => {
    const name = facilityName.toLowerCase();
    if (name.includes('wifi') || name.includes('wi-fi')) return <Wifi className="h-4 w-4" />;
    if (name.includes('parking') || name.includes('car')) return <Car className="h-4 w-4" />;
    if (name.includes('cafe') || name.includes('coffee') || name.includes('food')) return <Coffee className="h-4 w-4" />;
    if (name.includes('wheelchair') || name.includes('accessible')) return <Accessibility className="h-4 w-4" />;
    return null;
  };

  const handleProceedToBooking = () => {
    if (selectedTicketTier) {
      const url = event.venue.is_seated 
        ? `/events/${event.event_id}/choose-seat?tier=${encodeURIComponent(selectedTicketTier)}`
        : `/events/${event.event_id}/purchase-tickets?tier=${encodeURIComponent(selectedTicketTier)}`;
      navigate(url);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="relative mb-8">
          <img 
            src={event.hero_image_url} 
            alt={event.title} 
            className="w-full h-[400px] object-cover rounded-xl"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-xl" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{event.title}</h1>
            <div className="flex items-center space-x-4 text-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {formatEventDate(event.start_at)}
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                {formatEventTime(event.start_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-semibold">{formatEventDate(event.start_at)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatEventTime(event.start_at)} - {formatEventTime(event.end_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="font-semibold">{event.venue.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.venue.city}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Event Gallery */}
            {event.images && event.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="aspect-video relative overflow-hidden rounded-lg">
                      <img 
                        src={event.images[currentImageIndex].url} 
                        alt={event.images[currentImageIndex].caption || `Event image ${currentImageIndex + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      {event.images.length > 1 && (
                        <>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2"
                            onClick={handlePrevImage}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={handleNextImage}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    {event.images[currentImageIndex].caption && (
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        {event.images[currentImageIndex].caption}
                      </p>
                    )}
                    {event.images.length > 1 && (
                      <div className="flex justify-center mt-4 space-x-2">
                        {event.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Venue Information */}
            <Card>
              <CardHeader>
                <CardTitle>Venue Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">{event.venue.name}</h4>
                  <div className="flex items-start space-x-2 text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4 mt-1" />
                    <div>
                      <p>{event.venue.address}</p>
                      <p>{event.venue.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {event.venue.capacity.toLocaleString()}</span>
                  </div>
                </div>

                {event.venue.facilities && event.venue.facilities.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3">Facilities</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {event.venue.facilities.map(facility => (
                        <div key={facility.facility_id} className="flex items-center space-x-2 text-sm">
                          {getFacilityIcon(facility.name)}
                          <span>{facility.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rules & Information */}
            {event.rules && (
              <Card>
                <CardHeader>
                  <CardTitle>Rules & Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <div className="whitespace-pre-line">{event.rules}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Information */}
            <Card>
              <CardHeader>
                <CardTitle>Select Ticket Tier</CardTitle>
                <CardDescription>Choose your ticket tier to continue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.ticket_tiers && event.ticket_tiers.length > 0 ? (
                  <div className="space-y-3">
                    {event.ticket_tiers.map(tier => (
                      <div 
                        key={tier.tier} 
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTicketTier === tier.tier 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedTicketTier(tier.tier)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedTicketTier === tier.tier 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {selectedTicketTier === tier.tier && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <p className="font-medium">{tier.tier}</p>
                          </div>
                          <Badge variant="secondary" className="text-lg font-bold">
                            ${tier.price.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Ticket information is not yet available.</p>
                )}

                <Separator />

                {event.status === 'PUBLISHED' ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={!selectedTicketTier}
                    onClick={handleProceedToBooking}
                  >
                    {event.venue.is_seated ? 'Choose Seat' : 'Purchase Tickets'}
                  </Button>
                ) : (
                  <div className="text-center text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    {event.status === 'CANCELLED' ? 'This event has been cancelled.' : 
                     event.status === 'COMPLETED' ? 'This event has ended.' :
                     'Tickets are not yet available for this event.'}
                  </div>
                )}

                {!selectedTicketTier && event.status === 'PUBLISHED' && (
                  <p className="text-xs text-muted-foreground text-center">
                    Please select a ticket tier to continue
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Organizer Information */}
            {event.organizer && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Organizer</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <img 
                      src={event.organizer.avatar_url} 
                      alt={event.organizer.display_name} 
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm leading-tight break-words">
                        {event.organizer.display_name}
                      </p>
                      {event.organizer.rating && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {event.organizer.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetails;
