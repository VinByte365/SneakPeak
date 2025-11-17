const express = require('express');
const router = express.Router();

// Import ONLY your existing order controller functions
const {
  newOrder,
  myOrders,
  getSingleOrder,
  allOrders,
  deleteOrder,
  updateOrder,
  totalOrders,
  totalSales,
  customerSales,
  salesPerMonth,
} = require('../controllers/orders');

// Import your authentication middleware
const { isAuthenticatedUser, authorizeRoles } = require('../utils/authentication'); // Adjust path as needed

// ========== AUTHENTICATED USER ROUTES ==========

// Apply JWT protection to all routes below this line (user must be logged in)
router.use(isAuthenticatedUser);

// Route for /orders (user's own orders)
router.route('/')
  .get(myOrders)       // GET /orders - Get current user's orders
  .post(newOrder);     // POST /orders - Create new order

// Route for single order
router.route('/:id')
  .get(getSingleOrder); // GET /orders/:id - Get single order (can view own or admin)

// ========== ADMIN-SPECIFIC ROUTES ==========

// Admin routes for getting all orders and analytics
router.get('/admin', authorizeRoles('admin'), allOrders); // GET /orders/admin - Get all orders (admin only)
router.get('/total', authorizeRoles('admin'), totalOrders); // GET /orders/total - Total orders count (admin only)
router.get('/sales', authorizeRoles('admin'), totalSales); // GET /orders/sales - Total sales amount (admin only)
router.get('/customer-sales', authorizeRoles('admin'), customerSales); // GET /orders/customer-sales - Sales by customer (admin only)
router.get('/sales-per-month', authorizeRoles('admin'), salesPerMonth); // GET /orders/sales-per-month - Monthly sales (admin only)

// Admin routes for order management
router.put('/:id', authorizeRoles('admin'), updateOrder); // PUT /orders/:id - Update order (admin only)
router.delete('/:id', authorizeRoles('admin'), deleteOrder); // DELETE /orders/:id - Delete order (admin only)

module.exports = router;
