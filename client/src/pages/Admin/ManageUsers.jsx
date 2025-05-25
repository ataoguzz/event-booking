import React, { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiCore';
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
  const [users, setUsers] = useState([]);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [organizerCount, setOrganizerCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await apiClient.get('/admin/getAllAccounts');
        // axios automatically throws for HTTP errors by default, but if not:
        if (response.status !== 200) {
          throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
        }
        const data = response.data; // the parsed JSON body
        console.log('Accounts:', data);
        setUsers(data.users);

        setAttendeeCount(data.counts.attendeeCount);
        setOrganizerCount(data.counts.organizerCount);
        setAdminCount(data.counts.adminCount);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    fetchAccounts();
  }, []);
  
  const filteredUsers = users.filter(user => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'attendees') return user.role === 'attendee';
    if (selectedTab === 'organizers') return user.role === 'organizer';
    if (selectedTab === 'admins') return user.role === 'admin';
    return true;
  });
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
          
        </div>

        {/* Tab Navigation */}
        <Tabs value={selectedTab} 
          onValueChange={setSelectedTab} 
          className="mb-6" >
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

        

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 text-sm font-medium">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Creation Date</th>
                  </tr>
                </thead>
                <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.account_id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.full_name} />
                          <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground">{user.account_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm">{getRoleBadge(user.role)}</td>
                    <td className="px-4 py-3 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                    {/* Remove or replace lastLogin if you don't have it */}
                    {/* <td className="px-4 py-3 text-sm">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'}</td> */}
                    
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