const pool = require('../config/db');

const Product = {

  findAllByUser: async (userId) => {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE user_id = ? AND is_purchased = false',
      [userId]
    );
    return rows;
  },

  create: async (id, userId, name, category, price) => {
    return pool.query(
      'INSERT INTO products VALUES (?, ?, ?, ?, ?, false, NOW())',
      [id, userId, name, category, price]
    );
  },

  delete: async (id, userId) => {
    return pool.query(
      'DELETE FROM products WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }


};

module.exports = Product;
