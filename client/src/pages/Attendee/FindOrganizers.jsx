import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Calendar, Star, Search, Users, Plus, Check } from 'lucide-react';
import apiClient from '../../helpers/apiCore.js';

export default function FindOrganizers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [organizers, setOrganizers] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const params = {
      search: searchQuery || undefined,
      sort: sortBy,
      page: 1,
      limit: 24,
    };
    const [orgRes, followRes] = await Promise.all([
      apiClient.get('/users/organizers', params),
      apiClient.get('/users/organizers/following'),
    ]);

    setOrganizers(orgRes.data || []);
    setFollowedOrganizers(followRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, sortBy]);

  const handleFollowToggle = async (id) => {
    const isFollowing = followedOrganizers.includes(id);
    if (isFollowing) {
      await apiClient.delete(`/users/organizers/follow/${id}`);
      setFollowedOrganizers(followedOrganizers.filter((fid) => fid !== id));
    } else {
      await apiClient.post(`/users/organizers/follow/${id}`);
      setFollowedOrganizers([...followedOrganizers, id]);
    }

    setOrganizers((prev) =>
      prev.map((o) =>
        o.organizer_id === id
          ? { ...o, followers_count: o.followers_count + (isFollowing ? -1 : 1) }
          : o
      )
    );
  };

  const myFollowedOrganizers = organizers.filter((org) =>
    followedOrganizers.includes(org.organizer_id)
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Find Organizers</h1>
          <p className="text-muted-foreground mt-1">
            Discover and follow event organizers that match your interests
          </p>
        </div>

        {/* Search & Sort */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search organizers by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="events">Most Events</SelectItem>
              <SelectItem value="upcoming">Upcoming Events</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="following">
              Following ({myFollowedOrganizers.length})
            </TabsTrigger>
          </TabsList>

          {/* Discover */}
          <TabsContent value="discover" className="mt-0">
            {loading ? (
              <p className="text-center">Loading…</p>
            ) : organizers.length === 0 ? (
              <div className="text-center py-16 border rounded-lg">
                <h3 className="text-lg font-medium">No organizers found</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {organizers.map((org) => (
                  <OrganizerCard
                    key={org.organizer_id}
                    organizer={org}
                    isFollowing={followedOrganizers.includes(org.organizer_id)}
                    onFollowToggle={handleFollowToggle}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Following */}
          <TabsContent value="following" className="mt-0">
            {myFollowedOrganizers.length === 0 ? (
              <div className="text-center py-16 border rounded-lg">
                <h3 className="text-lg font-medium">You're not following any organizers yet</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myFollowedOrganizers.map((org) => (
                  <OrganizerCard
                    key={org.organizer_id}
                    organizer={org}
                    isFollowing={true}
                    onFollowToggle={handleFollowToggle}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function OrganizerCard({ organizer, isFollowing, onFollowToggle }) {
  const rating = organizer.avg_rating ? Number(organizer.avg_rating) : 0;

  return (
    <Card className="overflow-hidden">
      {organizer.featured_event && (
        <div className="relative h-48">
          <img
            src={organizer.featured_event.cover_url}
            alt={organizer.featured_event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="text-sm mb-1">Featured Event:</div>
            <div className="font-medium">{organizer.featured_event.title}</div>
            <div className="flex items-center text-xs mt-1">
              <Calendar size={12} className="mr-1" />
              <span>
                {new Date(organizer.featured_event.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={organizer.avatar_url} />
          <AvatarFallback>{organizer.display_name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-xl">{organizer.display_name}</CardTitle>
          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span>
              {rating.toFixed(1)} · {organizer.followers_count.toLocaleString()} followers
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{organizer.bio}</p>

        <div className="flex items-center text-sm">
          <Users size={16} className="mr-1 text-gray-500" />
          <span>{organizer.event_count} events</span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" asChild>
          <Link to={`/organizers/${organizer.organizer_id}`}>View Profile</Link>
        </Button>

        <Button
          className="flex-1"
          onClick={() => onFollowToggle(organizer.organizer_id)}
          variant={isFollowing ? 'default' : 'secondary'}
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
      </CardFooter>
    </Card>
  );
}
