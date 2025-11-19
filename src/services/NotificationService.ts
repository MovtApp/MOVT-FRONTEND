// Mock Notification Service
// In a real app, this would interface with push notification services like Expo Notifications, Firebase, etc.

export interface NotificationData {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  userImage?: string;
  username?: string;
}

class NotificationService {
  // Simulate receiving a notification
  static simulateNotification(notificationData: NotificationData) {
    // In a real implementation, this would receive push notifications
    console.log("Notification received:", notificationData);
    // You can add logic here to dispatch notifications to your notification context
  }

  // Add notification to the app notification system
  static addLocalNotification(notificationData: NotificationData) {
    console.log("Local notification added:", notificationData);
    // In a real implementation, this would create local notifications
  }

  // Initialize notification service
  static async initialize() {
    console.log("Notification service initialized");
    // In a real implementation, this would register for push notifications
  }

  // Request notification permissions (for push notifications)
  static async requestPermission() {
    // In a real implementation, this would request notification permissions
    console.log("Notification permission requested");
    return true; // Mock response
  }

  // Get all notifications for the current user
  static async getNotifications() {
    // Mock data for demonstration purposes
    return [
      {
        id: "1",
        title: "Novo Treino Disponível",
        message: "Seu plano de treino personalizado já está disponível!",
        type: "info",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false,
        userImage: "https://example.com/avatar1.jpg",
        username: "João Silva",
      },
      {
        id: "2",
        title: "Desafio Concluído!",
        message: "Parabéns! Você completou o desafio semanal de cardio.",
        type: "success",
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        read: false,
        userImage: "https://example.com/avatar2.jpg",
        username: "Sistema MOVT",
      },
      {
        id: "3",
        title: "Lembrete de Treino",
        message: "Não se esqueça do seu treino de força hoje à noite.",
        type: "warning",
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        read: true,
        userImage: "https://example.com/avatar3.jpg",
        username: "Seu Treinador",
      },
      {
        id: "4",
        title: "Erro na Sincronização",
        message: "Falha ao sincronizar dados com o servidor. Tente novamente.",
        type: "error",
        timestamp: new Date(Date.now() - 259200000), // 3 days ago
        read: true,
        userImage: "https://example.com/avatar4.jpg",
        username: "Sistema MOVT",
      },
    ];
  }
}

export default NotificationService;
