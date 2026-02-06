const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD de productos
router.get('/', productController.getProducts);                    // GET /api/products
router.get('/stats', productController.getStats);                  // GET /api/products/stats
router.get('/:id', productController.getProductById);              // GET /api/products/:id
router.post('/', productController.addProduct);                    // POST /api/products
router.put('/:id', productController.updateProduct);               // PUT /api/products/:id
router.delete('/:id', productController.deleteProduct);            // DELETE /api/products/:id
router.patch('/:id/toggle', productController.togglePurchased);    // PATCH /api/products/:id/toggle
router.patch('/:id/unpurchase', productController.unpurchaseProduct); // PATCH /api/products/:id/unpurchase
module.exports = router;