const Notification = require('../models/Notification');
const User = require('../models/User');
const { startOfDayUTC, daysBetween, toISODate } = require('../utils/dates');
const { dueRecords } = require('./ServiceRecordService');

// A notification is a duplicate when the same user already received one of the same type for
// the same service record since that record was last changed. This prevents a fresh alert every
// day (SRS 4.4.6) while still alerting again if the due date is edited.
const isDuplicate = (userId, record, type) =>
  Notification.exists({
    userId,
    serviceRecordId: record._id,
    type,
    createdAt: { $gte: record.updatedAt },
  });

const buildMessage = (record, type, today) => {
  const bus = record.busId;
  const due = toISODate(record.nextDueDate);
  const diff = daysBetween(today, record.nextDueDate);
  const label = `${record.serviceType} for bus ${bus.registrationNo}`;
  if (type === 'OVERDUE') {
    const n = Math.abs(diff);
    return {
      title: 'Service overdue',
      message: `${label} was due on ${due} and is overdue by ${n} day${n === 1 ? '' : 's'}.`,
    };
  }
  return {
    title: 'Service due soon',
    message:
      diff === 0
        ? `${label} is due today (${due}).`
        : `${label} is due on ${due} (in ${diff} day${diff === 1 ? '' : 's'}).`,
  };
};

// Runs once per day from the scheduler. Notifies every active user (administrators and
// mechanics) about services that are upcoming or overdue on active buses.
const runDailyCheck = async (now = new Date()) => {
  const today = startOfDayUTC(now);
  const { records } = await dueRecords(today);
  const users = await User.find({ isActive: true }).select('_id');

  let created = 0;
  let skipped = 0;
  for (const { record, dueStatus } of records) {
    const { title, message } = buildMessage(record, dueStatus, today);
    for (const user of users) {
      if (await isDuplicate(user._id, record, dueStatus)) {
        skipped += 1;
        continue;
      }
      await Notification.create({
        userId: user._id,
        busId: record.busId._id,
        serviceRecordId: record._id,
        type: dueStatus,
        title,
        message,
      });
      created += 1;
    }
  }
  const summary = { checked: records.length, created, skipped };
  console.log(`[reminder] ${now.toISOString()} checked=${summary.checked} created=${created} skipped=${skipped}`);
  return summary;
};

module.exports = { runDailyCheck };
