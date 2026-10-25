import { Router } from 'express';
import Organization from '../models/Organization.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.patch('/settings', requireRole('hr'), async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.minimumResponseThreshold !== undefined) {
      const threshold = Number(req.body.minimumResponseThreshold);
      if (!Number.isInteger(threshold) || threshold < 3 || threshold > 50) {
        return res.status(400).json({ error: 'Le seuil de confidentialité doit être compris entre 3 et 50.' });
      }
      updates.minimumResponseThreshold = threshold;
    }
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.trim().length > 100) {
        return res.status(400).json({ error: 'Le nom de l’organisation doit contenir entre 1 et 100 caractères.' });
      }
      updates.name = req.body.name.trim();
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Aucune modification à enregistrer.' });
    }
    const organization = await Organization.findByIdAndUpdate(
      req.user.organization,
      updates,
      { new: true, runValidators: true },
    ).select('name minimumResponseThreshold');
    res.json({ organization });
  } catch (error) {
    next(error);
  }
});

export default router;
