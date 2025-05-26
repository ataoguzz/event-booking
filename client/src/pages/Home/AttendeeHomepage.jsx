import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from "@/components/Layout.jsx";
import { Button, buttonVariants } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  Heart,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import apiClient from '../../helpers/apiCore.js';
import { cn } from '@/lib/utils';

export default function AttendeeHomepage() {
  const { user } = useAuth();
  const [followedEvents, setFollowedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFollowedEvents = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/users/followed-events?limit=10');
        setFollowedEvents(response.data.events);
        setError(null);
      } catch (err) {
        console.error('Error fetching followed events:', err);
        setError(err.response?.data?.error || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFollowedEvents();
    }
  }, [user]);

  const formatTimeUntilEvent = (eventDate) => {
    const now = new Date();
    const event = new Date(eventDate);
    const diffMs = event - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today!';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays <= 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return `In ${Math.ceil(diffDays / 30)} months`;
  };

  const formatEventDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user?.full_name}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Here are the latest events from organizers you follow
          </p>
        </div>

        {/* Events Section */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your personalized events...</p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : followedEvents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events from followed organizers</h3>
              <p className="text-muted-foreground mb-4">
                Start following organizers to see their latest events here
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/browse-events" className={cn(buttonVariants())}>
                  Browse Events
                </Link>
                <Link to="/find-organizers" className={cn(buttonVariants({ variant: "outline" }))}>
                  Find Organizers
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Events from Your Followed Organizers ({followedEvents.length})
              </h2>
              <Link to="/browse-events" className={cn(buttonVariants({ variant: "outline" }))}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Browse All Events
              </Link>
            </div>

            {/* Events List */}
            <div className="space-y-4">
              {followedEvents.map((event) => (
                <Card key={event.event_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Event Image */}
                      <div className="flex-shrink-0">
                        <img 
                          src={event.cover_url} 
                          alt={event.title}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                      
                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {event.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {formatTimeUntilEvent(event.start_at)}
                              </Badge>
                            </div>
                            
                            <h3 className="text-xl font-semibold mb-2 line-clamp-1">
                              {event.title}
                            </h3>
                            
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {event.description}
                            </p>
                            
                            {/* Event Meta */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatEventDate(event.start_at)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatEventTime(event.start_at)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{event.venue_name}, {event.venue_city}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>By {event.organizer.display_name}</span>
                                {event.organizer.rating && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs">{event.organizer.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Price and Action */}
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="text-2xl font-bold text-primary mb-2">
                              ${event.base_price.toFixed(2)}
                            </div>
                            <Link to={`/event/${event.event_id}`} className={cn(buttonVariants())}>
                              View Event
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* View More Button */}
            {followedEvents.length >= 10 && (
              <div className="text-center pt-6">
                <Link to="/browse-events?following=true" className={cn(buttonVariants({ variant: "outline" }))}>
                  View More Events from Followed Organizers
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}