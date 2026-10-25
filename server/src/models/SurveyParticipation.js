import mongoose from 'mongoose';

const participationSchema = new mongoose.Schema({
  survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

participationSchema.index({ survey: 1, user: 1 }, { unique: true });

export default mongoose.model('SurveyParticipation', participationSchema);
