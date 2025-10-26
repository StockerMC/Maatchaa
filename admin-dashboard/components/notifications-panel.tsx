"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, CheckCheck, Video, Users, Package, TrendingUp, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "match" | "partnership" | "product" | "analytics"
  title: string
  message: string
  time: string
  read: boolean
  icon: React.ElementType
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "partnership",
    title: "Partnership Accepted",
    message: "@cookingwithsarah accepted your partnership offer",
    time: "5 min ago",
    read: false,
    icon: Users,
  },
  {
    id: "2",
    type: "match",
    title: "New Match Found",
    message: "3 new shorts matched your products",
    time: "1 hour ago",
    read: false,
    icon: Video,
  },
  {
    id: "3",
    type: "product",
    title: "Product Performance",
    message: "Kitchen Scale reached 1M views",
    time: "3 hours ago",
    read: true,
    icon: Package,
  },
  {
    id: "4",
    type: "analytics",
    title: "Weekly Report Ready",
    message: "Your analytics report for this week is available",
    time: "1 day ago",
    read: true,
    icon: TrendingUp,
  },
]

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "partnership":
        return "bg-green-100 text-green-600"
      case "match":
        return "bg-[var(--lime-3)] text-[var(--lime-11)]"
      case "product":
        return "bg-blue-100 text-blue-600"
      case "analytics":
        return "bg-purple-100 text-purple-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted/50 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[var(--lime-9)] text-black text-xs font-semibold border-2 border-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <DropdownMenuLabel className="p-0 font-heading text-lg">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs hover:bg-[var(--lime-3)] hover:text-[var(--lime-11)]"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-center">No notifications</p>
              <p className="text-xs text-muted-foreground text-center mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors cursor-pointer group relative",
                    !notification.read && "bg-[var(--lime-2)]",
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        getNotificationColor(notification.type),
                      )}
                    >
                      <notification.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{notification.title}</p>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-[var(--lime-9)] flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notification.id)
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" className="w-full text-sm hover:bg-[var(--lime-3)] hover:text-[var(--lime-11)]">
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
