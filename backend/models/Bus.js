const mongoose = require('mongoose');
const { BUS_STATUSES, FUEL_TYPES } = require('./constants');

const busSchema = new mongoose.Schema(
  {
    registrationNo: { type: String, required: true, trim: true, uppercase: true },
    manufacturer: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    fuelType: { type: String, enum: FUEL_TYPES, required: true },
    currentOdometerKm: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: BUS_STATUSES, default: 'Available' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Registration numbers must be unique among ACTIVE buses only (SRS 4.2.4).
busSchema.index(
  { registrationNo: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

busSchema.methods.deactivate = function () {
  this.isActive = false;
};

busSchema.methods.updateOdometer = function (km) {
  if (km > this.currentOdometerKm) this.currentOdometerKm = km;
};

busSchema.methods.setStatus = function (s) {
  this.status = s;
};

busSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Bus', busSchema);
