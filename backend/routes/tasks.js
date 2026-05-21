const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTask);

router.post(
  '/',
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  validate,
  createTask
);

router.put('/:id', adminOnly, updateTask);
router.delete('/:id', adminOnly, deleteTask);

router.patch(
  '/:id/status',
  [body('status').isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status')],
  validate,
  updateTaskStatus
);

router.post('/:id/comments', addComment);

module.exports = router;
