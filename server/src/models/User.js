import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  previousNames: { type: [String], default: [], select: false },
  role: { type: String, enum: ['hr', 'employee'], required: true },
  department: { type: String, default: '', trim: true, maxlength: 80 },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
