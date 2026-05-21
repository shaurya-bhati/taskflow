import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
      ${isActive
        ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initial = user?.name?.[0]?.toUpperCase() || 'U';
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
  const color = colors[initial.charCodeAt(0) % colors.length];

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 
                  z-40 flex flex-col transition-transform duration-300
                  ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">TaskFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-4 mb-3">Menu</p>
        <NavItem to="/" icon="⬡" label="Dashboard" onClick={onClose} />
        <NavItem to="/projects" icon="◫" label="Projects" onClick={onClose} />
        <NavItem to="/tasks" icon="✓" label="Tasks" onClick={onClose} />
        <NavItem to="/team" icon="◉" label="Team" onClick={onClose} />
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 mb-3">
          <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-violet-400' : 'bg-emerald-400'}`} />
              <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium 
                     text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <span>↩</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
