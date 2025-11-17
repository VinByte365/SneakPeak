const express = require('express');
const router = express.Router();

// Import user controller functions
const {
  createUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  requestPasswordReset,
  resetPassword,
  bulkUserOperations,
  changeUserRole,
  toggleUserStatus,
  getUserStats,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
} = require('../controllers/users');

// Import your authentication middleware
const { isAuthenticatedUser, authorizeRoles } = require('../utils/authentication'); // Adjust path as needed

// ========== PUBLIC ROUTES (No authentication required) ==========

// Route for /users (public operations)
router.route('/')
  .post(createUser);         // POST /users - Register new user

// Route for /users/login
router.route('/login')
  .post(loginUser);          // POST /users/login - User login

// Route for password reset (public)
router.route('/password/reset')
  .post(requestPasswordReset); // POST /users/password/reset - Request password reset

// Route for password reset with token (public)
router.route('/password/reset/:token')
  .post(resetPassword);      // POST /users/password/reset/:token - Reset password

// ========== PROTECTED ROUTES (User authentication required) ==========

// Apply JWT protection to all routes below this line
router.use(isAuthenticatedUser);

// Routes for /users (protected operations)
router.route('/')
  .get(authorizeRoles('admin'), getAllUsers); // GET /users - Get all users (admin only)

// Routes for /users/:id (protected operations)
router.route('/:id')
  .get(getUserById)          // GET /users/:id - Get single user (authenticated users)
  .put(updateUser)           // PUT /users/:id - Update user (own profile or admin)
  .delete(authorizeRoles('admin'), deleteUser); // DELETE /users/:id - Delete user (admin only)

// ========== ADMIN-SPECIFIC ROUTES ==========

// Bulk user operations (admin only)
router.route('/bulk')
  .delete(authorizeRoles('admin'), bulkUserOperations); // DELETE /users/bulk - Bulk delete

// Change user role (admin only)
router.route('/:id/role')
  .patch(authorizeRoles('admin'), changeUserRole); // PATCH /users/:id/role - Change user role

// Toggle user status (admin only)
router.route('/:id/status')
  .patch(authorizeRoles('admin'), toggleUserStatus); // PATCH /users/:id/status - Toggle status

// User statistics (admin only)
router.route('/stats')
  .get(authorizeRoles('admin'), getUserStats); // GET /users/stats - User analytics

// ========== USER PROFILE ROUTES (Own profile access) ==========

// Get current user profile (shortcut for authenticated user)
router.route('/me')
  .get(getCurrentUser); // GET /users/me - Get current user profile

// Update current user profile (own profile)
router.route('/me')
  .put(updateCurrentUser); // PUT /users/me - Update current user profile

// ========== PASSWORD MANAGEMENT (Protected) ==========

// Change password (current user only)
router.route('/change-password')
  .put(authorizeRoles('user', 'admin'), changePassword); // PUT /users/change-password - Change password

module.exports = router;
