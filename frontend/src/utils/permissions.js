/**
 * Frontend Global Role Permissions
 * 
 * Mirrors backend permissions for UI display logic.
 * IMPORTANT: These are for UX only. Backend enforces actual security.
 * 
 * GLOBAL ROLES (users.role):
 * - SYSTEM_ADMIN: Platform administrator
 * - PROJECT_OWNER: Can create and own projects
 * - PROJECT_MANAGER: Project management capabilities
 * - TEAM_MEMBER: Standard working user
 * - VIEWER: Read-only global account
 */

/**
 * Global role permission matrix (must match backend)
 */
export const PERMISSIONS = {
  CAN_ACCESS_ADMIN: ['SYSTEM_ADMIN'],
  CAN_CREATE_PROJECT: ['SYSTEM_ADMIN', 'PROJECT_OWNER', 'PROJECT_MANAGER'],
  CAN_ACCESS_OWN_PROFILE: ['SYSTEM_ADMIN', 'PROJECT_OWNER', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'VIEWER'],
};

/**
 * Check if a user's global role has a specific permission
 * 
 * @param {string} userRole - The user's global role
 * @param {string} permission - The permission to check
 * @returns {boolean}
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) {
    return false;
  }
  
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    return false;
  }
  
  return allowedRoles.includes(userRole);
};

/**
 * Check if a user can create projects
 * 
 * @param {object} user - User object with role property
 * @returns {boolean}
 */
export const canCreateProject = (user) => {
  return user && hasPermission(user.role, 'CAN_CREATE_PROJECT');
};

/**
 * Check if a user can access admin functionality
 * 
 * @param {object} user - User object with role property
 * @returns {boolean}
 */
export const canAccessAdmin = (user) => {
  return user && hasPermission(user.role, 'CAN_ACCESS_ADMIN');
};

/**
 * Get user-friendly role description
 * 
 * @param {string} role - Global role
 * @returns {string}
 */
export const getRoleDescription = (role) => {
  const descriptions = {
    'SYSTEM_ADMIN': 'System Administrator',
    'PROJECT_OWNER': 'Project Owner',
    'PROJECT_MANAGER': 'Project Manager',
    'TEAM_MEMBER': 'Team Member',
    'VIEWER': 'Viewer'
  };
  
  return descriptions[role] || role;
};

/**
 * Get capabilities description for a global role
 * 
 * @param {string} role - Global role
 * @returns {string}
 */
export const getRoleCapabilities = (role) => {
  const capabilities = {
    'SYSTEM_ADMIN': 'Platform administration, user management, all features',
    'PROJECT_OWNER': 'Create and own projects, full project access',
    'PROJECT_MANAGER': 'Create projects, project management capabilities',
    'TEAM_MEMBER': 'Work on assigned projects and tasks',
    'VIEWER': 'Read-only access to assigned projects'
  };
  
  return capabilities[role] || 'Standard user capabilities';
};
