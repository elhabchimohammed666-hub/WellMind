import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const responseSchema = new mongoose.Schema({
  survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true, index: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  answers: { type: [answerSchema], required: true },
  respondent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, select: false },
}, { timestamps: true });

export default mongoose.model('SurveyResponse', responseSchema);
