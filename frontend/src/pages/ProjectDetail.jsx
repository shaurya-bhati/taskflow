import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectAPI, taskAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge, Spinner, Avatar, Modal, ConfirmDialog } from '../components/common/UI';
import { format, isPast } from 'date-fns';

const TaskRow = ({ task, isAdmin, onStatusChange, onDelete, onEdit }) => {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600 transition-all group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-200 truncate">{task.title}</span>
          {isOverdue && <span className="text-xs text-red-400">⚠ Overdue</span>}
        </div>
        {task.assignedTo && (
          <div className="flex items-center gap-1.5 mt-1">
            <Avatar name={task.assignedTo.name} size="sm" />
            <span className="text-xs text-slate-500">{task.assignedTo.name}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <PriorityBadge priority={task.priority} />
        {isAdmin ? (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        ) : (
          <StatusBadge status={task.status} />
        )}
        {task.dueDate && (
          <span className={`text-xs hidden md:block ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(task)} className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 text-xs transition-colors">✎</button>
            <button onClick={() => onDelete(task._id)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 text-xs transition-colors">✕</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, tRes, uRes] = await Promise.all([
          projectAPI.getOne(id),
          taskAPI.getAll({ project: id }),
          userAPI.getAll(),
        ]);
        setProject(pRes.data.project);
        setTasks(tRes.data.tasks);
        setUsers(uRes.data.users);
      } catch (err) {
        toast.error('Failed to load project');
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await taskAPI.create({ ...taskForm, project: id });
      setTasks((t) => [res.data.task, ...t]);
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
      toast.success('Task created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await taskAPI.update(editTask._id, taskForm);
      setTasks((t) => t.map((x) => x._id === editTask._id ? res.data.task : x));
      setEditTask(null);
      toast.success('Task updated!');
    } catch (err) {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await taskAPI.updateStatus(taskId, status);
      setTasks((t) => t.map((x) => x._id === taskId ? res.data.task : x));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskAPI.delete(taskId);
      setTasks((t) => t.filter((x) => x._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    });
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!project) return null;

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  const projectMembers = users.filter((u) => project.members.some((m) => (m._id || m) === u._id));

  const TaskModal = ({ isEdit }) => (
    <Modal
      isOpen={isEdit ? !!editTask : showTaskModal}
      onClose={() => isEdit ? setEditTask(null) : setShowTaskModal(false)}
      title={isEdit ? 'Edit Task' : 'New Task'}
      size="md"
    >
      <form onSubmit={isEdit ? handleUpdateTask : handleCreateTask} className="space-y-4">
        <div>
          <label className="label">Task Title *</label>
          <input className="input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Implement login flow" required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Details..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Priority</label>
            <select className="input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Assign To</label>
            <select className="input" value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              {projectMembers.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
          {saving ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task')}
        </button>
      </form>
    </Modal>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/projects" className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors flex-shrink-0 mt-1">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h2 className="font-display font-bold text-2xl text-white">{project.title}</h2>
            <StatusBadge status={project.status} />
          </div>
          {project.description && <p className="text-slate-400 text-sm">{project.description}</p>}
        </div>
        {isAdmin && (
          <button onClick={() => setShowTaskModal(true)} className="btn-primary flex-shrink-0">
            + Add Task
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Total Tasks', v: tasks.length },
          { l: 'Completed', v: completed },
          { l: 'In Progress', v: tasks.filter((t) => t.status === 'in-progress').length },
          { l: 'Overdue', v: tasks.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'completed').length },
        ].map(({ l, v }) => (
          <div key={l} className="card text-center py-4">
            <p className="font-display font-bold text-2xl text-white">{v}</p>
            <p className="text-xs text-slate-500 mt-1">{l}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-white">Tasks</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span>{progress}%</span>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-2xl mb-3">✓</p>
              <p className="text-slate-400">No tasks yet</p>
              {isAdmin && <button onClick={() => setShowTaskModal(true)} className="btn-primary mt-4">Add First Task</button>}
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  isAdmin={isAdmin}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                  onEdit={openEdit}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Project info */}
          <div className="card">
            <h4 className="font-display font-semibold text-white mb-4">Project Info</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Created by</span>
                <span className="text-slate-300">{project.createdBy?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-300">{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
              </div>
              {project.deadline && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Deadline</span>
                  <span className={`${isPast(new Date(project.deadline)) ? 'text-red-400' : 'text-slate-300'}`}>
                    {format(new Date(project.deadline), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="card">
            <h4 className="font-display font-semibold text-white mb-4">
              Team ({project.members?.length || 0})
            </h4>
            <div className="space-y-2.5">
              {project.members?.map((m) => (
                <div key={m._id} className="flex items-center gap-3">
                  <Avatar name={m.name} size="sm" />
                  <div>
                    <p className="text-sm text-slate-200">{m.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <TaskModal isEdit={false} />
      <TaskModal isEdit={true} />
    </div>
  );
}
