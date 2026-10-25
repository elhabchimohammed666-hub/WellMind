export function errorHandler(error, _req, res, _next) {
  console.error('WellMind API error:', error.name, error.status || 500);
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: 'Les données fournies sont invalides.' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: 'Cette ressource existe déjà.' });
  }
  res.status(error.status || 500).json({
    error: error.status ? error.message : 'Une erreur serveur est survenue.',
  });
}
