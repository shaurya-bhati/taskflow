const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getProjects);
router.get('/:id', getProject);

router.post(
  '/',
  adminOnly,
  [body('title').trim().notEmpty().withMessage('Project title is required')],
  validate,
  createProject
);

router.put('/:id', adminOnly, updateProject);
router.delete('/:id', adminOnly, deleteProject);
router.post('/:id/members', adminOnly, addMember);
router.delete('/:id/members/:userId', adminOnly, removeMember);

module.exports = router;
