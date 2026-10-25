import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
  survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  summary: { type: String, required: true },
  themes: [{
    name: { type: String, required: true },
    sentiment: { type: String, enum: ['positive', 'concern', 'mixed'], required: true },
    summary: { type: String, required: true },
    recommendation: { type: String, required: true },
  }],
}, { timestamps: true });

export default mongoose.model('SurveyAnalysis', analysisSchema);
