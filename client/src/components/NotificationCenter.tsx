import React, { useState, useEffect } from "react";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/components/ui/notification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

type NotificationType = {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "alert";
  timestamp: string;
  isRead: boolean;
  cameraId?: number;
  screenshotUrl?: string;
};

type UnreadCountResponse = {
  count: number;
};

const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json() as Promise<NotificationType[]>;
    },
  });
  
  // Get unread notification count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/notifications/unread/count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread/count');
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      return response.json() as Promise<UnreadCountResponse>;
    },
  });
  
  const unreadCount = unreadData?.count || 0;
  
  // Mark notifications as read when opening popover
  useEffect(() => {
    if (open && unreadCount > 0) {
      const markAsRead = async () => {
        await fetch('/api/notifications/read-all', {
          method: 'PATCH',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      };
      markAsRead();
    }
  }, [open, unreadCount, queryClient]);
  
  // Delete a notification
  const handleDelete = async (id: number) => {
    await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
  };
  
  // Clear all notifications
  const handleClearAll = async () => {
    // For each notification, delete it
    if (notifications && notifications.length > 0) {
      await Promise.all(
        notifications.map(notification => 
          fetch(`/api/notifications/${notification.id}`, { 
            method: 'DELETE',
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  };
  
  // Create test notification
  const handleCreateTestNotification = async () => {
    await fetch('/api/notifications/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "This is a test notification" }),
    });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
  };
  
  // Filter notifications by type
  const infoNotifications = notifications?.filter(n => n.type === 'info') || [];
  const warningNotifications = notifications?.filter(n => n.type === 'warning') || [];
  const alertNotifications = notifications?.filter(n => n.type === 'alert') || [];
  
  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 md:w-96" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notifications</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearAll}
                disabled={!notifications || notifications.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Clear all
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="all">
            <div className="px-1 border-b">
              <TabsList className="w-full justify-start px-3 py-1">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="info" className="text-xs">
                  Info ({infoNotifications.length})
                </TabsTrigger>
                <TabsTrigger value="warning" className="text-xs">
                  Warnings ({warningNotifications.length})
                </TabsTrigger>
                <TabsTrigger value="alert" className="text-xs">
                  Alerts ({alertNotifications.length})
                </TabsTrigger>
              </TabsList>
            </div>
            
            <ScrollArea className="h-[350px]">
              <TabsContent value="all" className="m-0 p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex flex-col space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <div className="p-1">
                    {notifications.map((notification: NotificationType) => (
                      <div key={notification.id} className="py-1 px-2">
                        <Notification 
                          title={notification.title}
                          variant={notification.type}
                          onClose={() => handleDelete(notification.id)}
                        >
                          <p>{notification.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                          </p>
                        </Notification>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <BellOff className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">No notifications</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2"
                      onClick={handleCreateTestNotification}
                    >
                      Create test notification
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="info" className="m-0 p-0">
                {infoNotifications.length > 0 ? (
                  <div className="p-1">
                    {infoNotifications.map((notification: NotificationType) => (
                      <div key={notification.id} className="py-1 px-2">
                        <Notification 
                          title={notification.title}
                          variant="info"
                          onClose={() => handleDelete(notification.id)}
                        >
                          <p>{notification.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                          </p>
                        </Notification>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 p-4">
                    <p className="text-muted-foreground text-sm">No info notifications</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="warning" className="m-0 p-0">
                {warningNotifications.length > 0 ? (
                  <div className="p-1">
                    {warningNotifications.map((notification: NotificationType) => (
                      <div key={notification.id} className="py-1 px-2">
                        <Notification 
                          title={notification.title}
                          variant="warning"
                          onClose={() => handleDelete(notification.id)}
                        >
                          <p>{notification.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                          </p>
                        </Notification>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 p-4">
                    <p className="text-muted-foreground text-sm">No warning notifications</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="alert" className="m-0 p-0">
                {alertNotifications.length > 0 ? (
                  <div className="p-1">
                    {alertNotifications.map((notification: NotificationType) => (
                      <div key={notification.id} className="py-1 px-2">
                        <Notification 
                          title={notification.title}
                          variant="alert"
                          onClose={() => handleDelete(notification.id)}
                        >
                          <p>{notification.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                          </p>
                        </Notification>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 p-4">
                    <p className="text-muted-foreground text-sm">No alert notifications</p>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NotificationCenter;