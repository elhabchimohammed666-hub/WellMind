import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import Survey from '../src/models/Survey.js';
import SurveyResponse from '../src/models/SurveyResponse.js';
import SurveyParticipation from '../src/models/SurveyParticipation.js';
import ImprovementAction from '../src/models/ImprovementAction.js';

if (!process.env.MONGODB_URI) throw new Error('Configurez MONGODB_URI dans server/.env avant de charger les exemples.');

const employees = [
  ['Léa Martin', 'lea@atlas.example', 'Design'],
  ['Yanis Bernard', 'yanis@atlas.example', 'Produit'],
  ['Inès Robert', 'ines@atlas.example', 'Ingénierie'],
  ['Hugo Petit', 'hugo@atlas.example', 'Ingénierie'],
  ['Emma Durand', 'emma@atlas.example', 'Design'],
  ['Noé Moreau', 'noe@atlas.example', 'Produit'],
  ['Mila Laurent', 'mila@atlas.example', 'Marketing'],
  ['Adam Simon', 'adam@atlas.example', 'Marketing'],
];
const feedback = [
  [4, 'Oui', 'Les priorités sont généralement claires, mais les changements arrivent parfois tard.'],
  [3, 'Oui', 'Les collègues s’entraident ; mieux anticiper les demandes urgentes aiderait toute l’équipe.'],
  [4, 'Oui', 'La collaboration est agréable. La charge varie beaucoup selon les projets.'],
  [2, 'Non', 'Il arrive que plusieurs urgences se chevauchent sans savoir quoi reporter.'],
  [5, 'Oui', 'Les échanges entre équipes sont constructifs et les objectifs sont compréhensibles.'],
  [3, 'Oui', 'Un point hebdomadaire sur les priorités simplifierait notre organisation.'],
  [4, 'Oui', 'L’ambiance est positive, même si les délais gagneraient à être partagés plus tôt.'],
];

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const organization = await Organization.findOneAndUpdate(
    { name: 'Atlas Digital' },
    { $setOnInsert: { name: 'Atlas Digital', minimumResponseThreshold: 5 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const passwordHash = await bcrypt.hash('WellMind2026!', 12);
  const hr = await User.findOneAndUpdate(
    { email: 'rh@atlas.example', organization: organization._id },
    { $set: { name: 'Camille Bernard', passwordHash, role: 'hr', active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const users = [];
  for (const [name, email, department] of employees) {
    users.push(await User.findOneAndUpdate(
      { email, organization: organization._id },
      { $set: { name, email, passwordHash, role: 'employee', department, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ));
  }

  const definitions = [
    {
      title: 'Le quotidien au travail',
      description: 'Un court point pour mieux comprendre les priorités, la collaboration et le quotidien de l’équipe.',
      status: 'published',
      anonymous: true,
      endsAt: new Date(Date.now() + 21 * 86400000),
      questions: [
        { id: 'priorities', label: 'Les priorités de mon travail sont claires.', type: 'rating', min: 1, max: 5, required: true, options: [] },
        { id: 'collaboration', label: 'Comment décririez-vous la collaboration dans votre équipe ?', type: 'choice', options: ['Très bonne', 'Bonne', 'À améliorer'], required: true, min: 1, max: 5 },
        { id: 'feedback', label: 'Y a-t-il une chose que nous pourrions améliorer ?', type: 'text', required: false, options: [], min: 1, max: 5 },
      ],
      answers: feedback,
    },
    {
      title: 'Écoute et communication',
      description: 'Un retour sur la qualité des échanges et la circulation de l’information.',
      status: 'closed',
      anonymous: true,
      endsAt: new Date(Date.now() - 12 * 86400000),
      questions: [
        { id: 'communication', label: 'Je reçois les informations dont j’ai besoin à temps.', type: 'rating', min: 1, max: 5, required: true, options: [] },
        { id: 'feedback', label: 'Que faudrait-il améliorer dans notre communication ?', type: 'text', required: false, options: [], min: 1, max: 5 },
      ],
      answers: [
        [3, '', 'Les décisions arrivent parfois après la réunion où elles ont été prises.'],
        [4, '', 'Les échanges au sein de l’équipe sont clairs et respectueux.'],
        [3, '', 'Un récapitulatif écrit après les changements serait utile.'],
        [4, '', 'Nous avons de bonnes habitudes de partage de l’information.'],
        [2, '', 'Les changements de priorité ne sont pas toujours annoncés aux bonnes personnes.'],
        [4, '', 'Le dialogue au sein de l’équipe fonctionne bien.'],
        [3, '', 'Plus de visibilité sur les décisions aiderait à planifier les tâches.'],
      ],
    },
  ];

  const surveys = [];
  for (const definition of definitions) {
    const { answers, ...surveyFields } = definition;
    let survey = await Survey.findOne({ title: definition.title, organization: organization._id });
    if (!survey) {
      survey = await Survey.create({
        ...surveyFields,
        startsAt: new Date(Date.now() - 30 * 86400000),
        organization: organization._id,
        createdBy: hr._id,
      });
    }
    surveys.push({ survey, answers });
    for (let index = 0; index < Math.min(users.length, answers.length); index += 1) {
      const user = users[index];
      const existing = await SurveyParticipation.exists({ survey: survey._id, user: user._id });
      if (existing) continue;
      await SurveyParticipation.create({ survey: survey._id, user: user._id, organization: organization._id });
      await SurveyResponse.create({
        survey: survey._id,
        organization: organization._id,
        respondent: null,
        answers: survey.questions.map((question, questionIndex) => ({
          questionId: question.id,
          value: answers[index][questionIndex] || null,
        })),
      });
    }
  }

  const action = await ImprovementAction.findOne({ title: 'Clarifier les priorités de la semaine', organization: organization._id });
  if (!action) {
    await ImprovementAction.create({
      title: 'Clarifier les priorités de la semaine',
      objective: 'Partager les priorités et les arbitrages de la semaine pour faciliter la planification du travail.',
      theme: 'Organisation du travail',
      status: 'in-progress',
      owner: users[1]._id,
      ownerName: users[1].name,
      dueDate: new Date(Date.now() + 10 * 86400000),
      sharedWithEmployees: true,
      organization: organization._id,
      createdBy: hr._id,
      notes: [{ text: 'Première réunion de priorisation organisée avec les responsables d’équipe.', authorName: hr.name }],
    });
  }

  console.log(`Données de démonstration prêtes : ${organization.name}, ${users.length} collaborateurs, ${surveys.length} sondages.`);
  console.log('Connexion RH : rh@atlas.example / WellMind2026!');
  console.log('Connexion collaborateur : lea@atlas.example / WellMind2026!');
} finally {
  await mongoose.disconnect();
}
