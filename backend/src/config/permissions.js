/**
 * Global Role Permissions Configuration
 * 
 * This module defines what each GLOBAL role can do at the application level.
 * Project-specific permissions are still controlled by PROJECT MEMBERSHIP roles.
 * 
 * GLOBAL ROLES (users.role):
 * - SYSTEM_ADMIN: Platform administrator
 * - PROJECT_OWNER: Can create and own projects
 * - PROJECT_MANAGER: Project management capabilities
 * - TEAM_MEMBER: Standard working user
 * - VIEWER: Read-only global account
 * 
 * PROJECT MEMBERSHIP ROLES (project_members.role):
 * - OWNER: Full project control
 * - DEVELOPER: Contributor access
 * - VIEWER: Read-only project access
 */

/**
 * Global role permission matrix
 */
export const PERMISSIONS = {
  // Platform administration
  CAN_ACCESS_ADMIN: ['SYSTEM_ADMIN'],
  CAN_MANAGE_GLOBAL_USERS: ['SYSTEM_ADMIN'],
  CAN_MODIFY_GLOBAL_ROLES: ['SYSTEM_ADMIN'],
  
  // Project creation
  CAN_CREATE_PROJECT: ['SYSTEM_ADMIN', 'PROJECT_OWNER', 'PROJECT_MANAGER'],
  
  // Access to own profile (all authenticated users)
  CAN_ACCESS_OWN_PROFILE: ['SYSTEM_ADMIN', 'PROJECT_OWNER', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'VIEWER'],
  
  // Project access controlled by membership (not global role)
  // Task access controlled by project membership (not global role)
};

/**
 * Check if a user's global role has a specific permission
 * 
 * @param {string} userRole - The user's global role
 * @param {string} permission - The permission to check (e.g., 'CAN_CREATE_PROJECT')
 * @returns {boolean} - True if the user has the permission
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
 * @param {string} userRole - The user's global role
 * @returns {boolean}
 */
export const canCreateProject = (userRole) => {
  return hasPermission(userRole, 'CAN_CREATE_PROJECT');
};

/**
 * Check if a user can access admin functionality
 * 
 * @param {string} userRole - The user's global role
 * @returns {boolean}
 */
export const canAccessAdmin = (userRole) => {
  return hasPermission(userRole, 'CAN_ACCESS_ADMIN');
};

/**
 * Check if a user can manage global users and roles
 * 
 * @param {string} userRole - The user's global role
 * @returns {boolean}
 */
export const canManageGlobalUsers = (userRole) => {
  return hasPermission(userRole, 'CAN_MANAGE_GLOBAL_USERS');
};

/**
 * Middleware: Require permission to create projects
 */
export const requireProjectCreation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (!canCreateProject(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Your role does not have permission to create projects. Required role: SYSTEM_ADMIN, PROJECT_OWNER, or PROJECT_MANAGER.'
    });
  }
  
  next();
};
