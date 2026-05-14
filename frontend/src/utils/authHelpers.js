export const getStoredAuthData = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (error) {
    return {};
  }
};

export const getCurrentUserId = (authUser = null) => {
  if (authUser?.user?.id) return authUser.user.id;
  if (authUser?.id) return authUser.id;

  const storedAuth = getStoredAuthData();
  return storedAuth?.user?.id || null;
};

export const getCurrentUserRole = (authUser = null) => {
  const role = authUser?.user?.role_id || authUser?.user?.role || authUser?.role_id || authUser?.role;
  if (role !== undefined && role !== null) return Number(role);

  const storedAuth = getStoredAuthData();
  return Number(storedAuth?.user?.role_id || storedAuth?.user?.role || 0);
};

export const getHistoryPathByRole = (authUser = null) =>
  getCurrentUserRole(authUser) === 3 ? '/admin/history' : '/history';

export const getBrowseFieldsPathByRole = (authUser = null) =>
  getCurrentUserRole(authUser) === 3 ? '/admin/book-field' : '/';

export const getFieldDetailPath = (fieldId, authUser = null) =>
  getCurrentUserRole(authUser) === 3 ? `/admin/field/${fieldId}` : `/field/${fieldId}`;
