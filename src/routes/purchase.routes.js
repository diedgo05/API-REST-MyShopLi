const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD de compras
router.get('/', purchaseController.getPurchases);                  // GET /api/purchases
router.get('/total', purchaseController.getMonthlyTotal);          // GET /api/purchases/total
router.get('/stats/yearly', purchaseController.getYearlyStats);    // GET /api/purchases/stats/yearly
router.get('/:id', purchaseController.getPurchaseById);            // GET /api/purchases/:id
router.post('/', purchaseController.createPurchase);               // POST /api/purchases
router.put('/:id', purchaseController.updatePurchase);             // PUT /api/purchases/:id
router.delete('/:id', purchaseController.deletePurchase);          // DELETE /api/purchases/:id

module.exports = router;