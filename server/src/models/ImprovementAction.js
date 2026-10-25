import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 500 },
  authorName: { type: String, required: true },
}, { timestamps: true });

const actionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  objective: { type: String, default: '', trim: true, maxlength: 600 },
  theme: { type: String, default: '', trim: true, maxlength: 80 },
  status: { type: String, enum: ['planned', 'in-progress', 'completed', 'cancelled'], default: 'planned' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ownerName: { type: String, default: '' },
  dueDate: { type: Date, default: null },
  sharedWithEmployees: { type: Boolean, default: false },
  notes: { type: [noteSchema], default: [] },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('ImprovementAction', actionSchema);
