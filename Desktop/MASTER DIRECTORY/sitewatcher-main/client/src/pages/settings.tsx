import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Key, 
  Globe,
  Shield,
  Download,
  Trash2,
  Save
} from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: "SEO Watcher",
    defaultAnalysisFrequency: "weekly",
    maxConcurrentAnalyses: 5,
    
    // Notifications
    emailNotifications: true,
    analysisCompleteNotifications: true,
    weeklyReports: true,
    issueAlerts: true,
    
    // API Configuration
    googleApiKey: "",
    maxAnalysesPerDay: 100,
    analysisTimeout: 30,
    
    // Privacy & Security
    dataRetention: "1year",
    shareAnalytics: false,
    twoFactorAuth: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here we would call the API to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your data export will be ready for download shortly",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account",
      variant: "destructive",
    });
  };

  return (
    <PageLayout 
      title="Settings" 
      description="Configure your SEO Watcher preferences and account settings"
    >
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="api">API & Limits</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure basic application preferences and default behaviors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Application Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="analysisFrequency">Default Analysis Frequency</Label>
                  <Select 
                    value={settings.defaultAnalysisFrequency} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, defaultAnalysisFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxConcurrent">Max Concurrent Analyses</Label>
                  <Select 
                    value={settings.maxConcurrentAnalyses.toString()} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, maxConcurrentAnalyses: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose when and how you want to be notified about your SEO analyses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analysisComplete">Analysis Complete</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when SEO analyses finish
                    </p>
                  </div>
                  <Switch
                    id="analysisComplete"
                    checked={settings.analysisCompleteNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, analysisCompleteNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weeklyReports">Weekly Reports</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive weekly summary reports
                    </p>
                  </div>
                  <Switch
                    id="weeklyReports"
                    checked={settings.weeklyReports}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="issueAlerts">Issue Alerts</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get alerted about critical SEO issues
                    </p>
                  </div>
                  <Switch
                    id="issueAlerts"
                    checked={settings.issueAlerts}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, issueAlerts: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Configure API keys and usage limits for external services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="googleApiKey">Google PageSpeed Insights API Key</Label>
                  <Input
                    id="googleApiKey"
                    type="password"
                    placeholder="Enter your Google API key"
                    value={settings.googleApiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, googleApiKey: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Required for detailed PageSpeed analysis. Get your key from Google Cloud Console.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAnalyses">Max Analyses Per Day</Label>
                  <Select 
                    value={settings.maxAnalysesPerDay.toString()} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, maxAnalysesPerDay: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="250">250</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="analysisTimeout">Analysis Timeout (seconds)</Label>
                  <Select 
                    value={settings.analysisTimeout.toString()} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, analysisTimeout: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                      <SelectItem value="120">120 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Manage your data retention and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention Period</Label>
                  <Select 
                    value={settings.dataRetention} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, dataRetention: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3months">3 months</SelectItem>
                      <SelectItem value="6months">6 months</SelectItem>
                      <SelectItem value="1year">1 year</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="shareAnalytics">Share Anonymous Analytics</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Help improve the service by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch
                    id="shareAnalytics"
                    checked={settings.shareAnalytics}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, shareAnalytics: checked }))}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Data Management</h4>
                  
                  <Button variant="outline" onClick={handleExportData} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export All Data
                  </Button>
                  
                  <Button variant="destructive" onClick={handleDeleteAccount} className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}