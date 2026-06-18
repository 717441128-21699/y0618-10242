import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-500/20 border-green-500/50 text-green-400',
  error: 'bg-warning-500/20 border-warning-500/50 text-warning-500',
  warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
  info: 'bg-primary-500/20 border-primary-500/50 text-primary-400',
};

export default function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.type];
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`flex items-center gap-3 p-4 rounded-lg border backdrop-blur-md ${colors[notification.type]}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <p className="flex-1 text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
