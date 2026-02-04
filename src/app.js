const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/purchases', require('./routes/purchase.routes'));

app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Ruta no encontrada',
      path: req.path
    });
  });

  app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  });

module.exports = app;
