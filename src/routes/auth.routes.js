const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);

router.get('/profile', authMiddleware, auth.getProfile);

module.exports = router;
