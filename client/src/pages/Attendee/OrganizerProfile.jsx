import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Button } from '@/components/ui/button.jsx';
import { StarIcon, UserIcon, Check, Plus, CalendarDays, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import organizerService from '@/services/organizerService.js';
import apiClient from '@/helpers/apiCore.js';
import { getAvatarUrl } from '@/helpers/imageUtils.js';

export default function OrganizerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [organizer, setOrganizer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

  useEffect(() => {
    // Load public organizer data and followed organizers list
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch both organizer profile and followed organizers list
        const [organizerData, followedData] = await Promise.all([
          organizerService.getPublicProfile(id),
          apiClient.get('/users/organizers/following')
        ]);
        
        if (organizerData) {
          console.log("Organizer data received:", organizerData);
          console.log("is_following value:", organizerData.is_following, "type:", typeof organizerData.is_following);
          console.log("Followed organizers list:", followedData.data);
          
          setOrganizer(organizerData);
          
          // Check if this organizer is in the followed list
          const organizerIdNum = parseInt(id);
          const organizerIdStr = id.toString();
          const isInFollowedList = followedData.data.includes(organizerIdNum) || followedData.data.includes(organizerIdStr);
          
          console.log("=== FOLLOW STATUS DEBUG ===");
          console.log("Organizer ID from URL:", id, "type:", typeof id);
          console.log("Organizer ID as number:", organizerIdNum);
          console.log("Organizer ID as string:", organizerIdStr);
          console.log("Followed organizers list:", followedData.data);
          console.log("List includes number check:", followedData.data.includes(organizerIdNum));
          console.log("List includes string check:", followedData.data.includes(organizerIdStr));
          console.log("Final isInFollowedList:", isInFollowedList);
          console.log("API is_following value:", organizerData.is_following);
          console.log("=== END DEBUG ===");
          
          // Use the followed list as the source of truth
          setIsFollowing(isInFollowedList);
        } else {
          console.error("No data received from organizer profile API");
          toast({
            title: "Error",
            description: "No data received from server. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Failed to load organizer profile:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load organizer profile. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      loadData();
    }
  }, [id, toast]);

  // Debug useEffect to monitor isFollowing changes
  useEffect(() => {
    console.log("isFollowing state changed to:", isFollowing, "type:", typeof isFollowing);
  }, [isFollowing]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow organizers.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsFollowingLoading(true);
      
      // Use the same API calls as FindOrganizers
      if (isFollowing) {
        await apiClient.delete(`/users/organizers/follow/${organizer.account_id}`);
      } else {
        await apiClient.post(`/users/organizers/follow/${organizer.account_id}`);
      }
      
      // Update the local state
      setIsFollowing(!isFollowing);
      setOrganizer(prev => ({
        ...prev,
        followers_count: prev.followers_count + (isFollowing ? -1 : 1)
      }));
      
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: `You are ${isFollowing ? 'no longer following' : 'now following'} ${organizer.display_name}`,
      });
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      toast({
        title: "Error",
        description: `Failed to ${isFollowing ? 'unfollow' : 'follow'} organizer. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsFollowingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <p className="text-center">Loading organizer profile...</p>
        </div>
      </Layout>
    );
  }

  if (!organizer) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <Card className="text-center p-6">
            <CardTitle className="mb-4">Organizer Not Found</CardTitle>
            <CardDescription>
              The organizer profile you're looking for doesn't exist or has been removed.
            </CardDescription>
            <Button className="mt-4" asChild>
              <Link to="/find-organizers">Browse Organizers</Link>
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  // Ensure avatar URL is absolute
  const displayAvatarUrl = getAvatarUrl(organizer.avatar_url);

  return (
    <Layout>
      <div className="container mx-auto py-10 px-4">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/find-organizers">← Back to Organizers</Link>
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">{organizer.display_name}</h1>
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="w-24 h-24 border">
                <AvatarImage src={displayAvatarUrl} />
                <AvatarFallback>
                  <UserIcon className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <CardTitle className="text-2xl">{organizer.display_name}</CardTitle>
                <CardDescription className="flex items-center">
                  <div className="flex items-center mr-4">
                    <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>{organizer.avg_rating || "0.0"}</span>
                  </div>
                  <span>{organizer.followers_count || 0} followers</span>
                </CardDescription>
              </div>
              <Button 
                className="whitespace-nowrap"
                onClick={handleFollowToggle}
                disabled={isFollowingLoading}
                variant={isFollowing ? "default" : "secondary"}
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
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {organizer.bio || "No bio information provided."}
                </p>
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
                        <div className="flex items-center gap-1">
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
                        </div>
                        {event.venue_name && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin size={14} />
                            <span>{event.venue_name}</span>
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-3">{event.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/event/${event.event_id}`}>View Event</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
} 