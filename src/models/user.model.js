const pool = require('../config/db');

const User = {

  create: async (id, name, email, password) => {
    return pool.query(
      'INSERT INTO users VALUES (?, ?, ?, ?, NOW())',
      [id, name, email, password]
    );
  },

  findByEmail: async (email) => {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

};

module.exports = User;
