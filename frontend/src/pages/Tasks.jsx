import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { taskAPI, projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge, Spinner, EmptyState, Avatar, Modal, ConfirmDialog } from '../components/common/UI';
import { format, isPast } from 'date-fns';

const TaskCard = ({ task, isAdmin, onStatusChange, onDelete, onEdit, onComment }) => {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';

  return (
    <div className={`card hover:border-slate-600 transition-all duration-200 group ${isOverdue ? 'border-red-500/30' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <PriorityBadge priority={task.priority} />
            {isOverdue && <span className="badge bg-red-500/15 text-red-400 border border-red-500/30">⚠ Overdue</span>}
          </div>
          <h3 className="font-medium text-white text-base line-clamp-2 mt-2">{task.title}</h3>
        </div>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-700 hover:text-slate-300 text-xs transition-colors">✎</button>
            <button onClick={() => onDelete(task._id)} className="p-1.5 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 text-xs transition-colors">✕</button>
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-slate-500 text-sm mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        {task.assignedTo ? (
          <div className="flex items-center gap-2">
            <Avatar name={task.assignedTo.name} size="sm" />
            <span className="text-xs text-slate-500 truncate">{task.assignedTo.name}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-600">Unassigned</span>
        )}
        {task.dueDate && (
          <span className={`text-xs flex-shrink-0 ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
        <span className="text-xs text-slate-500 truncate">{task.project?.title}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onComment(task)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            title="Comments"
          >
            💬 {task.comments?.length || 0}
          </button>
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
        </div>
      </div>
    </div>
  );
};

const CommentModal = ({ task, onClose, onAdd }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    try {
      await onAdd(task._id, comment);
      setComment('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!task} onClose={onClose} title={`Comments — ${task?.title}`} size="md">
      <div className="max-h-60 overflow-y-auto space-y-3 mb-4">
        {task?.comments?.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No comments yet</p>
        ) : (
          task?.comments?.map((c, i) => (
            <div key={i} className="flex gap-3">
              <Avatar name={c.user?.name || 'U'} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-300">{c.user?.name}</span>
                  <span className="text-xs text-slate-600">{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                </div>
                <p className="text-sm text-slate-400">{c.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input flex-1"
          placeholder="Add a comment..."
        />
        <button type="submit" disabled={loading || !comment.trim()} className="btn-primary">
          Send
        </button>
      </form>
    </Modal>
  );
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [commentTask, setCommentTask] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', project: 'all' });
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    title: '', description: '', project: '', assignedTo: '',
    priority: 'medium', status: 'todo', dueDate: ''
  });

  const fetchData = async () => {
    try {
      const [tRes, pRes, uRes] = await Promise.all([
        taskAPI.getAll(),
        projectAPI.getAll(),
        userAPI.getAll(),
      ]);
      setTasks(tRes.data.tasks);
      setProjects(pRes.data.projects);
      setUsers(uRes.data.users);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await taskAPI.create(form);
      setTasks((t) => [res.data.task, ...t]);
      setShowModal(false);
      setForm({ title: '', description: '', project: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
      toast.success('Task created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await taskAPI.update(editTask._id, form);
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
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async () => {
    try {
      await taskAPI.delete(deleteId);
      setTasks((t) => t.filter((x) => x._id !== deleteId));
      setDeleteId(null);
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleAddComment = async (taskId, text) => {
    try {
      const res = await taskAPI.addComment(taskId, text);
      setTasks((t) => t.map((x) => x._id === taskId ? { ...x, comments: res.data.comments } : x));
      setCommentTask((c) => c ? { ...c, comments: res.data.comments } : c);
      toast.success('Comment added');
    } catch { toast.error('Failed to add comment'); }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title, description: task.description || '',
      project: task.project?._id || '', assignedTo: task.assignedTo?._id || '',
      priority: task.priority, status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
    });
  };

  const projectMembers = users.filter((u) => {
    if (!form.project) return true;
    const proj = projects.find((p) => p._id === form.project);
    return proj?.members?.some((m) => (m._id || m) === u._id);
  });

  const filtered = tasks.filter((t) => {
    const s = filters.status === 'all' || t.status === filters.status;
    const p = filters.priority === 'all' || t.priority === filters.priority;
    const proj = filters.project === 'all' || t.project?._id === filters.project;
    const q = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return s && p && proj && q;
  });

  const TaskForm = ({ onSubmit, isEdit }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Task Title *</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Design homepage mockup" required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details..." />
      </div>
      {!isEdit && (
        <div>
          <label className="label">Project *</label>
          <select className="input" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value, assignedTo: '' })} required>
            <option value="">Select project</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Assign To</label>
          <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">Unassigned</option>
            {projectMembers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
        {saving ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task')}
      </button>
    </form>
  );

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input max-w-xs"
          />
          {['status', 'priority'].map((key) => (
            <select
              key={key}
              value={filters[key]}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              className="input w-36"
            >
              <option value="all">All {key.charAt(0).toUpperCase() + key.slice(1)}</option>
              {key === 'status'
                ? ['todo', 'in-progress', 'completed'].map((v) => <option key={v} value={v}>{v === 'in-progress' ? 'In Progress' : v === 'todo' ? 'To Do' : 'Completed'}</option>)
                : ['low', 'medium', 'high'].map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)
              }
            </select>
          ))}
          {isAdmin && (
            <select
              value={filters.project}
              onChange={(e) => setFilters({ ...filters, project: e.target.value })}
              className="input w-44"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-violet-600/20 text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}>⊞</button>
            <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-violet-600/20 text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}>☰</button>
            {isAdmin && (
              <button onClick={() => { setForm({ title: '', description: '', project: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' }); setShowModal(true); }} className="btn-primary">
                + New Task
              </button>
            )}
          </div>
        </div>
        <p className="text-slate-500 text-sm">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Tasks */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="✓"
          title="No tasks found"
          description={search ? 'Try a different search' : 'No tasks match the current filters'}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              isAdmin={isAdmin}
              onStatusChange={handleStatusChange}
              onDelete={(id) => setDeleteId(id)}
              onEdit={openEdit}
              onComment={setCommentTask}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t._id} className="flex items-center gap-3 p-3.5 card hover:border-slate-600 transition-all group">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-200">{t.title}</span>
                <span className="text-xs text-slate-500 ml-2">{t.project?.title}</span>
              </div>
              {t.assignedTo && <Avatar name={t.assignedTo.name} size="sm" />}
              <PriorityBadge priority={t.priority} />
              {isAdmin ? (
                <select value={t.status} onChange={(e) => handleStatusChange(t._id, e.target.value)} className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none">
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              ) : <StatusBadge status={t.status} />}
              {t.dueDate && <span className="text-xs text-slate-500 hidden md:block">{format(new Date(t.dueDate), 'MMM d')}</span>}
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded text-slate-500 hover:text-slate-300 text-xs">✎</button>
                  <button onClick={() => setDeleteId(t._id)} className="p-1.5 rounded text-slate-500 hover:text-red-400 text-xs">✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Task">
        <TaskForm onSubmit={handleCreate} isEdit={false} />
      </Modal>
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task">
        <TaskForm onSubmit={handleUpdate} isEdit={true} />
      </Modal>
      <CommentModal
        task={commentTask}
        onClose={() => setCommentTask(null)}
        onAdd={handleAddComment}
      />
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
}
