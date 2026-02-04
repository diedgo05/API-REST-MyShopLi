const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  const id = uuid();

  try {
    await pool.query(
      'INSERT INTO users VALUES (?, ?, ?, ?, NOW())',
      [id, name, email, hashed]
    );

    const token = jwt.sign({ id }, process.env.JWT_SECRET);
    res.status(201).json({ success: true, token });
  } catch {
    res.status(400).json({ message: 'Email ya registrado' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (!rows.length)
    return res.status(401).json({ message: 'Credenciales inválidas' });

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);

  if (!valid)
    return res.status(401).json({ message: 'Credenciales inválidas' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ success: true, token });
};
