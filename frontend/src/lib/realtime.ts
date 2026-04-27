/**
 * Supabase Realtime subscription hooks for live notifications.
 *
 * These hooks provide real-time updates for:
 * - Notifications (new matches, partnership updates)
 * - Partnership status changes
 * - Product sync completions
 *
 * Usage:
 *   const { notifications, unreadCount, markAsRead } = useRealtimeNotifications(companyId);
 *   const { partnerships } = useRealtimePartnerships(companyId);
 */

import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ============================================================================
// TYPES
// ============================================================================

export interface Notification {
  id: string;
  company_id: string;
  type: "creator_match" | "partnership_update" | "product_sync";
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface Partnership {
  id: string;
  company_id: string;
  status: string;
  creator_name: string;
  creator_email?: string;
  video_title?: string;
  video_url?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// REALTIME NOTIFICATIONS HOOK
// ============================================================================

/**
 * Hook to subscribe to real-time notifications.
 *
 * Listens for new notifications inserted into the notifications table
 * and provides methods to mark them as read.
 *
 * @param companyId - The company ID to subscribe to
 * @returns notifications, unreadCount, markAsRead, markAllAsRead
 */
export function useRealtimeNotifications(companyId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!companyId) return;

    // Fetch initial notifications
    const fetchInitialNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && !error) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
    };

    fetchInitialNotifications();

    // Subscribe to real-time changes
    channelRef.current = supabase
      .channel(`notifications:${companyId}`)
      .on<Notification>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `company_id=eq.${companyId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
          setUnreadCount((prev) => prev + 1);

          // Show browser notification if permission granted
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: "/favicon.ico",
            });
          }
        }
      )
      .on<Notification>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `company_id=eq.${companyId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );

          // Recalculate unread count
          setNotifications((prev) => {
            setUnreadCount(prev.filter((n) => !n.read).length);
            return prev;
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [companyId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!companyId) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("company_id", companyId)
      .eq("read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }, [companyId]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
  };
}

// ============================================================================
// REALTIME PARTNERSHIPS HOOK
// ============================================================================

/**
 * Hook to subscribe to partnership status changes.
 *
 * Listens for INSERT, UPDATE, and DELETE events on the partnerships table.
 * Useful for keeping the Kanban board in sync across tabs/users.
 *
 * @param companyId - The company ID to subscribe to
 * @returns partnerships, isConnected, refresh
 */
export function useRealtimePartnerships(companyId: string | undefined) {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!companyId) return;

    // Fetch initial partnerships
    const fetchInitialPartnerships = async () => {
      const { data, error } = await supabase
        .from("partnerships")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (data && !error) {
        setPartnerships(data);
      }
    };

    fetchInitialPartnerships();

    // Subscribe to real-time changes
    channelRef.current = supabase
      .channel(`partnerships:${companyId}`)
      .on<Partnership>(
        "postgres_changes",
        {
          event: "*", // All events: INSERT, UPDATE, DELETE
          schema: "public",
          table: "partnerships",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newPartnership = payload.new as Partnership;
            setPartnerships((prev) => [newPartnership, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedPartnership = payload.new as Partnership;
            setPartnerships((prev) =>
              prev.map((p) =>
                p.id === updatedPartnership.id ? updatedPartnership : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedPartnership = payload.old as Partnership;
            setPartnerships((prev) =>
              prev.filter((p) => p.id !== deletedPartnership.id)
            );
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [companyId]);

  const refresh = useCallback(async () => {
    if (!companyId) return;

    const { data, error } = await supabase
      .from("partnerships")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setPartnerships(data);
    }
  }, [companyId]);

  return {
    partnerships,
    setPartnerships,
    isConnected,
    refresh,
  };
}

// ============================================================================
// BROWSER NOTIFICATION PERMISSION
// ============================================================================

/**
 * Request browser notification permission.
 *
 * Call this when the user enables notifications in settings.
 *
 * @returns Promise<boolean> - Whether permission was granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// ============================================================================
// PRESENCE HOOK (Optional - for showing who's online)
// ============================================================================

/**
 * Hook for tracking user presence.
 *
 * Shows who is currently viewing the dashboard.
 * Useful for collaborative features.
 *
 * @param channelName - Unique channel name
 * @param userId - Current user's ID
 * @returns onlineUsers - List of online user IDs
 */
export function usePresence(channelName: string, userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    channelRef.current = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current
      .on("presence", { event: "sync" }, () => {
        const state = channelRef.current?.presenceState() || {};
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channelRef.current?.track({ user_id: userId });
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channelName, userId]);

  return { onlineUsers };
}
