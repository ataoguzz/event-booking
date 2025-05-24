import React, { useState } from 'react';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Search, Edit, Trash2, Eye, Ban, ShieldAlert, User, Mail, Calendar, LayoutDashboard } from 'lucide-react';

export default function ManageUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState('');
  
  // Mock data
  const users = [
    {
      id: 'U1001',
      name: 'John Smith',
      email: 'john.smith@example.com',
      role: 'attendee',
      status: 'active',
      verified: true,
      registrationDate: '2022-03-15',
      lastLogin: '2023-06-20',
      ticketsPurchased: 12,
      avatar: '/avatars/avatar-1.png'
    },
    {
      id: 'U1042',
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      role: 'organizer',
      status: 'active',
      verified: true,
      registrationDate: '2022-01-08',
      lastLogin: '2023-06-18',
      eventsCreated: 8,
      avatar: '/avatars/avatar-2.png'
    },
    {
      id: 'U1078',
      name: 'Michael Chen',
      email: 'michael.c@example.com',
      role: 'attendee',
      status: 'active',
      verified: true,
      registrationDate: '2022-05-22',
      lastLogin: '2023-06-15',
      ticketsPurchased: 5,
      avatar: '/avatars/avatar-3.png'
    },
    {
      id: 'U1103',
      name: 'Amanda Wilson',
      email: 'amanda.w@example.com',
      role: 'organizer',
      status: 'active',
      verified: true,
      registrationDate: '2021-11-30',
      lastLogin: '2023-06-19',
      eventsCreated: 15,
      avatar: '/avatars/avatar-4.png'
    },
    {
      id: 'U1150',
      name: 'David Martinez',
      email: 'david.m@example.com',
      role: 'admin',
      status: 'active',
      verified: true,
      registrationDate: '2021-08-12',
      lastLogin: '2023-06-20',
      avatar: '/avatars/avatar-5.png'
    },
    {
      id: 'U1189',
      name: 'Jessica Taylor',
      email: 'jessica.t@example.com',
      role: 'attendee',
      status: 'suspended',
      verified: true,
      registrationDate: '2022-07-18',
      lastLogin: '2023-05-25',
      ticketsPurchased: 3,
      suspensionReason: 'Multiple reports from event organizers',
      avatar: '/avatars/avatar-6.png'
    },
    {
      id: 'U1210',
      name: 'Robert Brown',
      email: 'robert.b@example.com',
      role: 'organizer',
      status: 'pending',
      verified: false,
      registrationDate: '2023-06-05',
      lastLogin: '2023-06-05',
      eventsCreated: 0,
      avatar: '/avatars/avatar-7.png'
    },
    {
      id: 'U1245',
      name: 'Emily Clark',
      email: 'emily.c@example.com',
      role: 'attendee',
      status: 'active',
      verified: true,
      registrationDate: '2022-09-10',
      lastLogin: '2023-06-17',
      ticketsPurchased: 8,
      avatar: '/avatars/avatar-8.png'
    }
  ];

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || roleFilter === '' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || statusFilter === '' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const attendeeCount = users.filter(user => user.role === 'attendee').length;
  const organizerCount = users.filter(user => user.role === 'organizer').length;
  const adminCount = users.filter(user => user.role === 'admin').length;
  
  const handleDeleteUser = (userId) => {
    // API call 
    console.log(`Delete user ${userId}`);
    setShowDeleteDialog(false);
  };
  
  const handleToggleUserStatus = (userId, currentStatus) => {
    // API call
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    console.log(`Change user ${userId} status to ${newStatus}`);
    setShowBanDialog(false);
  };
  
  const handleChangeRole = (userId, newRole) => {
    // API call
    console.log(`Change user ${userId} role to ${newRole}`);
    setShowRoleDialog(false);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'organizer':
        return <Badge variant="default">Organizer</Badge>;
      case 'attendee':
        return <Badge variant="secondary">Attendee</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-500 border-green-500">Active</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="text-red-500 border-red-500">Suspended</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Users</h1>
            <p className="text-muted-foreground mt-1">View, edit and manage platform users</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline">
              Export Users
            </Button>
            <Button variant="default">
              Add New User
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All Users
              <Badge variant="outline" className="ml-2">{users.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="attendees">
              Attendees
              <Badge variant="outline" className="ml-2">{attendeeCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="organizers">
              Organizers
              <Badge variant="outline" className="ml-2">{organizerCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="admins">
              Admins
              <Badge variant="outline" className="ml-2">{adminCount}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search by name, email or ID..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="md:col-span-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="organizer">Organizer</SelectItem>
                <SelectItem value="attendee">Attendee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-1">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Showing {filteredUsers.length} of {users.length} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 text-sm font-medium">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Registration Date</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Last Login</th>
                    <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3 text-sm">{getRoleBadge(user.role)}</td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(user.status)}</td>
                      <td className="px-4 py-3 text-sm">{new Date(user.registrationDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{new Date(user.lastLogin).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-right space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            // View user details
                            setSelectedUser(user);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setShowRoleDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-8 w-8 p-0 ${user.status === 'suspended' ? 'text-green-500' : 'text-yellow-500'}`}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBanDialog(true);
                          }}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedUser && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete the account for {selectedUser.name} ({selectedUser.email})? This action cannot be undone and will remove all associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteUser(selectedUser.id)}>
                Delete Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Ban/Unban Confirmation Dialog */}
      {showBanDialog && selectedUser && (
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser.status === 'active' ? 'Suspend User Account' : 'Reactivate User Account'}
              </DialogTitle>
              <DialogDescription>
                {selectedUser.status === 'active' 
                  ? `Are you sure you want to suspend ${selectedUser.name}'s account? They will not be able to log in or use the platform until the account is reactivated.`
                  : `Are you sure you want to reactivate ${selectedUser.name}'s account? This will restore their access to the platform.`
                }
              </DialogDescription>
            </DialogHeader>
            {selectedUser.status === 'active' && (
              <div className="py-4">
                <Label htmlFor="reason">Suspension Reason</Label>
                <Input 
                  id="reason" 
                  placeholder="Enter reason for suspension" 
                  className="mt-2"
                />
                <div className="flex items-center space-x-2 mt-4">
                  <Switch id="notify" />
                  <Label htmlFor="notify">Notify user via email</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBanDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant={selectedUser.status === 'active' ? "destructive" : "default"}
                onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.status)}
              >
                {selectedUser.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Role Dialog */}
      {showRoleDialog && selectedUser && (
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Change the role for {selectedUser.name}. This will affect the user's permissions and access within the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Current Role</Label>
                <div className="flex items-center px-3 py-2 rounded-md border">
                  {selectedUser.role === 'admin' && <ShieldAlert className="h-5 w-5 mr-2 text-red-500" />}
                  {selectedUser.role === 'organizer' && <Calendar className="h-5 w-5 mr-2 text-blue-500" />}
                  {selectedUser.role === 'attendee' && <User className="h-5 w-5 mr-2 text-gray-500" />}
                  <span className="capitalize">{selectedUser.role}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-role">New Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger id="new-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin" className="flex items-center">
                      <div className="flex items-center">
                        <ShieldAlert className="h-4 w-4 mr-2 text-red-500" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="organizer">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        Organizer
                      </div>
                    </SelectItem>
                    <SelectItem value="attendee">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        Attendee
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="notify-role" />
                <Label htmlFor="notify-role">Notify user via email</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="default"
                onClick={() => handleChangeRole(selectedUser.id, newRole)}
                disabled={newRole === selectedUser.role}
              >
                Change Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
} 