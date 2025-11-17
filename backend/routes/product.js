const express = require('express');
const router = express.Router();

// Import ONLY your existing product controller functions
const {
  newProduct,         // POST /admin/products - Create new product (admin only)
  getSingleProduct,   // GET /products/:id - Get single product (public)
  getProducts,        // GET /products - Get all products (public)
  getAdminProducts,   // GET /admin/products - Get all products (admin only)
  updateProduct,      // PUT /products/:id - Update product (admin only)
  deleteProduct,      // DELETE /products/:id - Delete product (admin only)
  productSales,       // GET /products/sales - Product sales analytics (admin only)
  createProductReview, // POST /products/:productId/reviews - Create review (authenticated)
  getProductReviews,  // GET /products/:productId/reviews - Get reviews (public)
  deleteReview,       // DELETE /products/:productId/reviews/:reviewId - Delete review (authenticated)
} = require('../controllers/products');

// Import your authentication middleware
const { isAuthenticatedUser, authorizeRoles } = require('../utils/authentication');

// ========== PUBLIC ROUTES (No authentication required) ==========

// Route for /products (public access)
router.route('/')
  .get(getProducts);         // GET /products - List products with search/filter

// Routes for /products/:id (public access for single product)
router.route('/:id')
  .get(getSingleProduct);    // GET /products/:id - Get single product details

// Route for product reviews (public read access)
router.route('/:productId/reviews')
  .get(getProductReviews);   // GET /products/:productId/reviews - Get product reviews

// ========== AUTHENTICATED USER ROUTES ==========

// Apply JWT protection for routes below that need authentication
router.post('/:productId/reviews', isAuthenticatedUser, createProductReview); // POST /products/:productId/reviews - Create review (user must be logged in)

// Delete own reviews (authenticated users can delete their own reviews)
router.delete('/:productId/reviews/:reviewId', isAuthenticatedUser, deleteReview); // DELETE /products/:productId/reviews/:reviewId

// ========== ADMIN ROUTES (Admin authentication required) ==========

// Apply JWT protection for admin routes
router.use(isAuthenticatedUser, authorizeRoles('admin'));

// Admin routes for /admin/products (full CRUD access)
router.route('/admin/products')
  .get(getAdminProducts)     // GET /admin/products - Get all products (admin view)
  .post(newProduct);         // POST /admin/products - Create new product

// Admin routes for /admin/products/:id (full access to individual products)
router.route('/admin/products/:id')
  .put(updateProduct)        // PUT /admin/products/:id - Update product
  .delete(deleteProduct);    // DELETE /admin/products/:id - Delete product

// Admin-specific route for product sales analytics
router.get('/admin/sales', productSales); // GET /products/admin/sales - Product sales analytics

module.exports = router;
