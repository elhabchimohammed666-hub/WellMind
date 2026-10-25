import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import Survey from '../models/Survey.js';
import SurveyResponse from '../models/SurveyResponse.js';
import SurveyParticipation from '../models/SurveyParticipation.js';
import SurveyAnalysis from '../models/SurveyAnalysis.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import ImprovementAction from '../models/ImprovementAction.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { aggregateAnswers, deidentifyFeedback } from '../services/privacy.js';
import { analyzeFeedback } from '../services/ai.js';
import { canReport, isSurveyOpen, responseIdentity, validateAnswers } from '../services/survey-rules.js';

const router = Router();
router.use(requireAuth);

function createSurveyData(body, organization, user) {
  if (typeof body.title !== 'string' || !body.title.trim()) {
    throw Object.assign(new Error('Le titre du sondage est obligatoire.'), { status: 400 });
  }
  const questions = Array.isArray(body.questions) ? body.questions : [];
  if (!questions.length || questions.length > 30) throw Object.assign(new Error('Un sondage doit contenir entre 1 et 30 questions.'), { status: 400 });
  for (const question of questions) {
    if (!question.label?.trim() || !['rating', 'choice', 'text'].includes(question.type)) {
      throw Object.assign(new Error('Chaque question doit avoir un intitulé et un type valide.'), { status: 400 });
    }
    if (question.type === 'choice' && (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 12)) {
      throw Object.assign(new Error('Une question à choix multiples doit proposer entre 2 et 12 réponses.'), { status: 400 });
    }
    if (question.type === 'choice' && question.options.some(option => typeof option !== 'string' || !option.trim())) {
      throw Object.assign(new Error('Les choix proposés ne peuvent pas être vides.'), { status: 400 });
    }
    if (question.type === 'rating') {
      const min = Number(question.min || 1);
      const max = Number(question.max || 5);
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 10 || max <= min) {
        throw Object.assign(new Error('L’échelle de notation est invalide.'), { status: 400 });
      }
    }
  }
  const end = new Date(body.endsAt);
  const start = body.startsAt ? new Date(body.startsAt) : new Date();
  if (Number.isNaN(end.getTime()) || Number.isNaN(start.getTime()) || end <= start) {
    throw Object.assign(new Error('Les dates de disponibilité du sondage sont invalides.'), { status: 400 });
  }
  const questionIds = new Set();
  const normalizedQuestions = questions.map(question => {
    const id = typeof question.id === 'string' && question.id.trim() ? question.id.trim() : randomUUID();
    if (questionIds.has(id)) throw Object.assign(new Error('Chaque question doit posséder un identifiant unique.'), { status: 400 });
    questionIds.add(id);
    return {
      id,
      label: question.label,
      type: question.type,
      required: question.required !== false,
      options: question.type === 'choice' ? [...new Set(question.options.map(option => option.trim()))] : [],
      min: question.type === 'rating' ? Number(question.min || 1) : 1,
      max: question.type === 'rating' ? Number(question.max || 5) : 5,
    };
  });
  if (normalizedQuestions.some(question => question.type === 'choice' && question.options.length < 2)) {
    throw Object.assign(new Error('Une question à choix multiples doit proposer au moins deux réponses distinctes.'), { status: 400 });
  }
  return {
    title: body.title,
    description: body.description,
    anonymous: body.anonymous !== false,
    startsAt: start,
    endsAt: end,
    questions: normalizedQuestions,
    organization,
    createdBy: user,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const query = { organization: req.user.organization };
    if (req.user.role === 'employee') query.status = 'published';
    const surveys = await Survey.find(query).sort({ createdAt: -1 }).lean();
    if (req.user.role === 'employee') {
      const participations = await SurveyParticipation.find({
        survey: { $in: surveys.map(survey => survey._id) },
        user: req.user._id,
      }).select('survey').lean();
      const completed = new Set(participations.map(item => item.survey.toString()));
      return res.json({
        surveys: surveys.map(survey => ({
          ...survey,
          hasResponded: completed.has(survey._id.toString()),
          acceptingResponses: isSurveyOpen(survey),
        })),
      });
    }
    res.json({ surveys });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('hr'), async (req, res, next) => {
  try {
    const survey = await Survey.create(createSurveyData(req.body, req.user.organization, req.user._id));
    res.status(201).json({ survey });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireRole('hr'), async (req, res, next) => {
  try {
    const survey = await Survey.findOne({ _id: req.params.id, organization: req.user.organization });
    if (!survey) return res.status(404).json({ error: 'Sondage introuvable.' });
    if (survey.status !== 'draft') return res.status(409).json({ error: 'Un sondage publié ne peut plus être modifié.' });
    const updated = createSurveyData(req.body, req.user.organization, req.user._id);
    survey.set({
      title: updated.title,
      description: updated.description,
      anonymous: updated.anonymous,
      startsAt: updated.startsAt,
      endsAt: updated.endsAt,
      questions: updated.questions,
    });
    await survey.save();
    res.json({ survey });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireRole('hr'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published', 'closed'].includes(status)) return res.status(400).json({ error: 'Statut de sondage invalide.' });
    const survey = await Survey.findOne({ _id: req.params.id, organization: req.user.organization });
    if (!survey) return res.status(404).json({ error: 'Sondage introuvable.' });
    if (survey.status !== 'draft' && status === 'draft') return res.status(409).json({ error: 'Un sondage publié ne peut pas redevenir un brouillon.' });
    if (survey.status === 'closed' && status === 'published') return res.status(409).json({ error: 'Un sondage clôturé ne peut pas être rouvert.' });
    survey.status = status;
    await survey.save();
    res.json({ survey });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/responses', requireRole('employee'), async (req, res, next) => {
  let participation;
  try {
    const survey = await Survey.findOne({ _id: req.params.id, organization: req.user.organization });
    if (!survey || !isSurveyOpen(survey)) return res.status(404).json({ error: 'Ce sondage n’est pas disponible.' });

    const validationError = validateAnswers(survey, req.body.answers);
    if (validationError) return res.status(400).json({ error: validationError });

    participation = await SurveyParticipation.create({
      survey: survey._id,
      user: req.user._id,
      organization: req.user.organization,
    });
    await SurveyResponse.create({
      survey: survey._id,
      organization: req.user.organization,
      answers: req.body.answers,
      respondent: responseIdentity(survey.anonymous, req.user._id),
    });
    res.status(201).json({ message: 'Votre réponse a bien été enregistrée.' });
  } catch (error) {
    if (participation) await SurveyParticipation.deleteOne({ _id: participation._id });
    if (error.code === 11000) return res.status(409).json({ error: 'Vous avez déjà répondu à ce sondage.' });
    next(error);
  }
});

router.get('/dashboard', requireRole('hr'), async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.user.organization).select('name minimumResponseThreshold');
    const [surveys, eligibleEmployees, activeSurveys, completedSurveys, totalActions, activeActions] = await Promise.all([
      Survey.find({ organization: req.user.organization }).sort({ createdAt: -1 }).limit(12).lean(),
      User.countDocuments({ organization: req.user.organization, role: 'employee', active: true }),
      Survey.countDocuments({ organization: req.user.organization, status: 'published' }),
      Survey.countDocuments({ organization: req.user.organization, status: 'closed' }),
      ImprovementAction.countDocuments({ organization: req.user.organization }),
      ImprovementAction.countDocuments({
        organization: req.user.organization,
        status: { $in: ['planned', 'in-progress'] },
      }),
    ]);

    const result = await Promise.all(surveys.map(async survey => {
      const [responseCount, participationCount] = await Promise.all([
        SurveyResponse.countDocuments({ survey: survey._id }),
        SurveyParticipation.countDocuments({ survey: survey._id }),
      ]);
      const visible = canReport(responseCount, organization.minimumResponseThreshold);
      return {
        id: survey._id,
        title: survey.title,
        status: survey.status,
        endsAt: survey.endsAt,
        anonymous: survey.anonymous,
        responseCount: visible ? responseCount : null,
        participationCount,
        participationRate: eligibleEmployees ? Math.round((participationCount / eligibleEmployees) * 100) : 0,
        eligibleEmployees,
        suppressed: !visible,
      };
    }));

    res.json({
      organization,
      metrics: {
        activeSurveys,
        completedSurveys,
        employees: eligibleEmployees,
        activeActions,
        totalActions,
      },
      surveys: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/results', requireRole('hr'), async (req, res, next) => {
  try {
    const survey = await Survey.findOne({ _id: req.params.id, organization: req.user.organization }).lean();
    if (!survey) return res.status(404).json({ error: 'Sondage introuvable.' });

    const [organization, responses] = await Promise.all([
      Organization.findById(req.user.organization).select('minimumResponseThreshold'),
      SurveyResponse.find({ survey: survey._id }).select('answers createdAt').lean(),
    ]);
    const threshold = organization.minimumResponseThreshold;
    if (!canReport(responses.length, threshold)) {
      return res.json({
        survey: { id: survey._id, title: survey.title, status: survey.status, anonymous: survey.anonymous },
        suppressed: true,
        threshold,
        message: `Les résultats restent masqués jusqu’à ${threshold} réponses admissibles.`,
      });
    }

    const participationCount = await SurveyParticipation.countDocuments({ survey: survey._id });
    res.json({
      survey: { id: survey._id, title: survey.title, status: survey.status, anonymous: survey.anonymous },
      suppressed: false,
      threshold,
      responseCount: responses.length,
      participationCount,
      questions: aggregateAnswers(survey, responses, threshold),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/analyze', requireRole('hr'), async (req, res, next) => {
  try {
    const survey = await Survey.findOne({ _id: req.params.id, organization: req.user.organization }).lean();
    if (!survey) return res.status(404).json({ error: 'Sondage introuvable.' });
    const [organization, responses] = await Promise.all([
      Organization.findById(req.user.organization).select('minimumResponseThreshold'),
      SurveyResponse.find({ survey: survey._id }).select('answers').lean(),
    ]);
    if (!canReport(responses.length, organization.minimumResponseThreshold)) {
      return res.status(403).json({ error: `L’analyse est indisponible avant ${organization.minimumResponseThreshold} réponses.` });
    }

    const comments = responses.flatMap(response => response.answers
      .filter(answer => answer.value && typeof answer.value === 'string')
      .map(answer => answer.value.trim())
      .filter(Boolean));
    if (!canReport(comments.length, organization.minimumResponseThreshold)) {
      return res.status(403).json({ error: 'Le nombre de commentaires écrits est insuffisant pour une analyse confidentielle.' });
    }

    const identities = await User.find({ organization: req.user.organization }).select('name +previousNames').lean();
    const privateNames = identities.flatMap(user => [user.name, ...user.previousNames]);
    const feedback = deidentifyFeedback(comments, privateNames);
    const analysis = await analyzeFeedback(feedback);
    const safeAnalysis = {
      ...analysis,
      summary: deidentifyFeedback([analysis.summary], privateNames)[0],
      themes: analysis.themes.map(theme => ({
        ...theme,
        name: deidentifyFeedback([theme.name], privateNames)[0],
        summary: deidentifyFeedback([theme.summary], privateNames)[0],
        recommendation: deidentifyFeedback([theme.recommendation], privateNames)[0],
      })),
    };
    const saved = await SurveyAnalysis.create({
      survey: survey._id,
      organization: req.user.organization,
      ...safeAnalysis,
    });
    res.status(201).json({ analysis: saved });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/analyses', requireRole('hr'), async (req, res, next) => {
  try {
    const survey = await Survey.exists({ _id: req.params.id, organization: req.user.organization });
    if (!survey) return res.status(404).json({ error: 'Sondage introuvable.' });
    const analyses = await SurveyAnalysis.find({ survey: req.params.id, organization: req.user.organization }).sort({ createdAt: -1 }).lean();
    res.json({ analyses });
  } catch (error) {
    next(error);
  }
});

router.post('/compare', requireRole('hr'), async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.surveyIds) ? [...new Set(req.body.surveyIds)].slice(0, 4) : [];
    if (ids.length < 2) return res.status(400).json({ error: 'Sélectionnez au moins deux sondages.' });
    const surveys = await Survey.find({ _id: { $in: ids }, organization: req.user.organization }).lean();
    if (surveys.length !== ids.length) return res.status(404).json({ error: 'Un sondage sélectionné est introuvable.' });
    const threshold = (await Organization.findById(req.user.organization).select('minimumResponseThreshold')).minimumResponseThreshold;
    const periods = await Promise.all(surveys.map(async survey => {
      const responses = await SurveyResponse.find({ survey: survey._id }).select('answers').lean();
      if (!canReport(responses.length, threshold)) return { id: survey._id, title: survey.title, suppressed: true, threshold };
      return {
        id: survey._id,
        title: survey.title,
        suppressed: false,
        responseCount: responses.length,
        questions: aggregateAnswers(survey, responses, threshold),
      };
    }));
    res.json({ periods });
  } catch (error) {
    next(error);
  }
});

export default router;
