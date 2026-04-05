export interface ResponseWrapper<T> {
  message: string;
  data: T;
}

export function wrapResponse<T>(message: string, data: T): ResponseWrapper<T> {
  return {
    message,
    data,
  };
}

// Common response messages
export const ResponseMessages = {
  // Auth
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'User registered successfully',
  LOGOUT_SUCCESS: 'Logout successful',

  // Users
  USERS_FETCHED: 'Users fetched successfully',
  USER_FETCHED: 'User fetched successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',

  // General
  SUCCESS: 'Success',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',

  // Health
  HEALTH_CHECK_SUCCESS: 'Health check successful',
} as const;
