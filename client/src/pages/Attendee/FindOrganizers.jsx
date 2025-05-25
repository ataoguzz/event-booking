import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Calendar, Star, Search, MapPin, Users, Plus, Check } from 'lucide-react';

export default function FindOrganizers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [followedOrganizers, setFollowedOrganizers] = useState([2, 4]); // Mock pre-followed organizers

  // Mock data - would come from API in real app
  const organizers = [
    {
      id: 1,
      name: 'Eventify Productions',
      logo: 'https://i.pravatar.cc/150?img=1',
      description: 'Creating unforgettable music and cultural experiences in New York City',
      rating: 4.8,
      followers: 2845,
      eventCount: 35,
      location: 'New York, NY',
      primaryCategory: 'Concert',
      categories: ['Concert', 'Festival', 'Cultural'],
      upcomingEvents: 3,
      featuredEvent: {
        title: 'Summer Music Festival',
        date: '2023-07-15',
        image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80'
      }
    },
    {
      id: 2,
      name: 'TechTalks',
      logo: 'https://i.pravatar.cc/150?img=2',
      description: 'Leading technology conferences and workshops for professionals and enthusiasts',
      rating: 4.7,
      followers: 3210,
      eventCount: 28,
      location: 'San Francisco, CA',
      primaryCategory: 'Conference',
      categories: ['Conference', 'Workshop', 'Networking'],
      upcomingEvents: 2,
      featuredEvent: {
        title: 'Tech Conference 2023',
        date: '2023-09-10',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
      }
    },
    {
      id: 3,
      name: 'Laugh Factory',
      logo: 'https://i.pravatar.cc/150?img=3',
      description: 'Bringing the funniest comedians to stages across the country',
      rating: 4.9,
      followers: 1875,
      eventCount: 42,
      location: 'Los Angeles, CA',
      primaryCategory: 'Stand-up Comedy',
      categories: ['Stand-up Comedy', 'Improv', 'Entertainment'],
      upcomingEvents: 5,
      featuredEvent: {
        title: 'Comedy Night',
        date: '2023-06-25',
        image: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80'
      }
    },
    {
      id: 4,
      name: 'ArtSpace Gallery',
      logo: 'https://i.pravatar.cc/150?img=4',
      description: 'Showcasing contemporary art from emerging and established artists',
      rating: 4.6,
      followers: 1540,
      eventCount: 22,
      location: 'Chicago, IL',
      primaryCategory: 'Exhibition',
      categories: ['Exhibition', 'Arts & Culture', 'Gallery'],
      upcomingEvents: 1,
      featuredEvent: {
        title: 'Modern Art Exhibition',
        date: '2023-08-05',
        image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
      }
    },
    {
      id: 5,
      name: 'Jazz Society',
      logo: 'https://i.pravatar.cc/150?img=5',
      description: 'Preserving and promoting jazz music through live performances and education',
      rating: 4.8,
      followers: 1925,
      eventCount: 30,
      location: 'Boston, MA',
      primaryCategory: 'Concert',
      categories: ['Concert', 'Jazz', 'Music'],
      upcomingEvents: 2,
      featuredEvent: {
        title: 'Jazz in the Garden',
        date: '2023-06-30',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80'
      }
    },
    {
      id: 6,
      name: 'Culinary Events',
      logo: 'https://i.pravatar.cc/150?img=6',
      description: 'Creating memorable food and beverage experiences for all tastes',
      rating: 4.7,
      followers: 2100,
      eventCount: 25,
      location: 'Portland, OR',
      primaryCategory: 'Festival',
      categories: ['Festival', 'Food & Drink', 'Culinary'],
      upcomingEvents: 1,
      featuredEvent: {
        title: 'Food & Wine Festival',
        date: '2023-07-22',
        image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1262&q=80'
      }
    }
  ];

  // Get unique categories and locations for filters
  const categories = Array.from(new Set(organizers.flatMap(org => org.categories)));
  const locations = Array.from(new Set(organizers.map(org => org.location)));

  // Filter organizers based on criteria
  const filteredOrganizers = organizers.filter(organizer => {
    const matchesSearch = organizer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        organizer.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || organizer.categories.includes(categoryFilter);
    const matchesLocation = locationFilter === 'all' || organizer.location === locationFilter;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Sort organizers based on selected criteria
  const sortedOrganizers = [...filteredOrganizers].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.followers - a.followers;
    } else if (sortBy === 'rating') {
      return b.rating - a.rating;
    } else if (sortBy === 'events') {
      return b.eventCount - a.eventCount;
    } else if (sortBy === 'upcoming') {
      return b.upcomingEvents - a.upcomingEvents;
    }
    return 0;
  });
  
  // Get followed organizers
  const myFollowedOrganizers = organizers.filter(org => followedOrganizers.includes(org.id));

  const handleFollowToggle = (organizerId) => {
    if (followedOrganizers.includes(organizerId)) {
      setFollowedOrganizers(followedOrganizers.filter(id => id !== organizerId));
    } else {
      setFollowedOrganizers([...followedOrganizers, organizerId]);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Find Organizers</h1>
          <p className="text-muted-foreground mt-1">Discover and follow event organizers that match your interests</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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

        {/* Main Content */}
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="following">Following ({myFollowedOrganizers.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="discover" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
              {/* Filters Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Category</h4>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Location Filter */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Location</h4>
                      <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger>
                          <MapPin size={16} className="mr-2" />
                          <SelectValue placeholder="Filter by location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All locations</SelectItem>
                          {locations.map(location => (
                            <SelectItem key={location} value={location}>{location}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Organizers Grid */}
              <div>
                {sortedOrganizers.length === 0 ? (
                  <div className="text-center py-16 border rounded-lg">
                    <h3 className="text-lg font-medium">No organizers found</h3>
                    <p className="text-muted-foreground mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedOrganizers.map((organizer) => (
                      <OrganizerCard 
                        key={organizer.id} 
                        organizer={organizer} 
                        isFollowing={followedOrganizers.includes(organizer.id)}
                        onFollowToggle={handleFollowToggle}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="following" className="mt-0">
            {myFollowedOrganizers.length === 0 ? (
              <div className="text-center py-16 border rounded-lg">
                <h3 className="text-lg font-medium">You're not following any organizers yet</h3>
                <p className="text-muted-foreground mt-1">Discover and follow organizers to see their events in your feed</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myFollowedOrganizers.map((organizer) => (
                  <OrganizerCard 
                    key={organizer.id} 
                    organizer={organizer} 
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
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <img 
          src={organizer.featuredEvent.image} 
          alt={organizer.featuredEvent.title}
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="text-sm mb-1">Featured Event:</div>
          <div className="font-medium">{organizer.featuredEvent.title}</div>
          <div className="flex items-center text-xs mt-1">
            <Calendar size={12} className="mr-1" />
            <span>{new Date(organizer.featuredEvent.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>
      
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={organizer.logo} />
          <AvatarFallback>{organizer.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-xl">{organizer.name}</CardTitle>
          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 inline mr-1" />
            <span>{organizer.rating} · {organizer.followers.toLocaleString()} followers</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{organizer.description}</p>
        
        <div className="flex flex-wrap gap-2">
          {organizer.categories.map((category, index) => (
            <Badge key={index} variant="secondary">{category}</Badge>
          ))}
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center">
            <MapPin size={16} className="mr-1 text-gray-500" />
            <span>{organizer.location}</span>
          </div>
          
          <div className="flex items-center">
            <Users size={16} className="mr-1 text-gray-500" />
            <span>{organizer.eventCount} events</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" asChild>
          <Link to={`/organizers/${organizer.id}`}>View Profile</Link>
        </Button>
        
        <Button 
          className={`flex-1 ${isFollowing ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-gray-800'}`}
          onClick={() => onFollowToggle(organizer.id)}
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