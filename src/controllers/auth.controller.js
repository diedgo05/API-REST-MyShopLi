const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const User = require('../models/user.model');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  const id = uuid();

  try {
    await User.create(id, name, email, hashed);
    const token = jwt.sign({ id }, process.env.JWT_SECRET);
    res.status(201).json({ success: true, token });
  } catch {
    res.status(400).json({ message: 'Email ya registrado' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email);
  if (!user)
    return res.status(401).json({ message: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.status(401).json({ message: 'Credenciales inválidas' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ success: true, token });
};
