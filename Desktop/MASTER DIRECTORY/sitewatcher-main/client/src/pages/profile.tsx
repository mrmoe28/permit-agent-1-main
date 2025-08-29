import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  MapPin,
  Phone,
  Building2,
  Calendar
} from "lucide-react";

export default function Profile() {
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe", 
    email: "john@sitewatcher.com",
    phone: "+1 (555) 123-4567",
    company: "SiteWatcher Inc.",
    location: "San Francisco, CA",
    bio: "SEO analyst and web performance enthusiast. Helping businesses improve their online presence through data-driven insights.",
    timezone: "America/Los_Angeles"
  });
  
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = () => {
    // This would typically open a file picker
    toast({
      title: "Coming Soon",
      description: "Avatar upload functionality will be available soon.",
    });
  };

  return (
    <PageLayout 
      title="Profile" 
      description="Manage your account information and preferences"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" />
                <AvatarFallback className="text-lg">
                  {profileData.firstName[0]}{profileData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAvatarChange}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG or GIF (max 2MB)
                </p>
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={profileData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Work Information
            </CardTitle>
            <CardDescription>
              Your professional details and location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={profileData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timezone
              </Label>
              <Input
                id="timezone"
                value={profileData.timezone}
                onChange={(e) => handleInputChange("timezone", e.target.value)}
                placeholder="America/Los_Angeles"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>
              Your SiteWatcher account overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sites Monitored</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">12</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Analyses Run</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">89</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg SEO Score</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">Pro</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Plan Status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="px-8"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}