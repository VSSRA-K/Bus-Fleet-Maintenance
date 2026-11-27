const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const v = require('../utils/validators');
const { ROLES } = require('../models/constants');
const { BCRYPT_ROUNDS } = require('./AuthService');

const list = () => User.find().sort({ name: 1 });

// Administrator creates an account with a role (SRS 4.1.7, Figure 10).
const create = async (body) => {
  const name = v.str(body.name, 'Name', { max: 100 });
  const email = v.email(body.email);
  const role = v.oneOf(body.role, 'Role', ROLES);
  const pw = v.password(body.password);

  if (await User.exists({ email })) throw new ApiError(409, 'This email is already in use');

  const passwordHash = await bcrypt.hash(pw, BCRYPT_ROUNDS);
  return User.create({ name, email, passwordHash, role, isActive: true });
};

const update = async (id, body, actingUserId) => {
  v.requireId(id, 'User id');
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  const isSelf = String(user._id) === String(actingUserId);
  if (body.name !== undefined) user.name = v.str(body.name, 'Name', { max: 100 });
  if (body.role !== undefined) {
    const role = v.oneOf(body.role, 'Role', ROLES);
    if (isSelf && role !== user.role) throw new ApiError(400, 'You cannot change your own role');
    user.role = role;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') throw new ApiError(400, 'isActive must be true or false');
    if (isSelf && body.isActive === false) {
      throw new ApiError(400, 'You cannot deactivate your own account');
    }
    user.isActive = body.isActive;
  }
  await user.save();
  return user;
};

module.exports = { list, create, update };
