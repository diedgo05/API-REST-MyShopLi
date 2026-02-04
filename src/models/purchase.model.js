const pool = require('../config/db');
const { v4: uuid } = require('uuid');

const Purchase = {

  /**
   * Crear nueva compra
   */
  create: async (userId, totalAmount, purchaseDate) => {
    const id = uuid();
    await pool.query(
      'INSERT INTO purchases (id, user_id, total_amount, purchase_date, created_at) VALUES (?, ?, ?, ?, NOW())',
      [id, userId, totalAmount, purchaseDate]
    );
    return id;
  },

  /**
   * Agregar productos a una compra y marcarlos como comprados
   */
  addProducts: async (purchaseId, products) => {
    // Usar una conexión para hacer la operación transaccional
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      for (const p of products) {
        // Insertar producto en purchase_products
        await connection.query(
          `INSERT INTO purchase_products (purchase_id, product_name, category, price)
           VALUES (?, ?, ?, ?)`,
          [purchaseId, p.productName, p.category, p.price]
        );

        // Marcar producto como comprado
        if (p.productId) {
          await connection.query(
            'UPDATE products SET is_purchased = true WHERE id = ?',
            [p.productId]
          );
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Obtener todas las compras de un usuario
   */
  findAllByUser: async (userId, limit = 10, offset = 0) => {
    const [rows] = await pool.query(
      `SELECT * FROM purchases 
       WHERE user_id = ? 
       ORDER BY purchase_date DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );
    return rows;
  },

  /**
   * Obtener compras de un mes específico
   */
  findByMonth: async (userId, month, limit = 10, offset = 0) => {
    const [rows] = await pool.query(
      `SELECT * FROM purchases 
       WHERE user_id = ? 
       AND DATE_FORMAT(purchase_date, '%Y-%m') = ?
       ORDER BY purchase_date DESC
       LIMIT ? OFFSET ?`,
      [userId, month, parseInt(limit), parseInt(offset)]
    );
    return rows;
  },

  /**
   * Obtener una compra por ID (verificando que pertenezca al usuario)
   */
  findById: async (id, userId) => {
    const [rows] = await pool.query(
      'SELECT * FROM purchases WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0];
  },

  /**
   * Obtener productos de una compra
   */
  getProducts: async (purchaseId) => {
    const [rows] = await pool.query(
      'SELECT * FROM purchase_products WHERE purchase_id = ?',
      [purchaseId]
    );
    return rows;
  },

  /**
   * Actualizar compra (solo total y fecha)
   */
  update: async (id, userId, totalAmount, purchaseDate) => {
    return pool.query(
      'UPDATE purchases SET total_amount = ?, purchase_date = ? WHERE id = ? AND user_id = ?',
      [totalAmount, purchaseDate, id, userId]
    );
  },

  /**
   * Eliminar compra y sus productos asociados
   */
  delete: async (id, userId) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Eliminar productos de la compra (por CASCADE ya se eliminan, pero lo hacemos explícito)
      await connection.query(
        'DELETE FROM purchase_products WHERE purchase_id = ?',
        [id]
      );

      // Eliminar la compra
      await connection.query(
        'DELETE FROM purchases WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Obtener total gastado en un mes específico
   */
  getMonthlyTotal: async (userId, month) => {
    const [rows] = await pool.query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as totalSpent,
        COUNT(*) as purchaseCount,
        COALESCE(AVG(total_amount), 0) as averagePerPurchase
       FROM purchases 
       WHERE user_id = ? 
       AND DATE_FORMAT(purchase_date, '%Y-%m') = ?`,
      [userId, month]
    );
    return rows[0];
  },

  /**
   * Obtener estadísticas anuales (desglose por mes)
   */
  getYearlyStats: async (userId, year) => {
    const [rows] = await pool.query(
      `SELECT 
        DATE_FORMAT(purchase_date, '%Y-%m') as month,
        SUM(total_amount) as totalSpent,
        COUNT(*) as purchaseCount,
        AVG(total_amount) as averagePerPurchase
       FROM purchases 
       WHERE user_id = ? 
       AND YEAR(purchase_date) = ?
       GROUP BY DATE_FORMAT(purchase_date, '%Y-%m')
       ORDER BY month`,
      [userId, year]
    );
    return rows;
  },

  /**
   * Obtener categorías más compradas
   */
  getTopCategories: async (userId, limit = 5) => {
    const [rows] = await pool.query(
      `SELECT 
        pp.category,
        COUNT(*) as itemCount,
        SUM(pp.price) as totalSpent
       FROM purchase_products pp
       INNER JOIN purchases p ON pp.purchase_id = p.id
       WHERE p.user_id = ?
       GROUP BY pp.category
       ORDER BY itemCount DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }

};

module.exports = Purchase;