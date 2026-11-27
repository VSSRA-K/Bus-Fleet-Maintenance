const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { requireId } = require('../utils/validators');

const listForUser = (userId) =>
  Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('busId', 'registrationNo')
    .populate('serviceRecordId', 'serviceType nextDueDate');

const markRead = async (id, userId) => {
  requireId(id, 'Notification id');
  const notification = await Notification.findOne({ _id: id, userId });
  if (!notification) throw new ApiError(404, 'Notification not found');
  notification.markRead();
  await notification.save();
  return notification;
};

module.exports = { listForUser, markRead };
