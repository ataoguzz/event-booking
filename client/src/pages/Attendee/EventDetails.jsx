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
  Accessibility,
  Utensils,
  Wine,
  Bus,
  CreditCard
} from 'lucide-react';
import apiClient from '../../helpers/apiCore.js';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/event/${eventId}/details`);
        setEvent(response.data);
        setError(null);
      
        setCurrentImageIndex(0);
        setImageLoadingStates({});
        setImageErrors({});
        
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.response?.data?.error || 'Failed to fetch event details');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  // Preload images when event data is loaded
  useEffect(() => {
    if (event?.images?.length > 0) {
      event.images.forEach((image, index) => {
        const img = new Image();
        setImageLoadingStates(prev => ({ ...prev, [index]: true }));
        
        img.onload = () => {
          setImageLoadingStates(prev => ({ ...prev, [index]: false }));
        };
        
        img.onerror = () => {
          setImageLoadingStates(prev => ({ ...prev, [index]: false }));
          setImageErrors(prev => ({ ...prev, [index]: true }));
        };
        
        img.src = image.url;
      });
    }
  }, [event?.images]);

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
    if (name.includes('parking')) return <Car className="h-4 w-4" />;
    if (name.includes('cafe') || name.includes('coffee') || name.includes('food')) return <Coffee className="h-4 w-4" />;
    if (name.includes('wheelchair') || name.includes('access')) return <Accessibility className="h-4 w-4" />;
    if (name.includes('restaurant')) return <Utensils className="h-4 w-4" />;
    if (name.includes('bar')) return <Wine className="h-4 w-4" />;
    if (name.includes('transport') || name.includes('bus') || name.includes('train')) return <Bus className="h-4 w-4" />;
    if (name.includes('atm')) return <CreditCard className="h-4 w-4" />;
    return null;
  };

  const handleProceedToBooking = () => {
    // Always navigate to the seat selection page (it handles both seated and non-seated events)
    navigate(`/event/${event.event_id}/choose-seat`);
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
                    <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-100">
                      {imageLoadingStates[currentImageIndex] && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-gray-500">Loading image...</div>
                        </div>
                      )}
                      
                      {imageErrors[currentImageIndex] ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <div className="text-gray-500">Failed to load image</div>
                        </div>
                      ) : (
                        <img 
                          key={`image-${currentImageIndex}`}
                          src={event.images[currentImageIndex].url} 
                          alt={event.images[currentImageIndex].caption || `Event image ${currentImageIndex + 1}`} 
                          className="w-full h-full object-cover"
                          onLoad={() => setImageLoadingStates(prev => ({ ...prev, [currentImageIndex]: false }))}
                          onError={() => {
                            setImageLoadingStates(prev => ({ ...prev, [currentImageIndex]: false }));
                            setImageErrors(prev => ({ ...prev, [currentImageIndex]: true }));
                          }}
                        />
                      )}
                      
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
                    {event.images[currentImageIndex]?.caption && (
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
                <CardTitle>Available Ticket Tiers</CardTitle>
                <CardDescription>Ticket options for this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.ticket_tiers && event.ticket_tiers.length > 0 ? (
                  <div className="space-y-3">
                    {event.ticket_tiers.map(tier => (
                      <div 
                        key={tier.tier} 
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{tier.tier}</p>
                            {tier.description && (
                              <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                            )}
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
                    onClick={handleProceedToBooking}
                  >
                    {event.venue.is_seated ? 'Choose Seats' : 'Buy Tickets'}
                  </Button>
                ) : (
                  <div className="text-center text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    {event.status === 'CANCELLED' ? 'This event has been cancelled.' : 
                     event.status === 'COMPLETED' ? 'This event has ended.' :
                     'Tickets are not yet available for this event.'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Information */}
            {event.organizer && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                      <img 
                        src={event.organizer.avatar_url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <Link 
                        to={`/organizers/${event.organizer.account_id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 block transition-colors"
                      >
                        {event.organizer.display_name}
                      </Link>
                      {event.organizer.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-500">
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
