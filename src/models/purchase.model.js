const pool = require('../config/db');
const { v4: uuid } = require('uuid');

const Purchase = {

  create: async (userId, totalAmount, purchaseDate) => {
    const id = uuid();
    await pool.query(
      'INSERT INTO purchases VALUES (?, ?, ?, ?, NOW())',
      [id, userId, totalAmount, purchaseDate]
    );
    return id;
  },

  addProducts: async (purchaseId, products) => {
    for (const p of products) {
      await pool.query(
        `INSERT INTO purchase_products
         (purchase_id, product_name, category, price)
         VALUES (?, ?, ?, ?)`,
        [purchaseId, p.productName, p.category, p.price]
      );

      await pool.query(
        'UPDATE products SET is_purchased = true WHERE id = ?',
        [p.productId]
      );
    }
  }

};

module.exports = Purchase;
