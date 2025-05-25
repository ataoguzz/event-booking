import React, { useState } from 'react';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ArrowUp, ArrowDown, Users, Calendar, DollarSign, Ticket, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress.jsx';

// This is a mock import - you'd need to setup recharts or another charting library
// For real implementation, install recharts: npm install recharts

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30days');
  
  // Mock data - would come from API in real app
  const summaryData = {
    totalRevenue: 42650,
    previousRevenue: 38900,
    totalTickets: 1280,
    previousTickets: 1100,
    totalEvents: 12,
    previousEvents: 10,
    totalAttendees: 1245,
    previousAttendees: 1050,
    avgRating: 4.8,
    previousRating: 4.6
  };

  // Calculate percentage changes
  const percentageChange = {
    revenue: ((summaryData.totalRevenue - summaryData.previousRevenue) / summaryData.previousRevenue * 100).toFixed(1),
    tickets: ((summaryData.totalTickets - summaryData.previousTickets) / summaryData.previousTickets * 100).toFixed(1),
    events: ((summaryData.totalEvents - summaryData.previousEvents) / summaryData.previousEvents * 100).toFixed(1),
    attendees: ((summaryData.totalAttendees - summaryData.previousAttendees) / summaryData.previousAttendees * 100).toFixed(1),
    rating: ((summaryData.avgRating - summaryData.previousRating) / summaryData.previousRating * 100).toFixed(1)
  };

  // Monthly revenue data
  const revenueData = [
    { month: 'Jan', revenue: 3100 },
    { month: 'Feb', revenue: 4200 },
    { month: 'Mar', revenue: 3800 },
    { month: 'Apr', revenue: 5100 },
    { month: 'May', revenue: 6200 },
    { month: 'Jun', revenue: 5800 },
    { month: 'Jul', revenue: 6500 },
    { month: 'Aug', revenue: 7900 },
  ];

  // Ticket sales by type
  const ticketTypeData = [
    { name: 'Standard', value: 600 },
    { name: 'Premium', value: 300 },
    { name: 'VIP', value: 180 },
    { name: 'Early Bird', value: 200 },
  ];

  // Events by category
  const eventCategoryData = [
    { name: 'Concerts', value: 5 },
    { name: 'Conferences', value: 3 },
    { name: 'Workshops', value: 2 },
    { name: 'Exhibitions', value: 1 },
    { name: 'Other', value: 1 },
  ];

  // Top events by tickets sold
  const topEvents = [
    { name: 'Summer Music Festival', tickets: 450, revenue: 13500, capacity: 500, percentageSold: 90 },
    { name: 'Tech Conference 2023', tickets: 320, revenue: 9600, capacity: 400, percentageSold: 80 },
    { name: 'Art Exhibition', tickets: 215, revenue: 6450, capacity: 300, percentageSold: 72 },
    { name: 'Jazz Night', tickets: 180, revenue: 5400, capacity: 200, percentageSold: 90 },
    { name: 'Workshop Series', tickets: 115, revenue: 3450, capacity: 150, percentageSold: 77 },
  ];

  // Attendance data over time
  const attendanceData = [
    { date: '2023-01', attendance: 85 },
    { date: '2023-02', attendance: 87 },
    { date: '2023-03', attendance: 82 },
    { date: '2023-04', attendance: 91 },
    { date: '2023-05', attendance: 88 },
    { date: '2023-06', attendance: 93 },
    { date: '2023-07', attendance: 90 },
    { date: '2023-08', attendance: 95 },
  ];

  // Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Track your event performance metrics</p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Clock size={16} className="mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-2xl font-bold">{summaryData.totalTickets.toLocaleString()}</div>
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
              <CardTitle className="text-sm font-medium">Events Hosted</CardTitle>
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
              <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-2xl font-bold">{summaryData.totalAttendees.toLocaleString()}</div>
                <div className={`ml-2 text-xs ${percentageChange.attendees > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentageChange.attendees > 0 ? <ArrowUp size={12} className="inline" /> : <ArrowDown size={12} className="inline" />}
                  {Math.abs(percentageChange.attendees)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-2xl font-bold">{summaryData.avgRating.toFixed(1)}</div>
                <div className={`ml-2 text-xs ${percentageChange.rating > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentageChange.rating > 0 ? <ArrowUp size={12} className="inline" /> : <ArrowDown size={12} className="inline" />}
                  {Math.abs(percentageChange.rating)}%
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
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0 space-y-6">
            {/* Monthly Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue generated each month</CardDescription>
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
            
            {/* Top Events */}
            <Card>
              <CardHeader>
                <CardTitle>Top Events</CardTitle>
                <CardDescription>Your highest performing events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {topEvents.map((event, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{event.name}</h4>
                          <div className="flex items-center text-sm text-muted-foreground gap-4">
                            <span><Ticket size={14} className="inline mr-1" /> {event.tickets} tickets</span>
                            <span><DollarSign size={14} className="inline mr-1" /> ${event.revenue}</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium">{event.percentageSold}%</span>
                      </div>
                      <Progress value={event.percentageSold} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sales" className="mt-0 space-y-6">
            {/* Sales by Ticket Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Ticket Type</CardTitle>
                  <CardDescription>Distribution of ticket sales by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ticketTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {ticketTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Tickets Sold']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Detailed Sales Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Details</CardTitle>
                  <CardDescription>Breakdown of sales by ticket type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ticketTypeData.map((type, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span>{type.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">{type.value} tickets</span>
                          <span className="font-medium">${(type.name === 'VIP' ? 100 : type.name === 'Premium' ? 60 : 30) * type.value}</span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between font-medium">
                        <span>Total</span>
                        <span>${ticketTypeData.reduce((sum, type) => {
                          const price = type.name === 'VIP' ? 100 : type.name === 'Premium' ? 60 : 30;
                          return sum + (price * type.value);
                        }, 0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="mt-0 space-y-6">
            {/* Events by Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Events by Category</CardTitle>
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
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {eventCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Events']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Detailed Events Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                  <CardDescription>Breakdown of events and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {eventCategoryData.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span>{category.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">{category.value} events</span>
                          <span className="font-medium">{category.value * (Math.floor(Math.random() * 150) + 100)} attendees</span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between font-medium">
                        <span>Total</span>
                        <span>{eventCategoryData.reduce((sum, category) => sum + category.value, 0)} events</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="attendance" className="mt-0 space-y-6">
            {/* Attendance Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Rate</CardTitle>
                <CardDescription>Percentage of ticket holders who attended events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[75, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                      <Line type="monotone" dataKey="attendance" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Attendance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(attendanceData.reduce((sum, item) => sum + item.attendance, 0) / attendanceData.length)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">of ticket holders attended</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Highest Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.max(...attendanceData.map(item => item.attendance))}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">for August 2023 events</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Lowest Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.min(...attendanceData.map(item => item.attendance))}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">for March 2023 events</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 