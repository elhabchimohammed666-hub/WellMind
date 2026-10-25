import { Router } from 'express';
import ImprovementAction from '../models/ImprovementAction.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const query = { organization: req.user.organization };
    if (req.user.role === 'employee') query.sharedWithEmployees = true;
    const actions = await ImprovementAction.find(query)
      .populate('owner', 'name department')
      .sort({ dueDate: 1, createdAt: -1 });
    res.json({ actions });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('hr'), async (req, res, next) => {
  try {
    const { title, objective, theme, owner, dueDate, sharedWithEmployees } = req.body;
    if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Le titre de l’action est obligatoire.' });
    let ownerUser = null;
    if (owner) {
      ownerUser = await User.findOne({ _id: owner, organization: req.user.organization, active: true }).select('name');
      if (!ownerUser) return res.status(400).json({ error: 'Le responsable sélectionné est introuvable.' });
    }
    const action = await ImprovementAction.create({
      title,
      objective: typeof objective === 'string' ? objective : '',
      theme: typeof theme === 'string' ? theme : '',
      owner: ownerUser?._id || null,
      ownerName: ownerUser?.name || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      sharedWithEmployees: sharedWithEmployees === true,
      organization: req.user.organization,
      createdBy: req.user._id,
    });
    res.status(201).json({ action });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireRole('hr'), async (req, res, next) => {
  try {
    const allowed = ['title', 'objective', 'theme', 'status', 'dueDate', 'sharedWithEmployees'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.status && !['planned', 'in-progress', 'completed', 'cancelled'].includes(updates.status)) {
      return res.status(400).json({ error: 'Statut d’action invalide.' });
    }
    if (req.body.owner !== undefined) {
      const owner = req.body.owner
        ? await User.findOne({ _id: req.body.owner, organization: req.user.organization, active: true }).select('name')
        : null;
      if (req.body.owner && !owner) return res.status(400).json({ error: 'Le responsable sélectionné est introuvable.' });
      updates.owner = owner?._id || null;
      updates.ownerName = owner?.name || '';
    }
    const action = await ImprovementAction.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization },
      updates,
      { new: true, runValidators: true },
    ).populate('owner', 'name department');
    if (!action) return res.status(404).json({ error: 'Action introuvable.' });
    res.json({ action });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/notes', requireRole('hr'), async (req, res, next) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Le contenu de la note est obligatoire.' });
    const action = await ImprovementAction.findOne({ _id: req.params.id, organization: req.user.organization });
    if (!action) return res.status(404).json({ error: 'Action introuvable.' });
    action.notes.push({ text: text.trim(), authorName: req.user.name });
    await action.save();
    res.status(201).json({ action });
  } catch (error) {
    next(error);
  }
});

export default router;
