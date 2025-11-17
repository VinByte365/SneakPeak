const express = require('express');
const router = express.Router();

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

const { isAuthenticatedUser, authorizeRoles } = require('../utils/authentication');

// ========== AUTHENTICATED USER ROUTES ==========
router.use(isAuthenticatedUser);

// ✅ FIX: Move admin routes BEFORE dynamic /:id route
// ========== ADMIN ROUTES (Must come BEFORE /:id) ==========
router.get('/admin/all', authorizeRoles('admin'), allOrders);
router.get('/admin/total', authorizeRoles('admin'), totalOrders);
router.get('/admin/sales', authorizeRoles('admin'), totalSales);
router.get('/admin/customer-sales', authorizeRoles('admin'), customerSales);
router.get('/admin/sales-per-month', authorizeRoles('admin'), salesPerMonth);
router.put('/admin/:id', authorizeRoles('admin'), updateOrder);
router.delete('/admin/:id', authorizeRoles('admin'), deleteOrder);

// ========== USER ROUTES (After admin routes) ==========
router.get('/', myOrders);              // GET /orders - My orders
router.post('/', newOrder);             // POST /orders - Create order
router.get('/:id', getSingleOrder);     // GET /orders/:id - Single order

module.exports = router;
