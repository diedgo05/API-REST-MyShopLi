const pool = require('../config/db');

const Product = {

  findAllByUser: async (userId) => {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE user_id = ? AND is_purchased = false ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  findAllProductsByUser: async (userId) => {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  findPurchasedByUser: async (userId) => {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE user_id = ? AND is_purchased = true ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0];
  },

  findByNameAndCategory: async (userId, name, category) => {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE user_id = ? AND name = ? AND category = ? AND is_purchased = false',
      [userId, name, category]
    );
    return rows[0];
  },

  create: async (id, userId, name, category, price) => {
    return pool.query(
      'INSERT INTO products (id, user_id, name, category, estimated_price, is_purchased, created_at) VALUES (?, ?, ?, ?, ?, false, NOW())',
      [id, userId, name, category, price]
    );
  },

  /**
   * Actualizar producto
   */
  update: async (id, userId, name, category, estimatedPrice) => {
    return pool.query(
      'UPDATE products SET name = ?, category = ?, estimated_price = ? WHERE id = ? AND user_id = ?',
      [name, category, estimatedPrice, id, userId]
    );
  },

  /**
   * Alternar estado de comprado
   */
  togglePurchased: async (id, userId) => {
    return pool.query(
      'UPDATE products SET is_purchased = NOT is_purchased WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  },

  /**
   * Marcar producto como no comprado (para cuando se elimina una compra)
   */
  markAsNotPurchased: async (id) => {
    return pool.query(
      'UPDATE products SET is_purchased = false WHERE id = ?',
      [id]
    );
  },

  /**
   * Eliminar producto
   */
  delete: async (id, userId) => {
    return pool.query(
      'DELETE FROM products WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  },

  /**
   * Obtener estadísticas de productos
   */
  getStats: async (userId) => {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_purchased = false THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN is_purchased = true THEN 1 ELSE 0 END) as purchased,
        SUM(CASE WHEN is_purchased = false THEN estimated_price ELSE 0 END) as estimatedTotal,
        category,
        COUNT(*) as categoryCount
       FROM products 
       WHERE user_id = ?
       GROUP BY category`,
      [userId]
    );
    return stats;
  }

};

module.exports = Product;