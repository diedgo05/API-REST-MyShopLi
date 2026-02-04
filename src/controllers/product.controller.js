const pool = require('../config/db');
const { v4: uuid } = require('uuid');

exports.getProducts = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM products WHERE user_id = ? AND is_purchased = false',
    [req.user.id]
  );
  res.json(rows);
};

exports.addProduct = async (req, res) => {
  const { name, category, estimatedPrice } = req.body;

  await pool.query(
    'INSERT INTO products VALUES (?, ?, ?, ?, ?, false, NOW())',
    [uuid(), req.user.id, name, category, estimatedPrice]
  );

  res.status(201).json({ message: 'Producto agregado' });
};

exports.deleteProduct = async (req, res) => {
  await pool.query(
    'DELETE FROM products WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  res.json({ message: 'Producto eliminado' });
};
