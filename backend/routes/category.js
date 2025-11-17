const express = require('express');
const router = express.Router();
const {
  newCategory,
  getSingleCategory,
  getCategories,
  getAdminCategories,
  updateCategory,
  deleteCategory,
  restoreCategory,
  bulkUpdateCategories
} = require('../controllers/categories');

// Import your authentication middleware
const { isAuthenticatedUser, authorizeRoles } = require('../utils/authentication'); // Adjust path as needed

// ========== PUBLIC ROUTES (No authentication required) ==========

// Route for /categories (public access for frontend)
router.route('/')
  .get(getCategories);         // GET /categories - List all categories (public)

// Routes for /categories/:id (public access for single category)
router.route('/:id')
  .get(getSingleCategory);     // GET /categories/:id - Get single category (public)

// ========== PROTECTED ROUTES (Authentication required) ==========

// Apply JWT protection to all routes below this line
router.use(isAuthenticatedUser);

// Protected route for /categories (user can see more details)
router.route('/')
  .get(authorizeRoles('admin'), getAdminCategories); // GET /categories (admin view with all data)
  // Note: POST route moved to admin section below

// Protected routes for /categories/:id (user can update own categories if applicable)
router.route('/:id')
  .put(authorizeRoles('admin'), updateCategory);     // PUT /categories/:id - Update category (admin only)
  // Note: DELETE moved to admin section below

// ========== ADMIN-SPECIFIC ROUTES (Admin authentication required) ==========

// Admin routes for /admin/categories (full admin access)
router.route('/admin/categories')
  .get(authorizeRoles('admin'), getAdminCategories)   // GET /admin/categories - All categories with details
  .post(authorizeRoles('admin'), newCategory);        // POST /admin/categories - Create new category

// Admin routes for /admin/categories/:id
router.route('/admin/categories/:id')
  .put(authorizeRoles('admin'), updateCategory)       // PUT /admin/categories/:id - Update category
  .delete(authorizeRoles('admin'), deleteCategory)    // DELETE /admin/categories/:id - Delete category
  .patch(authorizeRoles('admin'), restoreCategory);   // PATCH /admin/categories/:id/restore - Restore category

// Admin-specific route examples (bulk operations and special actions)
router.post('/admin/bulk-update', authorizeRoles('admin'), bulkUpdateCategories); // POST /admin/categories/bulk-update - Bulk update

// Bulk delete (admin only)
router.delete('/admin/bulk', authorizeRoles('admin'), bulkDeleteCategories); // DELETE /admin/categories/bulk - Bulk delete

// ========== UTILITY ROUTES ==========

// Get categories with product counts (protected - for dashboard/stats)
router.get('/with-stats', isAuthenticatedUser, getCategoriesWithStats); // GET /categories/with-stats

// Search categories (public but can be enhanced for logged-in users)
router.get('/search', getCategoriesSearch); // GET /categories/search?q=query

module.exports = router;
