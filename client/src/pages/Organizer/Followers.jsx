import { useState } from 'react';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Search, Mail, ChevronDown, X } from 'lucide-react';

export default function Followers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFollower, setExpandedFollower] = useState(null);
  
  // Mock data - would come from API in real app
  const followers = [
    {
      id: 1,
      name: 'Emma Thompson',
      email: 'emma.thompson@example.com',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      joinedDate: '2023-03-15',
      ticketsBought: 5,
      upcomingEvents: 2,
      attendedEvents: [
        { id: 101, title: 'Summer Music Festival', date: '2023-06-15' },
        { id: 102, title: 'Tech Conference', date: '2023-04-10' },
        { id: 103, title: 'Jazz Night', date: '2023-02-25' }
      ]
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      joinedDate: '2023-02-08',
      ticketsBought: 3,
      upcomingEvents: 1,
      attendedEvents: [
        { id: 101, title: 'Summer Music Festival', date: '2023-06-15' },
        { id: 104, title: 'Dance Performance', date: '2023-03-18' }
      ]
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      joinedDate: '2023-01-20',
      ticketsBought: 8,
      upcomingEvents: 0,
      attendedEvents: [
        { id: 102, title: 'Tech Conference', date: '2023-04-10' },
        { id: 105, title: 'Art Exhibition', date: '2023-03-05' },
        { id: 106, title: 'Concert in the Park', date: '2023-02-12' }
      ]
    },
    {
      id: 4,
      name: 'David Williams',
      email: 'david.williams@example.com',
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      joinedDate: '2023-04-02',
      ticketsBought: 2,
      upcomingEvents: 1,
      attendedEvents: [
        { id: 107, title: 'Film Festival', date: '2023-05-20' }
      ]
    },
    {
      id: 5,
      name: 'Jessica Martinez',
      email: 'jessica.martinez@example.com',
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
      joinedDate: '2023-03-28',
      ticketsBought: 4,
      upcomingEvents: 2,
      attendedEvents: [
        { id: 108, title: 'Book Fair', date: '2023-04-25' },
        { id: 109, title: 'Food Festival', date: '2023-03-15' }
      ]
    }
  ];

  const recentFollowers = [...followers].sort((a, b) => 
    new Date(b.joinedDate) - new Date(a.joinedDate)
  ).slice(0, 3);

  const mostActive = [...followers].sort((a, b) => 
    b.ticketsBought - a.ticketsBought
  ).slice(0, 3);

  // Filter followers based on search
  const filteredFollowers = followers.filter(follower => 
    follower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    follower.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpandFollower = (followerId) => {
    if (expandedFollower === followerId) {
      setExpandedFollower(null);
    } else {
      setExpandedFollower(followerId);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Followers</h1>
          <p className="text-muted-foreground mt-1">View and manage people following your events</p>
        </div>

        {/* Follower Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-lg font-medium">Total Followers</h3>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{followers.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-lg font-medium">Tickets Purchased</h3>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {followers.reduce((sum, follower) => sum + follower.ticketsBought, 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-lg font-medium">Upcoming Attendees</h3>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {followers.reduce((sum, follower) => sum + follower.upcomingEvents, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search followers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Followers ({filteredFollowers.length})</TabsTrigger>
            <TabsTrigger value="recent">Recent Followers ({recentFollowers.length})</TabsTrigger>
            <TabsTrigger value="active">Most Active ({mostActive.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <FollowersList 
              followers={filteredFollowers} 
              expandedFollower={expandedFollower} 
              toggleExpandFollower={toggleExpandFollower}
            />
          </TabsContent>
          
          <TabsContent value="recent" className="mt-0">
            <FollowersList 
              followers={recentFollowers} 
              expandedFollower={expandedFollower} 
              toggleExpandFollower={toggleExpandFollower}
            />
          </TabsContent>
          
          <TabsContent value="active" className="mt-0">
            <FollowersList 
              followers={mostActive} 
              expandedFollower={expandedFollower} 
              toggleExpandFollower={toggleExpandFollower}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function FollowersList({ followers, expandedFollower, toggleExpandFollower }) {
  if (followers.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg">
        <h3 className="text-lg font-medium">No followers found</h3>
        <p className="text-muted-foreground mt-1">Try adjusting your search</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {followers.map((follower) => (
        <Card key={follower.id} className="overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={follower.avatar} />
                  <AvatarFallback>{follower.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-medium">{follower.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>{follower.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {follower.ticketsBought} tickets purchased
                  </Badge>
                  {follower.upcomingEvents > 0 && (
                    <Badge className="bg-green-500">
                      {follower.upcomingEvents} upcoming
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Mail size={16} className="mr-2" />
                    Message
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleExpandFollower(follower.id)}
                  >
                    {expandedFollower === follower.id ? (
                      <X size={16} className="mr-2" />
                    ) : (
                      <ChevronDown size={16} className="mr-2" />
                    )}
                    {expandedFollower === follower.id ? 'Less' : 'More'}
                  </Button>
                </div>
              </div>
            </div>
            
            {expandedFollower === follower.id && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-2">Events Attended</h4>
                {follower.attendedEvents.length > 0 ? (
                  <ul className="space-y-2">
                    {follower.attendedEvents.map(event => (
                      <li key={event.id} className="flex items-center justify-between">
                        <span>{event.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No attended events yet.</p>
                )}
                
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Follower since</h4>
                  <p>
                    {new Date(follower.joinedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
} 