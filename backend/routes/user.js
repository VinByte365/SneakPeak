const express = require('express');
const router = express.Router();

// Import user controller functions that ACTUALLY EXIST
const {
  createUser,               // ✅ Exists
  loginUser,                // ✅ Exists
  loginWithFirebase,        // ✅ EXISTS in your controller
  getAllUsers,              // ✅ Exists
  getUserById,              // ✅ Exists
  updateUser,               // ✅ Exists
  deleteUser,               // ✅ Exists
  requestPasswordReset,     // ✅ Exists
  resetPassword,            // ✅ Exists
  bulkUserOperations,       // ✅ Exists
  changeUserRole,           // ✅ Exists
  toggleUserStatus,         // ✅ Exists
  getUserStats,             // ✅ Exists
  getCurrentUser,           // ✅ Exists
  updateCurrentUser,        // ✅ Exists
  changePassword,           // ✅ Exists
} = require('../controllers/users');

// Import your authentication middleware
const { isAuthenticatedUser, authorizeRoles } = require('../utils/authentication');

// ========== PUBLIC ROUTES (No authentication required) ==========

// User registration
router.post('/', createUser); // POST /users - Register new user

// User login routes
router.post('/login', loginUser); // POST /users/login - Standard login
router.post('/firebase-login', loginWithFirebase); // POST /users/firebase-login - Firebase login (Google/Facebook)

// Password reset routes
router.post('/password/reset', requestPasswordReset); // POST /users/password/reset - Request reset
router.post('/password/reset/:token', resetPassword); // POST /users/password/reset/:token - Reset with token

// ========== PROTECTED ROUTES (Authentication required) ==========

// Apply JWT protection to all routes below
router.use(isAuthenticatedUser);

// Current user profile routes
router.get('/me', getCurrentUser); // GET /users/me - Get current user profile
router.put('/me', updateCurrentUser); // PUT /users/me - Update current user profile

// Change password (authenticated user)
router.put('/change-password', changePassword); // PUT /users/change-password

// ========== ADMIN ROUTES ==========

// Get all users (admin only)
router.get('/', authorizeRoles('admin'), getAllUsers); // GET /users - All users

// User statistics (admin only)
router.get('/stats', authorizeRoles('admin'), getUserStats); // GET /users/stats

// Bulk operations (admin only)
router.delete('/bulk', authorizeRoles('admin'), bulkUserOperations); // DELETE /users/bulk

// Individual user operations
router.get('/:id', getUserById); // GET /users/:id - Get single user
router.put('/:id', updateUser); // PUT /users/:id - Update user
router.delete('/:id', authorizeRoles('admin'), deleteUser); // DELETE /users/:id (admin only)

// Admin user management
router.patch('/:id/role', authorizeRoles('admin'), changeUserRole); // PATCH /users/:id/role
router.patch('/:id/status', authorizeRoles('admin'), toggleUserStatus); // PATCH /users/:id/status

module.exports = router;
