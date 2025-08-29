import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Mail, 
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  Settings as SettingsIcon,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export default function Notifications() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    seoAlerts: true,
    weeklyReports: true,
    systemUpdates: false,
    marketingEmails: false,
    securityAlerts: true,
    analysisComplete: true
  });

  const [notifications] = useState([
    {
      id: 1,
      type: "success",
      title: "SEO Analysis Complete",
      message: "Analysis for google.com has finished with a score of 92/100",
      time: "2 minutes ago",
      read: false,
      icon: CheckCircle
    },
    {
      id: 2,
      type: "warning", 
      title: "Site Performance Alert",
      message: "Page speed for example.com has dropped below 50. Consider optimization.",
      time: "1 hour ago",
      read: false,
      icon: AlertTriangle
    },
    {
      id: 3,
      type: "info",
      title: "Weekly SEO Report Ready",
      message: "Your weekly performance summary is available for download",
      time: "3 hours ago",
      read: true,
      icon: TrendingUp
    }
  ]);

  const { toast } = useToast();

  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    
    toast({
      title: "Settings Updated",
      description: `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const markAsRead = (id: number) => {
    toast({
      title: "Marked as Read",
      description: "Notification has been marked as read",
    });
  };

  const deleteNotification = (id: number) => {
    toast({
      title: "Notification Deleted", 
      description: "The notification has been removed",
    });
  };

  const markAllAsRead = () => {
    toast({
      title: "All Notifications Read",
      description: "All notifications have been marked as read",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return { icon: CheckCircle, color: "text-green-600" };
      case "warning": return { icon: AlertTriangle, color: "text-yellow-600" };
      case "error": return { icon: AlertCircle, color: "text-red-600" };
      default: return { icon: Info, color: "text-blue-600" };
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <PageLayout 
      title="Notifications" 
      description="Manage your notification preferences and view recent alerts"
    >
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Notification Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Unread
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {unreadCount}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Today
                  </p>
                  <p className="text-2xl font-bold">
                    {notifications.length}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email Enabled
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {settings.emailNotifications ? "Yes" : "No"}
                  </p>
                </div>
                <SettingsIcon className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount} new
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Your latest alerts and updates
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark All Read
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => {
                const { icon: IconComponent, color } = getNotificationIcon(notification.type);
                
                return (
                  <div 
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      !notification.read 
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                        : 'bg-gray-50 dark:bg-gray-900/20'
                    }`}
                  >
                    <div className={`p-2 rounded-full bg-white dark:bg-gray-800 ${color}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{notification.time}</span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {notifications.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No notifications
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    You're all caught up! New notifications will appear here.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how and when you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Delivery Methods */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Delivery Methods
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications}
                    onCheckedChange={(value) => handleSettingChange("emailNotifications", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">Browser push notifications</p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications}
                    onCheckedChange={(value) => handleSettingChange("pushNotifications", value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Notification Types */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notification Types
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SEO Alerts</p>
                    <p className="text-sm text-gray-500">Score changes and issues detected</p>
                  </div>
                  <Switch 
                    checked={settings.seoAlerts}
                    onCheckedChange={(value) => handleSettingChange("seoAlerts", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analysis Complete</p>
                    <p className="text-sm text-gray-500">When site analysis finishes</p>
                  </div>
                  <Switch 
                    checked={settings.analysisComplete}
                    onCheckedChange={(value) => handleSettingChange("analysisComplete", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Reports</p>
                    <p className="text-sm text-gray-500">Performance summary emails</p>
                  </div>
                  <Switch 
                    checked={settings.weeklyReports}
                    onCheckedChange={(value) => handleSettingChange("weeklyReports", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Security Alerts</p>
                    <p className="text-sm text-gray-500">Account security notifications</p>
                  </div>
                  <Switch 
                    checked={settings.securityAlerts}
                    onCheckedChange={(value) => handleSettingChange("securityAlerts", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Updates</p>
                    <p className="text-sm text-gray-500">New features and maintenance</p>
                  </div>
                  <Switch 
                    checked={settings.systemUpdates}
                    onCheckedChange={(value) => handleSettingChange("systemUpdates", value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-gray-500">Product updates and tips</p>
                  </div>
                  <Switch 
                    checked={settings.marketingEmails}
                    onCheckedChange={(value) => handleSettingChange("marketingEmails", value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}