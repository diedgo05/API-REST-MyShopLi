const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/purchase.controller');

router.use(auth);
router.post('/', ctrl.createPurchase);

module.exports = router;