export function deidentifyFeedback(comments, identities = []) {
  const names = identities
    .map(value => value.trim())
    .filter(value => value.length >= 3)
    .sort((a, b) => b.length - a.length);

  return comments
    .map(comment => {
      let text = comment;
      text = text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[adresse masquée]');
      text = text.replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[numéro masqué]');
      for (const name of names) {
        text = text.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi'), '[nom masqué]');
      }
      return text.slice(0, 2000);
    })
    .filter(Boolean);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function aggregateAnswers(survey, responses, threshold = 5) {
  return survey.questions.map(question => {
    const values = responses
      .flatMap(response => response.answers)
      .filter(answer => answer.questionId === question.id && answer.value !== null && answer.value !== '')
      .map(answer => answer.value);

    if (question.type === 'rating') {
      const numeric = values.filter(Number.isFinite);
      let distribution = Object.fromEntries(
        Array.from({ length: question.max - question.min + 1 }, (_, index) => [question.min + index, 0]),
      );
      numeric.forEach(value => { distribution[value] += 1; });
      const suppressed = numeric.length < threshold;
      distribution = Object.fromEntries(Object.entries(distribution).map(([value, count]) => [
        value,
        suppressed || (count > 0 && count < threshold) ? null : count,
      ]));
      return {
        questionId: question.id,
        label: question.label,
        type: question.type,
        min: question.min,
        max: question.max,
        count: suppressed ? null : numeric.length,
        average: suppressed ? null : Number((numeric.reduce((sum, value) => sum + value, 0) / numeric.length).toFixed(1)),
        suppressed,
        distribution,
      };
    }

    if (question.type === 'choice') {
      const distribution = Object.fromEntries(question.options.map(option => [option, 0]));
      values.forEach(value => { if (Object.hasOwn(distribution, value)) distribution[value] += 1; });
      const suppressed = values.length < threshold;
      const safeDistribution = Object.fromEntries(Object.entries(distribution).map(([option, count]) => [
        option,
        suppressed || (count > 0 && count < threshold) ? null : count,
      ]));
      return {
        questionId: question.id,
        label: question.label,
        type: question.type,
        count: suppressed ? null : values.length,
        suppressed,
        distribution: safeDistribution,
      };
    }

    const suppressed = values.length < threshold;
    return { questionId: question.id, label: question.label, type: question.type, count: suppressed ? null : values.length, suppressed };
  });
}
