const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/purchases', require('./routes/purchase.routes'));

module.exports = app;
