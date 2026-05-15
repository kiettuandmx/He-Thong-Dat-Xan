import { getCurrentUserRole, getHistoryPathByRole } from './authHelpers';

export const resolveNotificationTarget = (notification, authUser = null) => {
  if (notification?.target_route) return notification.target_route;

  const role = getCurrentUserRole(authUser);
  const targetType = notification?.target_type;
  const type = notification?.type;

  if (targetType === 'complaint' || String(type || '').startsWith('complaint_')) {
    return role === 3 ? '/admin/complaints' : '/complaints';
  }

  if (targetType === 'announcement' || type === 'system_announcement') {
    if (role === 3) return '/admin/dashboard';
    if (role === 2) return '/owner/dashboard';
    return '/';
  }

  if (targetType === 'user' && type === 'login_success') {
    return role === 3 ? '/admin/profile' : '/profile';
  }

  return getHistoryPathByRole(authUser);
};
