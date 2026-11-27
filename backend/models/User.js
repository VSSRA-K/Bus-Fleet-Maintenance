const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('./constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'MECHANIC' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods.verifyPassword = function (pw) {
  return bcrypt.compare(pw, this.passwordHash);
};

userSchema.methods.hasRole = function (r) {
  return this.role === r;
};

// Never expose the password hash in API responses.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
