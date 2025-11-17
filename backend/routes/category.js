const express = require('express');
const router = express.Router();

// Import ONLY functions that ACTUALLY EXIST in your controller
const {
  newCategory,              // ✅ Exists
  getSingleCategory,        // ✅ Exists
  getCategories,            // ✅ Exists
  getAdminCategories,       // ✅ Exists
  updateCategory,           // ✅ Exists
  deleteCategory,           // ✅ Exists
  restoreCategory,          // ✅ Exists
  bulkUpdateCategories,     // ✅ Exists
} = require('../controllers/categories');

// Import your authentication middleware
const { isAuthenticatedUser, authorizeRoles } = require('../utils/authentication');

// ========== PUBLIC ROUTES (No authentication required) ==========

// Public category access
router.get('/', getCategories); // GET /categories - List all categories (public)
router.get('/:id', getSingleCategory); // GET /categories/:id - Get single category

// ========== ADMIN ROUTES (Admin authentication required) ==========

// Apply admin protection to all routes below
router.use(isAuthenticatedUser, authorizeRoles('admin'));

// Admin category management
router.get('/admin/all', getAdminCategories); // GET /categories/admin/all - All categories with details
router.post('/admin', newCategory); // POST /categories/admin - Create new category
router.put('/admin/:id', updateCategory); // PUT /categories/admin/:id - Update category
router.delete('/admin/:id', deleteCategory); // DELETE /categories/admin/:id - Delete (soft delete)
router.patch('/admin/:id/restore', restoreCategory); // PATCH /categories/admin/:id/restore - Restore deleted

// Bulk operations
router.post('/admin/bulk-update', bulkUpdateCategories); // POST /categories/admin/bulk-update - Bulk update

module.exports = router;
