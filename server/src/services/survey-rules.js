export function isSurveyOpen(survey, now = Date.now()) {
  return survey.status === 'published'
    && new Date(survey.startsAt).getTime() <= now
    && new Date(survey.endsAt).getTime() >= now;
}

export function validateAnswers(survey, answers) {
  if (!Array.isArray(answers) || answers.length !== survey.questions.length) return 'Répondez à toutes les questions du sondage.';
  const submitted = new Map(answers.map(answer => [answer.questionId, answer.value]));
  if (submitted.size !== answers.length) return 'Une question ne peut être renseignée qu’une fois.';

  for (const question of survey.questions) {
    const value = submitted.get(question.id);
    if (question.required && (value === undefined || value === null || value === '')) {
      return 'Complétez les questions obligatoires.';
    }
    if (value === undefined || value === null || value === '') continue;
    if (question.type === 'rating' && (!Number.isInteger(value) || value < question.min || value > question.max)) {
      return 'Une note ne respecte pas l’échelle indiquée.';
    }
    if (question.type === 'choice' && !question.options.includes(value)) {
      return 'Une réponse ne fait pas partie des choix proposés.';
    }
    if (question.type === 'text' && (typeof value !== 'string' || value.length > 2000)) {
      return 'Un commentaire dépasse la longueur autorisée.';
    }
  }
  return null;
}

export function canReport(responseCount, threshold) {
  return Number.isInteger(responseCount) && responseCount >= threshold;
}

export function responseIdentity(anonymous, userId) {
  return anonymous ? null : userId;
}
