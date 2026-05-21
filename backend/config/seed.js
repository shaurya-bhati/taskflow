const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Clear existing
  await User.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});

  // Create users
  const adminPass = await bcrypt.hash('admin123', 10);
  const memberPass = await bcrypt.hash('member123', 10);

  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@taskmanager.com',
    password: adminPass,
    role: 'admin',
  });

  const member1 = await User.create({
    name: 'Sam Developer',
    email: 'sam@taskmanager.com',
    password: memberPass,
    role: 'member',
  });

  const member2 = await User.create({
    name: 'Jordan Designer',
    email: 'jordan@taskmanager.com',
    password: memberPass,
    role: 'member',
  });

  // Create projects
  const proj1 = await Project.create({
    title: 'Website Redesign',
    description: 'Complete overhaul of company website with modern design and improved UX.',
    members: [admin._id, member1._id, member2._id],
    createdBy: admin._id,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const proj2 = await Project.create({
    title: 'Mobile App Development',
    description: 'Build cross-platform mobile app for iOS and Android.',
    members: [admin._id, member1._id],
    createdBy: admin._id,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  });

  // Create tasks
  await Task.insertMany([
    {
      title: 'Design homepage mockup',
      description: 'Create wireframes and high-fidelity mockups for the new homepage.',
      assignedTo: member2._id,
      project: proj1._id,
      priority: 'high',
      status: 'in-progress',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment.',
      assignedTo: member1._id,
      project: proj1._id,
      priority: 'medium',
      status: 'todo',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    },
    {
      title: 'Database schema design',
      description: 'Design and document the MongoDB schema for all collections.',
      assignedTo: member1._id,
      project: proj2._id,
      priority: 'high',
      status: 'completed',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    },
    {
      title: 'API integration',
      description: 'Integrate third-party payment APIs.',
      assignedTo: member1._id,
      project: proj2._id,
      priority: 'high',
      status: 'todo',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // overdue
      createdBy: admin._id,
    },
    {
      title: 'User testing',
      description: 'Conduct user testing sessions and gather feedback.',
      assignedTo: member2._id,
      project: proj1._id,
      priority: 'low',
      status: 'todo',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    },
  ]);

  console.log('✅ Seed data inserted successfully!');
  console.log('Admin login: admin@taskmanager.com / admin123');
  console.log('Member login: sam@taskmanager.com / member123');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
