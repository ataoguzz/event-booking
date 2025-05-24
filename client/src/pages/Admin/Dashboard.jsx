import React, { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiCore';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUp, ArrowDown, Users, Calendar, DollarSign, Ticket, Clock, ShieldAlert } from 'lucide-react';
import { Progress } from '@/components/ui/progress.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('30days');
  const [summaryData, setSummaryData] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [eventCategoryData, setEventCategoryData] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient.get(`/admin/dashboard?timeRange=${timeRange}`)
      .then(res => {
        // Adjust these assignments based on your backend response structure
        setSummaryData(res.data.summaryData);
        setRevenueData(res.data.revenueData);
        setUserGrowthData(res.data.userGrowthData);
        setEventCategoryData(res.data.eventCategoryData);
        setTopEvents(res.data.topEvents);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load dashboard data');
        setLoading(false);
      });
  }, [timeRange]);

  const percentageChange = {
    revenue: ((summaryData.totalRevenue - summaryData.previousRevenue) / summaryData.previousRevenue * 100).toFixed(1),
    events: ((summaryData.totalEvents - summaryData.previousEvents) / summaryData.previousEvents * 100).toFixed(1),
    users: ((summaryData.totalUsers - summaryData.previousUsers) / summaryData.previousUsers * 100).toFixed(1),
    venues: ((summaryData.activeVenues - summaryData.previousVenues) / summaryData.previousVenues * 100).toFixed(1),
    tickets: ((summaryData.ticketsSold - summaryData.previousTicketsSold) / summaryData.previousTicketsSold * 100).toFixed(1),
    issues: ((summaryData.reportedIssues - summaryData.previousReportedIssues) / summaryData.previousReportedIssues * 100).toFixed(1),
  };

  

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Platform performance overview and key metrics</p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Clock size={16} className="mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-2xl font-bold">${summaryData.totalRevenue.toLocaleString()}</div>
                <div className={`ml-2 text-xs ${percentageChange.revenue > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentageChange.revenue > 0 ? <ArrowUp size={12} className="inline" /> : <ArrowDown size={12} className="inline" />}
                  {Math.abs(percentageChange.revenue)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-2xl font-bold">{summaryData.totalEvents}</div>
                <div className={`ml-2 text-xs ${percentageChange.events > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentageChange.events > 0 ? <ArrowUp size={12} className="inline" /> : <ArrowDown size={12} className="inline" />}
                  {Math.abs(percentageChange.events)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-2xl font-bold">{summaryData.totalUsers.toLocaleString()}</div>
                <div className={`ml-2 text-xs ${percentageChange.users > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentageChange.users > 0 ? <ArrowUp size={12} className="inline" /> : <ArrowDown size={12} className="inline" />}
                  {Math.abs(percentageChange.users)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Venues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-2xl font-bold">{summaryData.activeVenues}</div>
                <div className={`ml-2 text-xs ${percentageChange.venues > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentageChange.venues > 0 ? <ArrowUp size={12} className="inline" /> : <ArrowDown size={12} className="inline" />}
                  {Math.abs(percentageChange.venues)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-2xl font-bold">{summaryData.ticketsSold.toLocaleString()}</div>
                <div className={`ml-2 text-xs ${percentageChange.tickets > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentageChange.tickets > 0 ? <ArrowUp size={12} className="inline" /> : <ArrowDown size={12} className="inline" />}
                  {Math.abs(percentageChange.tickets)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reported Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-2xl font-bold">{summaryData.reportedIssues}</div>
                <div className={`ml-2 text-xs ${percentageChange.issues < 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentageChange.issues < 0 ? <ArrowDown size={12} className="inline" /> : <ArrowUp size={12} className="inline" />}
                  {Math.abs(percentageChange.issues)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Charts and Data */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0 space-y-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Revenue</CardTitle>
                <CardDescription>Total revenue across all events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          
          </TabsContent>
          
          <TabsContent value="events" className="mt-0 space-y-6">
            {/* Event Categories Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Categories</CardTitle>
                  <CardDescription>Distribution of events by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {eventCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Top Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Events</CardTitle>
                  <CardDescription>Highest revenue-generating events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topEvents.map((event) => (
                      <div key={event.id} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{event.name}</h4>
                            <div className="text-sm text-muted-foreground">
                              {event.organizer}
                            </div>
                          </div>
                          <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                            {event.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground gap-4">
                          <span><DollarSign size={14} className="inline mr-1" /> ${event.revenue.toLocaleString()}</span>
                          <span><Ticket size={14} className="inline mr-1" /> {event.tickets} tickets</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-0 space-y-6">
            {/* User Growth */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Total registered users over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#00C49F" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          
        </Tabs>
      </div>
    </Layout>
  );
} 