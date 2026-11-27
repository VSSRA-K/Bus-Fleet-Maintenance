// All date-only logic (due dates, reminder windows) uses UTC calendar days so that results
// do not depend on the server's time zone. Dates are exchanged as ISO strings (YYYY-MM-DD).
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDayUTC = (d = new Date()) => {
  const date = new Date(d);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const addDays = (d, n) => new Date(startOfDayUTC(d).getTime() + n * DAY_MS);

// Whole days from `from` to `to` (negative when `to` is earlier).
const daysBetween = (from, to) => Math.round((startOfDayUTC(to) - startOfDayUTC(from)) / DAY_MS);

const toISODate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

module.exports = { DAY_MS, startOfDayUTC, addDays, daysBetween, toISODate };
