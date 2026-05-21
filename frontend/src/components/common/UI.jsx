import React, { useEffect } from 'react';

// Modal
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-slide-up`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="font-display font-bold text-lg text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Status Badge
export const StatusBadge = ({ status }) => {
  const configs = {
    'todo': { cls: 'bg-slate-700/50 text-slate-300 border border-slate-600', label: 'To Do' },
    'in-progress': { cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30', label: 'In Progress' },
    'completed': { cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', label: 'Completed' },
    'active': { cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', label: 'Active' },
    'on-hold': { cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', label: 'On Hold' },
  };
  const { cls, label } = configs[status] || configs['todo'];
  return <span className={`badge ${cls}`}>{label}</span>;
};

// Priority Badge
export const PriorityBadge = ({ priority }) => {
  const configs = {
    low: { cls: 'bg-slate-700/50 text-slate-400 border border-slate-600', dot: 'bg-slate-400' },
    medium: { cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', dot: 'bg-amber-400' },
    high: { cls: 'bg-red-500/15 text-red-400 border border-red-500/30', dot: 'bg-red-400' },
  };
  const { cls, dot } = configs[priority] || configs.medium;
  return (
    <span className={`badge ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </span>
  );
};

// Loading Spinner
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-violet-500 border-t-transparent rounded-full animate-spin`} />
  );
};

// Empty State
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="font-display font-semibold text-lg text-slate-300 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm max-w-xs mb-6">{description}</p>
    {action}
  </div>
);

// Avatar
export const Avatar = ({ name, size = 'sm' }) => {
  const initial = name?.[0]?.toUpperCase() || '?';
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  const color = colors[initial.charCodeAt(0) % colors.length];
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  return (
    <div className={`${sizes[size]} ${color} rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initial}
    </div>
  );
};

// Confirm Dialog
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, danger = true }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-slate-400 text-sm mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
      <button
        onClick={() => { onConfirm(); onClose(); }}
        className={danger ? 'btn-danger text-sm' : 'btn-primary text-sm'}
      >
        Confirm
      </button>
    </div>
  </Modal>
);

// Stat Card
export const StatCard = ({ icon, label, value, sub, color = 'violet', trend }) => {
  const colors = {
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-500/20 text-violet-400',
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    red: 'from-red-600/20 to-red-600/5 border-red-500/20 text-red-400',
  };
  return (
    <div className={`card bg-gradient-to-br ${colors[color]} border hover:scale-[1.02] transition-transform duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        {trend !== undefined && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-display font-bold text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
};
