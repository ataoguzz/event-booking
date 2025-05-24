import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/Layout.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { StarIcon, UserIcon, Edit2Icon, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import organizerService from '@/services/organizerService.js';

export default function OrganizerProfile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Get API base URL from the window location instead of hardcoding
  const apiBaseUrl = import.meta.env.VITE_API_URL || 
                     window.location.origin.replace(/:\d+$/, ':3001');

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setEmail(user.email || '');
      
      // If avatar_url is a relative URL, convert it to absolute URL
      if (user.avatar_url && user.avatar_url.startsWith('/uploads/')) {
        setAvatarUrl(`${apiBaseUrl}${user.avatar_url}`);
      } else {
        setAvatarUrl(user.avatar_url || 'https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png');
      }
    }
  }, [user, apiBaseUrl]);

  const handleOpenEditDialog = () => {
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    
    // Reset the avatar file when closing the dialog without saving
    if (avatarFile) {
      setAvatarFile(null);
      
      // Restore the original avatar URL from user data
      if (user.avatar_url && user.avatar_url.startsWith('/uploads/')) {
        setAvatarUrl(`${apiBaseUrl}${user.avatar_url}`);
      } else {
        setAvatarUrl(user.avatar_url || 'https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png');
      }
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // First upload the image if a new one is selected
      if (avatarFile) {
        setIsUploading(true);
        try {
          const uploadResult = await organizerService.uploadProfileImage(avatarFile);
          
          // Convert the relative URL to an absolute URL for display
          if (uploadResult.profile.avatar_url) {
            setAvatarUrl(`${apiBaseUrl}${uploadResult.profile.avatar_url}`);
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast({
            title: "Error",
            description: "Failed to upload profile image. Please try again.",
            variant: "destructive"
          });
          setIsLoading(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
          setAvatarFile(null);
        }
      }
      
      // Email validation
      if (email && !validateEmail(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Now update the profile info
      // Don't send avatar_url in the update as it's handled by the uploadProfileImage function
      await organizerService.updateProfile({
        display_name: displayName,
        bio: bio,
        email: email
      });
      
      // Refresh user data
      await refreshUser();
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Handle specific error for email already in use
      if (error.status === 409) {
        toast({
          title: "Email Already in Use",
          description: error.message || "This email is already registered to another account.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to validate email format
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      
      // Create a local preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <p>Loading profile information...</p>
        </div>
      </Layout>
    );
  }

  // Ensure avatar URL is absolute
  const displayAvatarUrl = user.avatar_url && user.avatar_url.startsWith('/uploads/')
    ? `${apiBaseUrl}${user.avatar_url}`
    : user.avatar_url || "https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png";

  return (
    <Layout>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Organizer Profile</h1>

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
              <div className="space-y-1">
                <CardTitle className="text-2xl">{user.display_name}</CardTitle>
                <CardDescription className="flex items-center">
                  <div className="flex items-center mr-4">
                    <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>{user.avg_rating || "0.0"}</span>
                  </div>
                  <span>{user.followers_count || 0} followers</span>
                </CardDescription>
                <CardDescription className="text-sm">{user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">About</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {user.bio || "No bio information provided."}
                </p>
              </div>
              
              <Button onClick={handleOpenEditDialog} className="mt-4">
                <Edit2Icon className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
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
                <span className="font-medium">{user.followers_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average Rating</span>
                <span className="font-medium flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                  {user.avg_rating || "0.0"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Created</span>
                <span className="font-medium">N/A</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="w-24 h-24 mb-4 border relative group">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>
                    <UserIcon className="h-12 w-12" />
                  </AvatarFallback>
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <label htmlFor="avatar-upload" className="cursor-pointer p-2 rounded-full bg-white text-black">
                      <Camera className="h-6 w-6" />
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleAvatarChange}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </Avatar>
                <p className="text-sm text-muted-foreground">
                  {isUploading ? "Uploading image..." : "Click to change profile image"}
                </p>
                {avatarFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {avatarFile.name}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input 
                  id="display-name" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  rows={5} 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself and your events..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseEditDialog} disabled={isLoading || isUploading}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={isLoading || isUploading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 