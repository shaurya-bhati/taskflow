import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard, StatusBadge, PriorityBadge, Spinner, Avatar } from '../components/common/UI';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    dashboardAPI.get()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, priority, recentTasks, recentProjects, teamStats } = data;

  const taskStatusData = [
    { name: 'To Do', value: stats.todoTasks, color: '#475569' },
    { name: 'In Progress', value: stats.inProgressTasks, color: '#3b82f6' },
    { name: 'Completed', value: stats.completedTasks, color: '#10b981' },
    { name: 'Overdue', value: stats.overdueTasks, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'Low', tasks: priority.low },
    { name: 'Medium', tasks: priority.medium },
    { name: 'High', tasks: priority.high },
  ];

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="◫" label="Total Projects" value={stats.totalProjects} color="violet" />
        <StatCard icon="✓" label="Total Tasks" value={stats.totalTasks} color="blue" />
        <StatCard icon="⬡" label="Completed" value={stats.completedTasks} sub={`${completionRate}% completion rate`} color="emerald" />
        <StatCard icon="⚠" label="Overdue" value={stats.overdueTasks} color="red" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie chart */}
        <div className="card">
          <h3 className="font-display font-semibold text-white mb-4">Task Status</h3>
          {taskStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {taskStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconSize={8} iconType="circle" formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No tasks yet</div>
          )}
        </div>

        {/* Bar chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-display font-semibold text-white mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
              <Bar dataKey="tasks" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress + Team stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-display font-semibold text-white mb-4">Completion Rate</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#grad)" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${completionRate * 2.638} ${263.8 - completionRate * 2.638}`}
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-bold text-2xl text-white">{completionRate}%</span>
                <span className="text-xs text-slate-500">Done</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-lg font-bold text-white">{stats.inProgressTasks}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-lg font-bold text-white">{stats.pendingTasks}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </div>
        </div>

        {isAdmin && teamStats && (
          <div className="card">
            <h3 className="font-display font-semibold text-white mb-4">Team Overview</h3>
            <div className="space-y-3">
              {[
                { l: 'Total Members', v: teamStats.total, color: 'text-violet-400' },
                { l: 'Admins', v: teamStats.admins, color: 'text-blue-400' },
                { l: 'Members', v: teamStats.members, color: 'text-emerald-400' },
              ].map(({ l, v, color }) => (
                <div key={l} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                  <span className="text-sm text-slate-400">{l}</span>
                  <span className={`font-display font-bold text-lg ${color}`}>{v}</span>
                </div>
              ))}
            </div>
            <Link to="/team" className="mt-4 block text-center text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Manage team →
            </Link>
          </div>
        )}

        {/* Recent tasks */}
        <div className={`card ${!isAdmin || !teamStats ? 'md:col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Recent Tasks</h3>
            <Link to="/tasks" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</Link>
          </div>
          <div className="space-y-2.5">
            {recentTasks.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No tasks yet</p>
            ) : recentTasks.map((task) => (
              <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                  <p className="text-xs text-slate-500 truncate">{task.project?.title}</p>
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-white">Recent Projects</h3>
          <Link to="/projects" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</Link>
        </div>
        {recentProjects.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No projects yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentProjects.map((proj) => (
              <Link key={proj._id} to={`/projects/${proj._id}`}>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-violet-500/40 hover:bg-slate-800/70 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={proj.status} />
                    {proj.deadline && (
                      <span className="text-xs text-slate-500">
                        {format(new Date(proj.deadline), 'MMM d')}
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-slate-200 mb-2 line-clamp-1">{proj.title}</h4>
                  <div className="flex -space-x-1.5">
                    {proj.members?.slice(0, 4).map((m) => (
                      <div key={m._id} title={m.name}>
                        <Avatar name={m.name} size="sm" />
                      </div>
                    ))}
                    {proj.members?.length > 4 && (
                      <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs text-slate-400 border-2 border-slate-900">
                        +{proj.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
