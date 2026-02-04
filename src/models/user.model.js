const pool = require('../config/db');

const User = {

  create: async (id, name, email, password) => {
    return pool.query(
      'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, NOW())',
      [id, name, email, password]
    );
  },

  findByEmail: async (email) => {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  update: async (id, name, email) => {
    return pool.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, id]
    );
  },

  updatePassword: async (id, hashedPassword) => {
    return pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
  },

  delete: async (id) => {
    return pool.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
  }

};

module.exports = User;