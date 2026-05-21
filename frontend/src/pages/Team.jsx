import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Spinner, EmptyState, ConfirmDialog } from '../components/common/UI';
import { format } from 'date-fns';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const { isAdmin, user: currentUser } = useAuth();

  useEffect(() => {
    userAPI.getAll()
      .then((res) => setUsers(res.data.users))
      .catch(() => toast.error('Failed to load team'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (id, role) => {
    try {
      const res = await userAPI.updateRole(id, role);
      setUsers((u) => u.map((x) => x._id === id ? res.data.user : x));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async () => {
    try {
      await userAPI.delete(deleteId);
      setUsers((u) => u.filter((x) => x._id !== deleteId));
      setDeleteId(null);
      toast.success('User removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const admins = users.filter((u) => u.role === 'admin');
  const members = users.filter((u) => u.role === 'member');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Total Members', v: users.length, color: 'text-violet-400' },
          { l: 'Admins', v: admins.length, color: 'text-blue-400' },
          { l: 'Members', v: members.length, color: 'text-emerald-400' },
        ].map(({ l, v, color }) => (
          <div key={l} className="card text-center py-4">
            <p className={`font-display font-bold text-3xl ${color}`}>{v}</p>
            <p className="text-xs text-slate-500 mt-1">{l}</p>
          </div>
        ))}
      </div>

      {users.length === 0 ? (
        <EmptyState icon="◉" title="No team members" description="Team members will appear here after registration" />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-display font-semibold text-white">All Members</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {users.map((u) => (
              <div key={u._id} className="flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                <Avatar name={u.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-200">{u.name}</p>
                    {u._id === currentUser?._id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">You</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <p className="text-xs text-slate-600 hidden md:block">
                  Joined {format(new Date(u.createdAt), 'MMM d, yyyy')}
                </p>
                {isAdmin && u._id !== currentUser?._id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-violet-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => setDeleteId(u._id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs px-2.5 py-1 rounded-full border capitalize
                    ${u.role === 'admin'
                      ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                    {u.role}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Member"
        message="Remove this member from the team? Their tasks will be unassigned."
      />
    </div>
  );
}
