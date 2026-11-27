const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const v = require('../utils/validators');

const BCRYPT_ROUNDS = 10;

const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
});

// SRS 4.1.1 / 4.1.6: self-registration with name, email and password. Self-registered accounts
// always get the MECHANIC role; only an administrator can grant ADMIN (SRS 4.1.7).
const register = async (body) => {
  const name = v.str(body.name, 'Name', { max: 100 });
  const email = v.email(body.email);
  const pw = v.password(body.password);

  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(pw, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: 'MECHANIC' });
  return { token: signToken(user), user: publicUser(user) };
};

// SRS 4.1.5: one generic message for unknown email, wrong password and deactivated account.
const login = async (body) => {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const pw = typeof body.password === 'string' ? body.password : '';
  const user = email && pw ? await User.findOne({ email }).select('+passwordHash') : null;

  if (!user || !user.isActive || !(await user.verifyPassword(pw))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return { token: signToken(user), user: publicUser(user) };
};

const verifyToken = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Your session has expired. Please log in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Your session is no longer valid.');
  return user;
};

// JWTs are stateless: logging out means the client discards its token.
const logout = async () => ({ message: 'Logged out' });

module.exports = { register, login, verifyToken, logout, publicUser, BCRYPT_ROUNDS };
