import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Key, 
  Eye,
  Download,
  Trash2,
  Lock,
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Monitor
} from "lucide-react";

export default function Privacy() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: false,
    dataCollection: true,
    analyticsTracking: true,
    marketingOptIn: false,
    thirdPartyIntegrations: true,
    sessionLogging: true
  });

  // Mock security logs
  const securityLogs = [
    { id: 1, action: "Login", device: "Chrome on MacOS", location: "San Francisco, CA", time: "2025-08-17 06:23:15", status: "success" },
    { id: 2, action: "Password Change", device: "Chrome on MacOS", location: "San Francisco, CA", time: "2025-08-15 14:30:22", status: "success" },
    { id: 3, action: "Failed Login", device: "Firefox on Windows", location: "Unknown", time: "2025-08-14 09:15:33", status: "failed" },
    { id: 4, action: "Login", device: "Safari on iPhone", location: "San Francisco, CA", time: "2025-08-13 18:45:12", status: "success" },
  ];

  const { toast } = useToast();

  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed",
      });
      
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacySettingChange = (setting: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: value }));
    toast({
      title: "Privacy Settings Updated",
      description: `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const enable2FA = () => {
    toast({
      title: "Coming Soon",
      description: "Two-factor authentication setup will be available soon",
    });
  };

  const exportData = () => {
    toast({
      title: "Data Export Started",
      description: "Your data export will be emailed to you within 24 hours",
    });
  };

  const deleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account",
      variant: "destructive",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    return status === "success" 
      ? <Badge className="bg-green-600 hover:bg-green-700">Success</Badge>
      : <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <PageLayout 
      title="Privacy & Security" 
      description="Manage your account security settings and privacy preferences"
    >
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account Security
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Good
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    2FA Status
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    Disabled
                  </p>
                </div>
                <Smartphone className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Login
                  </p>
                  <p className="text-sm font-bold">
                    Today, 6:23 AM
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Password Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password Security
            </CardTitle>
            <CardDescription>
              Change your password and manage login security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  />
                </div>

                <Button 
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Add an extra layer of security to your account
                  </p>
                  <Badge variant="outline" className="mb-3">
                    Not Enabled
                  </Badge>
                  <Button variant="outline" size="sm" onClick={enable2FA} className="w-full">
                    Enable 2FA
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Password Strength</h4>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                  <p className="text-sm text-green-600">Strong</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
            <CardDescription>
              Control how your data is used and shared
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Profile Visibility</p>
                  <p className="text-sm text-gray-500">Make your profile visible to other users</p>
                </div>
                <Switch 
                  checked={privacySettings.profileVisibility}
                  onCheckedChange={(value) => handlePrivacySettingChange("profileVisibility", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Collection</p>
                  <p className="text-sm text-gray-500">Allow collection of usage analytics</p>
                </div>
                <Switch 
                  checked={privacySettings.dataCollection}
                  onCheckedChange={(value) => handlePrivacySettingChange("dataCollection", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Analytics Tracking</p>
                  <p className="text-sm text-gray-500">Track application usage for improvements</p>
                </div>
                <Switch 
                  checked={privacySettings.analyticsTracking}
                  onCheckedChange={(value) => handlePrivacySettingChange("analyticsTracking", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Communications</p>
                  <p className="text-sm text-gray-500">Receive marketing emails and updates</p>
                </div>
                <Switch 
                  checked={privacySettings.marketingOptIn}
                  onCheckedChange={(value) => handlePrivacySettingChange("marketingOptIn", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Third-party Integrations</p>
                  <p className="text-sm text-gray-500">Allow data sharing with integrated services</p>
                </div>
                <Switch 
                  checked={privacySettings.thirdPartyIntegrations}
                  onCheckedChange={(value) => handlePrivacySettingChange("thirdPartyIntegrations", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Logging</p>
                  <p className="text-sm text-gray-500">Log login sessions for security</p>
                </div>
                <Switch 
                  checked={privacySettings.sessionLogging}
                  onCheckedChange={(value) => handlePrivacySettingChange("sessionLogging", value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Security Activity
            </CardTitle>
            <CardDescription>
              Recent login attempts and security events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.device}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {log.location}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(log.time)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Export or delete your account data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Export Account Data</h4>
                <p className="text-sm text-gray-500">Download all your account data</p>
              </div>
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20">
              <div>
                <h4 className="font-medium text-red-600 dark:text-red-400">Delete Account</h4>
                <p className="text-sm text-red-500 dark:text-red-400">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" onClick={deleteAccount}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}