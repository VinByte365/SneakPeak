const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');

// Import ONLY functions that ACTUALLY EXIST in your controller
const {
  newProduct,              // ✅ Exists
  getSingleProduct,        // ✅ Exists
  getProducts,             // ✅ Exists
  getAdminProducts,        // ✅ Exists
  updateProduct,           // ✅ Exists
  deleteProduct,           // ✅ Exists
  productSales,            // ✅ Exists
  createProductReview,     // ✅ Exists
  getProductReviews,       // ✅ Exists
  deleteReview,            // ✅ Exists
} = require('../controllers/products');

// Import your authentication middleware
const { isAuthenticatedUser, authorizeRoles } = require('../utils/authentication');

// ========== PUBLIC ROUTES (No authentication required) ==========

// Public product listing and details
router.get('/', getProducts); // GET /products - List products with filters
router.get('/:id', getSingleProduct); // GET /products/:id - Get single product

// Public reviews access
router.get('/reviews', getProductReviews); // GET /products/reviews?id=productId - Get reviews

// ========== AUTHENTICATED USER ROUTES ==========

// Create review (authenticated users only)
router.post('/reviews', isAuthenticatedUser, createProductReview); // POST /products/reviews

// Delete review (authenticated users can delete own reviews)
router.delete('/reviews', isAuthenticatedUser, deleteReview); // DELETE /products/reviews?productId=x&id=reviewId

// ========== ADMIN ROUTES (Admin authentication required) ==========

// Apply admin protection
router.use(isAuthenticatedUser, authorizeRoles('admin'));

// Admin product management
router.get('/admin/all', getAdminProducts); // GET /products/admin/all - All products (admin view)
router.post('/admin', upload.array('images', 5), newProduct); // POST /products/admin - Create new product
router.put('/admin/:id', upload.array('images', 5), updateProduct); // PUT /products/admin/:id - Update product
router.delete('/admin/:id', deleteProduct); // DELETE /products/admin/:id - Delete product

// Admin analytics
router.get('/admin/sales', productSales); // GET /products/admin/sales - Product sales analytics

module.exports = router;
