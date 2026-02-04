const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/product.controller');

router.use(auth);
router.get('/', ctrl.getProducts);
router.post('/', ctrl.addProduct);
router.delete('/:id', ctrl.deleteProduct);

module.exports = router;
