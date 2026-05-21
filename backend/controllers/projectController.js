const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Create project
// @route   POST /api/projects
// @access  Admin
const createProject = async (req, res) => {
  try {
    const { title, description, deadline, members } = req.body;

    // Validate members exist
    if (members && members.length > 0) {
      const validUsers = await User.find({ _id: { $in: members } });
      if (validUsers.length !== members.length) {
        return res.status(400).json({ message: 'One or more members not found.' });
      }
    }

    const project = await Project.create({
      title,
      description,
      deadline,
      members: members || [req.user._id],
      createdBy: req.user._id,
    });

    const populated = await Project.findById(project._id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    res.status(201).json({ message: 'Project created', project: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    let query = {};

    // Members see only projects they belong to
    if (req.user.role !== 'admin') {
      query = { members: req.user._id };
    }

    const projects = await Project.find(query)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Add task stats per project
    const projectsWithStats = await Promise.all(
      projects.map(async (proj) => {
        const tasks = await Task.find({ project: proj._id });
        const completed = tasks.filter((t) => t.status === 'completed').length;
        const overdue = tasks.filter(
          (t) =>
            t.status !== 'completed' && t.dueDate && new Date() > new Date(t.dueDate)
        ).length;
        return {
          ...proj.toObject(),
          taskStats: { total: tasks.length, completed, overdue },
        };
      })
    );

    res.json({ projects: projectsWithStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Check access
    if (
      req.user.role !== 'admin' &&
      !project.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Admin
const updateProject = async (req, res) => {
  try {
    const { title, description, deadline, members, status } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    project.title = title || project.title;
    project.description = description !== undefined ? description : project.description;
    project.deadline = deadline !== undefined ? deadline : project.deadline;
    project.status = status || project.status;
    if (members) project.members = members;

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    res.json({ message: 'Project updated', project: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Admin
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();

    res.json({ message: 'Project and associated tasks deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Admin
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User already in project.' });
    }

    project.members.push(userId);
    await project.save();

    const updated = await Project.findById(project._id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    res.json({ message: 'Member added', project: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Admin
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();

    const updated = await Project.findById(project._id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    res.json({ message: 'Member removed', project: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
