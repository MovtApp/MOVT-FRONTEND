import React, { createContext, useContext, useReducer, ReactNode } from "react";

// Define the shape of a notification
export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
  userImage?: string;
  username?: string;
}

// Define the shape of our context state
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
}

// Define actions for the reducer
type NotificationAction =
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_AS_READ"; payload: { id: string } }
  | { type: "MARK_ALL_AS_READ" }
  | { type: "REMOVE_NOTIFICATION"; payload: { id: string } }
  | { type: "CLEAR_ALL_NOTIFICATIONS" };

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Reducer function to handle state changes
const notificationReducer = (state: Notification[], action: NotificationAction): Notification[] => {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return [action.payload, ...state];
    case "MARK_AS_READ":
      return state.map((notification) =>
        notification.id === action.payload.id ? { ...notification, read: true } : notification
      );
    case "MARK_ALL_AS_READ":
      return state.map((notification) => ({ ...notification, read: true }));
    case "REMOVE_NOTIFICATION":
      return state.filter((notification) => notification.id !== action.payload.id);
    case "CLEAR_ALL_NOTIFICATIONS":
      return [];
    default:
      return state;
  }
};

// Notification provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);

  // Function to add a new notification
  const addNotification = (notificationData: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substring(7),
      ...notificationData,
      timestamp: new Date(),
      read: false,
    };
    dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });
  };

  // Function to mark a specific notification as read
  const markAsRead = (id: string) => {
    dispatch({ type: "MARK_AS_READ", payload: { id } });
  };

  // Function to mark all notifications as read
  const markAllAsRead = () => {
    dispatch({ type: "MARK_ALL_AS_READ" });
  };

  // Function to remove a specific notification
  const removeNotification = (id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: { id } });
  };

  // Function to clear all notifications
  const clearAllNotifications = () => {
    dispatch({ type: "CLEAR_ALL_NOTIFICATIONS" });
  };

  // Calculate unread count
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
