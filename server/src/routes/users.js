import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole('hr'), async (req, res, next) => {
  try {
    const users = await User.find({ organization: req.user.organization, active: true, role: 'employee' })
      .select('name email role department createdAt')
      .sort({ name: 1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('hr'), async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;
    if (![name, email, password].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ error: 'Nom, e-mail et mot de passe sont obligatoires.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
      return res.status(400).json({ error: 'Utilisez une adresse valide et un mot de passe d’au moins 10 caractères.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      role: 'employee',
      department: typeof department === 'string' ? department : '',
      organization: req.user.organization,
    });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
