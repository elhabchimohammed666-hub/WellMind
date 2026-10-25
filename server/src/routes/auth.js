import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function publicUser(user, organizationName) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    organization: user.organization,
    organizationName: organizationName || user.organization?.name || '',
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const { organizationName, name, email, password } = req.body;
    if (![organizationName, name, email, password].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
      return res.status(400).json({ error: 'Utilisez une adresse valide et un mot de passe d’au moins 10 caractères.' });
    }
    if (await User.exists({ email: email.toLowerCase() })) {
      return res.status(409).json({ error: 'Cette adresse e-mail possède déjà un espace WellMind.' });
    }

    const organization = await Organization.create({ name: organizationName });
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      role: 'hr',
      organization: organization._id,
    });
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.status(201).json({ token, user: publicUser(user, organization.name) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Adresse e-mail et mot de passe requis.' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), active: true }).populate('organization', 'name');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Adresse e-mail ou mot de passe incorrect.' });
    }

    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.user.organization).select('name minimumResponseThreshold');
    res.json({ user: publicUser(req.user), organization });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 100)) {
      return res.status(400).json({ error: 'Le nom doit contenir entre 1 et 100 caractères.' });
    }
    if (email !== undefined && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
      return res.status(400).json({ error: 'Adresse e-mail invalide.' });
    }

    const updates = {};
    if (name !== undefined && name.trim() !== req.user.name) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucune modification à enregistrer.' });
    if (updates.email && await User.exists({ email: updates.email, _id: { $ne: req.user._id } })) {
      return res.status(409).json({ error: 'Cette adresse e-mail est déjà utilisée.' });
    }

    const update = { $set: updates };
    if (updates.name) update.$addToSet = { previousNames: req.user.name };
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, organization: req.user.organization },
      update,
      { new: true, runValidators: true },
    ).select('-passwordHash').populate('organization', 'name');
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
