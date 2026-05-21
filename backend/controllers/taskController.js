const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create task
// @route   POST /api/tasks
// @access  Admin
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, project, priority, status, dueDate } = req.body;

    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ message: 'Project not found.' });

    // Check if assigned user is a project member
    if (assignedTo && !proj.members.includes(assignedTo)) {
      return res.status(400).json({ message: 'Assigned user is not a project member.' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      project,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate,
      createdBy: req.user._id,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('project', 'title')
      .populate('createdBy', 'name email');

    res.status(201).json({ message: 'Task created', task: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { project, status, priority, assignedTo, search } = req.query;
    let query = {};

    if (project) query.project = project;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Members see only their tasks unless filtered by admin
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'title')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('project', 'title members')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Check access for members
    if (
      req.user.role !== 'admin' &&
      task.assignedTo?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Admin
const updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('project', 'title')
      .populate('createdBy', 'name email');

    res.json({ message: 'Task updated', task: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task status (for members)
// @route   PATCH /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Members can only update their own tasks
    if (
      req.user.role !== 'admin' &&
      task.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'You can only update your own tasks.' });
    }

    task.status = status;
    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('project', 'title');

    res.json({ message: 'Status updated', task: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    await task.deleteOne();
    res.json({ message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty.' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Members can only comment on their tasks
    if (
      req.user.role !== 'admin' &&
      task.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    task.comments.push({ user: req.user._id, text: text.trim() });
    await task.save();

    const updated = await Task.findById(task._id)
      .populate('comments.user', 'name email');

    res.json({ message: 'Comment added', comments: updated.comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
};
