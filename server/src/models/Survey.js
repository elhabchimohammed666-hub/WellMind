import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true, trim: true, maxlength: 300 },
  type: { type: String, enum: ['rating', 'choice', 'text'], required: true },
  required: { type: Boolean, default: true },
  options: { type: [String], default: [] },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 5 },
}, { _id: false });

const surveySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft', index: true },
  anonymous: { type: Boolean, default: true },
  startsAt: { type: Date, default: Date.now },
  endsAt: { type: Date, required: true },
  questions: { type: [questionSchema], validate: v => v.length > 0 },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('Survey', surveySchema);
