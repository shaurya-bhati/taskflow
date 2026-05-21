import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal, StatusBadge, Spinner, EmptyState, Avatar, ConfirmDialog } from '../components/common/UI';
import { format, formatDistanceToNow, isPast } from 'date-fns';

const ProjectCard = ({ project, isAdmin, onDelete, onEdit }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const deadline = project.deadline ? new Date(project.deadline) : null;
  const isOverdue = deadline && isPast(deadline) && project.status !== 'completed';
  const progress = project.taskStats?.total > 0
    ? Math.round((project.taskStats.completed / project.taskStats.total) * 100)
    : 0;

  return (
    <>
      <div className="card hover:border-slate-600 transition-all duration-200 group flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <StatusBadge status={project.status} />
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(project)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors text-xs">✎</button>
              <button onClick={() => setShowConfirm(true)} className="p-1.5 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs">✕</button>
            </div>
          )}
        </div>

        <Link to={`/projects/${project._id}`} className="flex-1">
          <h3 className="font-display font-semibold text-white text-lg mb-2 group-hover:text-violet-400 transition-colors line-clamp-1">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-slate-500 text-sm mb-4 line-clamp-2">{project.description}</p>
          )}
        </Link>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>{project.taskStats?.completed || 0} / {project.taskStats?.total || 0} tasks</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {project.members?.slice(0, 5).map((m) => (
              <div key={m._id} title={m.name}>
                <Avatar name={m.name} size="sm" />
              </div>
            ))}
            {project.members?.length > 5 && (
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                +{project.members.length - 5}
              </div>
            )}
          </div>
          {deadline && (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
              {isOverdue ? '⚠ Overdue' : `Due ${format(deadline, 'MMM d')}`}
            </span>
          )}
        </div>

        {project.taskStats?.overdue > 0 && (
          <div className="mt-3 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5 border border-red-500/20">
            {project.taskStats.overdue} overdue task{project.taskStats.overdue > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => onDelete(project._id)}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.title}"? This will also delete all associated tasks.`}
      />
    </>
  );
};

const ProjectForm = ({ onSubmit, initialData, users, loading }) => {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    deadline: initialData?.deadline ? initialData.deadline.slice(0, 10) : '',
    members: initialData?.members?.map((m) => m._id || m) || [],
    status: initialData?.status || 'active',
  });

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      members: f.members.includes(id) ? f.members.filter((m) => m !== id) : [...f.members, id],
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="label">Project Title *</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Website Redesign" required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's this project about?" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Deadline</label>
          <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Team Members</label>
        <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-900/50 rounded-xl p-2 border border-slate-700">
          {users.map((u) => (
            <label key={u._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={form.members.includes(u._id)}
                onChange={() => toggleMember(u._id)}
                className="accent-violet-500"
              />
              <Avatar name={u.name} size="sm" />
              <div>
                <p className="text-sm text-slate-200">{u.name}</p>
                <p className="text-xs text-slate-500 capitalize">{u.role}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Saving...' : (initialData ? 'Update Project' : 'Create Project')}
        </button>
      </div>
    </form>
  );
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      const [pRes, uRes] = await Promise.all([projectAPI.getAll(), userAPI.getAll()]);
      setProjects(pRes.data.projects);
      setUsers(uRes.data.users);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const res = await projectAPI.create(form);
      setProjects((p) => [res.data.project, ...p]);
      setShowModal(false);
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      const res = await projectAPI.update(editProject._id, form);
      setProjects((p) => p.map((x) => x._id === editProject._id ? res.data.project : x));
      setEditProject(null);
      toast.success('Project updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await projectAPI.delete(id);
      setProjects((p) => p.filter((x) => x._id !== id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-36"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex-shrink-0">
            + New Project
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-slate-500 text-sm">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="◫"
          title="No projects found"
          description={search ? 'Try a different search term' : 'Create your first project to get started'}
          action={isAdmin && !search ? (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + New Project
            </button>
          ) : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onEdit={(proj) => setEditProject(proj)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Project" size="lg">
        <ProjectForm onSubmit={handleCreate} users={users} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project" size="lg">
        {editProject && (
          <ProjectForm onSubmit={handleUpdate} initialData={editProject} users={users} loading={saving} />
        )}
      </Modal>
    </div>
  );
}
