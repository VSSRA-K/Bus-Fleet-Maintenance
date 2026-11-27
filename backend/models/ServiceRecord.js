const mongoose = require('mongoose');
const { SERVICE_CATEGORIES } = require('./constants');
const { daysBetween } = require('../utils/dates');

const serviceRecordSchema = new mongoose.Schema(
  {
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true, index: true },
    serviceType: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, enum: SERVICE_CATEGORIES, required: true },
    description: { type: String, trim: true, maxlength: 1000 },
    serviceDate: { type: Date, required: true },
    odometerKm: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 }, // INR
    nextDueDate: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

serviceRecordSchema.index({ busId: 1, serviceDate: 1 });

// SCHEDULED: nothing due soon (or no due date); UPCOMING: due within the reminder window;
// OVERDUE: due date has passed.
serviceRecordSchema.methods.getDueStatus = function (today, windowDays) {
  if (!this.nextDueDate) return 'SCHEDULED';
  const diff = daysBetween(today, this.nextDueDate);
  if (diff < 0) return 'OVERDUE';
  if (diff <= windowDays) return 'UPCOMING';
  return 'SCHEDULED';
};

// Ids of the most recent record for every (bus, service type). Only these are "live" for
// due-date checks; an older record whose service has since been repeated is superseded.
serviceRecordSchema.statics.latestIds = async function (match = {}) {
  const rows = await this.aggregate([
    { $match: match },
    { $sort: { serviceDate: -1, createdAt: -1 } },
    {
      $group: {
        _id: { busId: '$busId', type: { $toLower: { $trim: { input: '$serviceType' } } } },
        id: { $first: '$_id' },
      },
    },
  ]);
  return new Set(rows.map((r) => String(r.id)));
};

serviceRecordSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);
