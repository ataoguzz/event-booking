import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Calendar, MapPin, Users, Star, Check, Plus } from 'lucide-react';
import apiClient from '../../helpers/apiCore.js';
import { cn } from '@/lib/utils';

export default function AttendeeOrganizerProfile() {
  const { id } = useParams();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrganizerData = async () => {
      try {
        setLoading(true);
        const [organizerRes, eventsRes, followingRes] = await Promise.all([
          apiClient.get(`/users/organizers/${id}`),
          apiClient.get(`/events/organizer/${id}`),
          apiClient.get(`/users/organizers/following`)
        ]);

        console.log('Raw events data:', eventsRes.data);
        
        const now = new Date();
        const upcoming = eventsRes.data.filter(event => {
          const eventEndDate = new Date(event.end_at);
          console.log('Event:', event.title, 'End date:', eventEndDate, 'Is upcoming:', eventEndDate >= now);
          return eventEndDate >= now;
        });
        
        const past = eventsRes.data.filter(event => {
          const eventEndDate = new Date(event.end_at);
          console.log('Event:', event.title, 'End date:', eventEndDate, 'Is past:', eventEndDate < now);
          return eventEndDate < now;
        });
        
        console.log('Filtered upcoming events:', upcoming);
        console.log('Filtered past events:', past);

        setOrganizer(organizerRes.data);
        setEvents(eventsRes.data);
        setIsFollowing(followingRes.data.includes(parseInt(id)));
        setError(null);
      } catch (err) {
        console.error('Error fetching organizer data:', err);
        setError(err.response?.data?.error || 'Failed to load organizer profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrganizerData();
    }
  }, [id]);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await apiClient.delete(`/users/organizers/follow/${id}`);
        setOrganizer(prev => ({
          ...prev,
          followers_count: prev.followers_count - 1
        }));
      } else {
        await apiClient.post(`/users/organizers/follow/${id}`);
        setOrganizer(prev => ({
          ...prev,
          followers_count: prev.followers_count + 1
        }));
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading organizer profile...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !organizer) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground">{error || 'Failed to load organizer profile'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const upcomingEvents = events.filter(event => new Date(event.start_at) > new Date());
  const pastEvents = events.filter(event => new Date(event.start_at) <= new Date());
  const rating = organizer.average_rating ? Number(organizer.average_rating) : 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={organizer.avatar_url} />
              <AvatarFallback>{organizer.display_name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{organizer.display_name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center">
                  <Star className={cn("h-5 w-5 mr-1", rating > 0 ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                  <span className="font-medium">{rating > 0 ? rating.toFixed(1) : 'No ratings'}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-1" />
                  <span>{organizer.followers_count.toLocaleString()} followers</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-1" />
                  <span>{events.length} events</span>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">{organizer.bio}</p>
              <Button
                onClick={handleFollowToggle}
                variant={isFollowing ? 'default' : 'secondary'}
                className="min-w-[120px]"
              >
                {isFollowing ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Following
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming Events ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Events ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <EventCard key={event.event_id} event={event} />
              ))}
              {upcomingEvents.length === 0 && (
                <div className="col-span-full text-center py-12 border rounded-lg">
                  <h3 className="text-lg font-medium">No upcoming events</h3>
                  <p className="text-muted-foreground mt-1">Check back later for new events</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map(event => (
                <EventCard key={event.event_id} event={event} showRating />
              ))}
              {pastEvents.length === 0 && (
                <div className="col-span-full text-center py-12 border rounded-lg">
                  <h3 className="text-lg font-medium">No past events</h3>
                  <p className="text-muted-foreground mt-1">This organizer hasn't hosted any events yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function EventCard({ event, showRating }) {
  const rating = event.average_rating ? Number(event.average_rating) : 0;

  return (
    <Card>
      <div className="relative h-48">
        <img
          src={event.hero_image_url}
          alt={event.title}
          className="w-full h-full object-cover rounded-t-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-lg" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-semibold text-white mb-1">{event.title}</h3>
          <div className="flex items-center text-white/90 text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {new Date(event.start_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant={event.status.toLowerCase() === 'upcoming' ? 'default' : 'secondary'}>
            {event.status}
          </Badge>
          {showRating && (
            <div className="flex items-center">
              <Star className={cn("h-4 w-4 mr-1", rating > 0 ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
              <span>{rating > 0 ? rating.toFixed(1) : 'No ratings'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{event.venue_name}, {event.venue_city}</span>
        </div>
      </CardContent>
    </Card>
  );
} 