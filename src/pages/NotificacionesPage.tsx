import { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { Bell, Check, X, Clock, MessageSquare, Heart, Award } from 'lucide-react';

interface Notification {
  id: string;
  type: 'chat' | 'ejercicio' | 'logro' | 'alerta';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificacionesPage() {
  const { addToast } = useUIStore();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'chat',
      title: 'Nueva respuesta del asistente',
      message: 'El asistente de IA ha respondido tu mensaje',
      time: 'Hace 5 minutos',
      read: false,
    },
    {
      id: '2',
      type: 'logro',
      title: '¡Logro desbloqueado!',
      message: 'Has completado tu primer ejercicio de respiración',
      time: 'Hace 1 hora',
      read: false,
    },
    {
      id: '3',
      type: 'ejercicio',
      title: 'Recordatorio de ejercicio',
      message: 'No olvides completar tu ejercicio diario de respiración',
      time: 'Hace 3 horas',
      read: true,
    },
    {
      id: '4',
      type: 'alerta',
      title: 'Evaluación pendiente',
      message: 'Tienes una evaluación de bienestar pendiente',
      time: 'Ayer',
      read: true,
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    addToast({
      type: 'success',
      title: 'Notificaciones leídas',
      message: 'Todas las notificaciones han sido marcadas como leídas',
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat': return MessageSquare;
      case 'ejercicio': return Heart;
      case 'logro': return Award;
      case 'alerta': return Bell;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'chat': return 'text-blue-500 bg-blue-50';
      case 'ejercicio': return 'text-pink-500 bg-pink-50';
      case 'logro': return 'text-yellow-500 bg-yellow-50';
      case 'alerta': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notificaciones</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Todas las notificaciones leídas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);
            
            return (
              <div
                key={notification.id}
                className={`bg-card rounded-xl p-4 border transition-all ${
                  !notification.read ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`${colorClass} rounded-full p-3 flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2 ml-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-accent rounded transition-colors"
                            title="Marcar como leída"
                          >
                            <Check className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-accent rounded transition-colors"
                          title="Eliminar"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{notification.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="font-semibold mb-4">Configuración de Notificaciones</h3>
        <div className="space-y-4">
          <NotificationSetting
            label="Notificaciones de chat"
            description="Recibe alertas cuando el asistente responda"
            defaultChecked
          />
          <NotificationSetting
            label="Recordatorios de ejercicios"
            description="Recordatorios diarios para completar ejercicios"
            defaultChecked
          />
          <NotificationSetting
            label="Actualizaciones de comunidad"
            description="Notificaciones sobre nuevos posts y respuestas"
            defaultChecked={false}
          />
          <NotificationSetting
            label="Alertas de logros"
            description="Notificaciones cuando desbloquees nuevos logros"
            defaultChecked
          />
        </div>
      </div>
    </div>
  );
}

function NotificationSetting({ label, description, defaultChecked }: any) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors">
        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
      </button>
    </div>
  );
}
