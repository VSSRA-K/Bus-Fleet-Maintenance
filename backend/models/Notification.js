const mongoose = require('mongoose');
const { NOTIF_TYPES } = require('./constants');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    serviceRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRecord', required: true },
    type: { type: String, enum: NOTIF_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, serviceRecordId: 1, type: 1 });

notificationSchema.methods.markRead = function () {
  if (!this.readAt) this.readAt = new Date();
};

notificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
