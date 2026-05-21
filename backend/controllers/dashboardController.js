const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const now = new Date();

    let taskQuery = {};
    let projectQuery = {};

    if (!isAdmin) {
      taskQuery.assignedTo = req.user._id;
      projectQuery.members = req.user._id;
    }

    const [totalProjects, totalTasks, completedTasks, overdueTasks, recentTasks] =
      await Promise.all([
        Project.countDocuments(projectQuery),
        Task.countDocuments(taskQuery),
        Task.countDocuments({ ...taskQuery, status: 'completed' }),
        Task.countDocuments({
          ...taskQuery,
          status: { $ne: 'completed' },
          dueDate: { $lt: now },
        }),
        Task.find(taskQuery)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('assignedTo', 'name')
          .populate('project', 'title')
          .populate('createdBy', 'name'),
      ]);

    const inProgressTasks = await Task.countDocuments({
      ...taskQuery,
      status: 'in-progress',
    });

    const todoTasks = await Task.countDocuments({ ...taskQuery, status: 'todo' });

    // Task by priority
    const [highPriority, mediumPriority, lowPriority] = await Promise.all([
      Task.countDocuments({ ...taskQuery, priority: 'high' }),
      Task.countDocuments({ ...taskQuery, priority: 'medium' }),
      Task.countDocuments({ ...taskQuery, priority: 'low' }),
    ]);

    // Recent projects
    const recentProjects = await Project.find(projectQuery)
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('members', 'name email')
      .populate('createdBy', 'name');

    // Team members (admin only)
    let teamStats = null;
    if (isAdmin) {
      const totalUsers = await User.countDocuments();
      const admins = await User.countDocuments({ role: 'admin' });
      teamStats = { total: totalUsers, admins, members: totalUsers - admins };
    }

    res.json({
      stats: {
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks,
        inProgressTasks,
        todoTasks,
      },
      priority: { high: highPriority, medium: mediumPriority, low: lowPriority },
      recentTasks,
      recentProjects,
      teamStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
