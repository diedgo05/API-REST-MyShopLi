const { v4: uuid } = require('uuid');
const Product = require('../models/product.model');

exports.getProducts = async (req, res) => {
  const products = await Product.findAllByUser(req.user.id);
  res.json(products);
};

exports.addProduct = async (req, res) => {
  const { name, category, estimatedPrice } = req.body;

  await Product.create(
    uuid(),
    req.user.id,
    name,
    category,
    estimatedPrice
  );

  res.status(201).json({ message: 'Producto agregado' });
};

exports.deleteProduct = async (req, res) => {
  await Product.delete(req.params.id, req.user.id);
  res.json({ message: 'Producto eliminado' });
};
