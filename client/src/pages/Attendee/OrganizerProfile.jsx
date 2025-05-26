import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Button, buttonVariants } from '@/components/ui/button.jsx';
import { StarIcon, UserIcon, Check, Plus, CalendarDays, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import organizerService from '@/services/organizerService.js';
import { cn } from '@/lib/utils';

export default function OrganizerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [organizer, setOrganizer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

  // Get API base URL from the window location instead of hardcoding
  const apiBaseUrl = import.meta.env.VITE_API_URL || 
                     window.location.origin.replace(/:\d+$/, ':3001');

  useEffect(() => {
    const fetchOrganizerProfile = async () => {
      try {
        setIsLoading(true);
        const response = await organizerService.getPublicProfile(id);
        setOrganizer(response);
        setIsFollowing(response.is_following);
      } catch (error) {
        console.error('Error fetching organizer profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load organizer profile"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOrganizerProfile();
    }
  }, [id, toast]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow organizers",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsFollowingLoading(true);
      if (isFollowing) {
        await organizerService.unfollowOrganizer(id);
        setOrganizer(prev => ({
          ...prev,
          followers_count: prev.followers_count - 1,
          is_following: false
        }));
      } else {
        await organizerService.followOrganizer(id);
        setOrganizer(prev => ({
          ...prev,
          followers_count: prev.followers_count + 1,
          is_following: true
        }));
      }
      setIsFollowing(!isFollowing);
      
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? `You are no longer following ${organizer.display_name}`
          : `You are now following ${organizer.display_name}`
      });
    } catch (error) {
      console.error('Error toggling follow status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update follow status"
      });
    } finally {
      setIsFollowingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading organizer profile...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!organizer) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Not Found</h2>
            <p className="text-muted-foreground">This organizer profile could not be found.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={organizer.avatar_url} />
                <AvatarFallback>{organizer.display_name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{organizer.display_name}</CardTitle>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                    <span>{organizer.avg_rating || "0.0"}</span>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>{organizer.followers_count} followers</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleFollowToggle}
                variant={isFollowing ? "outline" : "default"}
                disabled={isFollowingLoading}
                className="ml-auto"
              >
                {isFollowing ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Follow
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">About</h3>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {organizer.bio || "No bio information provided."}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-medium">{organizer.followers_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average Rating</span>
                <span className="font-medium flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                  {organizer.avg_rating || "0.0"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Events</span>
                <span className="font-medium">{organizer.event_count || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Display recent events */}
        {organizer.recent_events && Array.isArray(organizer.recent_events) && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Recent Events</h2>
            
            {organizer.recent_events.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">This organizer has no recent events.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizer.recent_events.map((event) => (
                  <Card key={event.event_id} className="overflow-hidden">
                    {event.cover_url && (
                      <div className="h-48 w-full">
                        <img 
                          src={event.cover_url} 
                          alt={event.title} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                      <CardDescription>
                        <span className="flex flex-col gap-2">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={14} />
                            <span>
                              {new Date(event.start_at).toLocaleString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </span>
                          {event.venue_name && (
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span>{event.venue_name}</span>
                            </span>
                          )}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-3">{event.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Link to={`/events/${event.event_id}`} className={cn(buttonVariants({ className: "w-full" }))}>
                        View Event
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View All Events Button */}
        <div className="flex justify-center mt-8">
          <Link
            to={`/organizers/${id}/events`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            View All Events
          </Link>
        </div>
      </div>
    </Layout>
  );
}