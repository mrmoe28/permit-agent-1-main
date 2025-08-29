import { useState } from "react";
import { User, Settings, LogOut, CreditCard, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ProfileDropdownProps {
  userInitials?: string;
  userName?: string;
  userEmail?: string;
}

export function ProfileDropdown({ 
  userInitials = "JD", 
  userName = "John Doe",
  userEmail = "john@sitewatcher.com" 
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    // Clear session and redirect to login
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  const handleProfile = () => {
    window.location.href = "/profile";
    setIsOpen(false);
  };

  const handleSettings = () => {
    window.location.href = "/settings";
    setIsOpen(false);
  };

  const handleBilling = () => {
    window.location.href = "/billing";
    setIsOpen(false);
  };

  const handleNotifications = () => {
    window.location.href = "/notifications";
    setIsOpen(false);
  };

  const handlePrivacy = () => {
    window.location.href = "/privacy";
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
          data-testid="profile-dropdown-trigger"
        >
          <span className="text-white text-sm font-medium">
            {userInitials}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleBilling} className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            Pro
          </Badge>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleNotifications} className="cursor-pointer">
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
          <Badge variant="destructive" className="ml-auto text-xs">
            3
          </Badge>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handlePrivacy} className="cursor-pointer">
          <Shield className="mr-2 h-4 w-4" />
          <span>Privacy & Security</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}