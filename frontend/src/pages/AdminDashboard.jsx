import React, { useEffect, useState } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, projectsRes, tasksRes] = await Promise.all([
          API.get('/users'),
          API.get('/projects/all'),
          API.get('/tasks/all')
        ]);
        setUsers(usersRes.data);
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        alert('Failed to load admin data');
      }
    }
    fetchData();
  }, []);

  // Role change
  const changeRole = async (userId, role) => {
    try {
      const res = await API.put(`/users/${userId}/role`, { role });
      setUsers(users.map(u => (u._id === userId ? res.data : u)));
    } catch (err) {
      console.error(err);
      alert('Failed to update role');
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete task');
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Users Table */}
      <motion.div
        className="bg-white shadow rounded p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold mb-4">Users</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="p-2 border">{u.name}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className="border rounded p-1"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Projects Table */}
      <motion.div
        className="bg-white shadow rounded p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-xl font-bold mb-4">Projects</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Deadline</th>
              <th className="p-2 border">Members</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="p-2 border">{p.name}</td>
                <td className="p-2 border">{new Date(p.deadline).toLocaleDateString()}</td>
                <td className="p-2 border">
                  {p.members.map(m => m.name).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Tasks Table */}
      <motion.div
        className="bg-white shadow rounded p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-bold mb-4">Tasks</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Assignee</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Project</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t._id} className="hover:bg-gray-50">
                <td className="p-2 border">{t.title}</td>
                <td className="p-2 border">{t.assignee?.name || 'Unassigned'}</td>
                <td className="p-2 border">{t.status}</td>
                <td className="p-2 border">{t.projectId?.name || ''}</td>
                <td className="p-2 border space-x-2">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition"
                    onClick={() => navigate(`/tasks/edit/${t._id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                    onClick={() => deleteTask(t._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
