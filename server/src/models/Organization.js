import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  minimumResponseThreshold: { type: Number, default: 5, min: 3, max: 50 },
}, { timestamps: true });

export default mongoose.model('Organization', organizationSchema);
