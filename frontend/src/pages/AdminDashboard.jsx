import React, { useEffect, useState } from 'react';
import API from '../api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newProject, setNewProject] = useState({ name: '', description: '', deadline: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '', assignee: '', deadline: '', priority: 'Medium' });

  const [submittingProject, setSubmittingProject] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);

  const [updatingRoleId, setUpdatingRoleId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectData, setEditingProjectData] = useState({ name: '', description: '', deadline: '' });
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const navigate = useNavigate();

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
      } catch (err) {
        console.error(err);
        alert('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Refresh helpers
  const refreshTasks = async () => {
    try { const res = await API.get('/tasks/all'); setTasks(res.data); } 
    catch (err) { console.error(err); alert('Failed to refresh tasks'); }
  };
  const refreshProjects = async () => {
    try { const res = await API.get('/projects/all'); setProjects(res.data); } 
    catch (err) { console.error(err); alert('Failed to refresh projects'); }
  };
  const refreshUsers = async () => {
    try { const res = await API.get('/users'); setUsers(res.data); } 
    catch (err) { console.error(err); alert('Failed to refresh users'); }
  };

  // Role change
  const changeRole = async (userId, role) => {
    setUpdatingRoleId(userId);
    try {
      const res = await API.put(`/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => (u._id === userId ? res.data : u)));
      alert('✅ User role updated!');
    } catch (err) { console.error(err); alert('Failed to update role'); } 
    finally { setUpdatingRoleId(null); }
  };

  // Delete User
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setDeletingUserId(userId);
    try {
      await API.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      alert('✅ User deleted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    setDeletingTaskId(taskId);
    try { await API.delete(`/tasks/${taskId}`); setTasks(prev => prev.filter(t => t._id !== taskId)); alert('✅ Task deleted'); } 
    catch (err) { console.error(err); alert('Failed to delete task'); } 
    finally { setDeletingTaskId(null); }
  };

  // Delete project
  const deleteProject = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;
    setDeletingProjectId(projectId);
    try { await API.delete(`/projects/${projectId}`); setProjects(prev => prev.filter(p => p._id !== projectId)); alert('✅ Project deleted'); } 
    catch (err) { console.error(err); alert('Failed to delete project'); } 
    finally { setDeletingProjectId(null); }
  };

  // Create Project
  const createProject = async (e) => {
    e.preventDefault();
    setSubmittingProject(true);
    try {
      const res = await API.post('/projects', newProject);
      setProjects(prev => [...prev, res.data]);
      setNewProject({ name: '', description: '', deadline: '' });
      alert('✅ Project created successfully');
      refreshProjects();
    } catch (err) { console.error(err); alert('Failed to create project'); } 
    finally { setSubmittingProject(false); }
  };

  // Edit Project
  const saveProjectEdit = async () => {
    if (!editingProjectId) return;
    try {
      const res = await API.put(`/projects/${editingProjectId}`, editingProjectData);
      setProjects(prev => prev.map(p => (p._id === editingProjectId ? res.data : p)));
      setEditingProjectId(null);
      alert('✅ Project updated!');
      refreshProjects();
    } catch (err) { console.error(err); alert('Failed to update project'); }
  };

  // Create Task
  const createTask = async (e) => {
    e.preventDefault();
    setSubmittingTask(true);
    try {
      if (!newTask.projectId) { alert('Please select a project'); return; }
      const res = await API.post(`/tasks/${newTask.projectId}`, { ...newTask, status: 'To-Do' });
      setTasks(prev => [...prev, res.data]);
      setNewTask({ title: '', description: '', projectId: '', assignee: '', deadline: '', priority: 'Medium' });
      alert('✅ Task created successfully');
      refreshTasks();
    } catch (err) { console.error(err); alert('Failed to create task'); } 
    finally { setSubmittingTask(false); }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="container mx-auto p-6 space-y-10">
      {/* Users Table */}
      <motion.div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-4">Users ({users.length})</h2>
        <table className="w-full table-auto border-collapse">
          <thead><tr className="bg-gray-100"><th className="p-2 border">Name</th><th className="p-2 border">Email</th><th className="p-2 border">Role</th><th className="p-2 border">Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="p-2 border">{u.name}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">
                  <select value={u.role} disabled={updatingRoleId === u._id} onChange={e => changeRole(u._id, e.target.value)} className="border rounded p-1">
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-2 border">
                  <button
                    className={`bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ${deletingUserId === u._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={deletingUserId === u._id}
                    onClick={() => deleteUser(u._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Projects Table */}
      <motion.div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-4">Projects ({projects.length})</h2>
        <table className="w-full table-auto border-collapse">
          <thead><tr className="bg-gray-100"><th className="p-2 border">Name</th><th className="p-2 border">Deadline</th><th className="p-2 border">Members</th><th className="p-2 border">Actions</th></tr></thead>
          <tbody>
            {projects.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="p-2 border">{editingProjectId === p._id ? <input value={editingProjectData.name} onChange={e => setEditingProjectData({...editingProjectData, name: e.target.value})} className="border p-1 rounded" /> : p.name}</td>
                <td className="p-2 border">{editingProjectId === p._id ? <input type="date" value={editingProjectData.deadline} onChange={e => setEditingProjectData({...editingProjectData, deadline: e.target.value})} className="border p-1 rounded" /> : p.deadline?.split('T')[0]}</td>
                <td className="p-2 border">{p.members?.map(m => m.name).join(', ')}</td>
                <td className="p-2 border space-x-2">
                  {editingProjectId === p._id ? 
                    <>
                      <button onClick={saveProjectEdit} className="bg-green-500 text-white px-2 py-1 rounded">Save</button>
                      <button onClick={() => setEditingProjectId(null)} className="bg-gray-500 text-white px-2 py-1 rounded">Cancel</button>
                    </>
                    :
                    <>
                      <button onClick={() => { setEditingProjectId(p._id); setEditingProjectData({ name: p.name, description: p.description, deadline: p.deadline?.split('T')[0] }); }} className="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
                      <button disabled={deletingProjectId === p._id} onClick={() => deleteProject(p._id)} className={`bg-red-500 text-white px-2 py-1 rounded ${deletingProjectId === p._id ? 'opacity-50 cursor-not-allowed' : ''}`}>Delete</button>
                    </>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Add Project Form */}
<motion.div className="bg-white shadow rounded p-4">
  <h2 className="text-xl font-bold mb-3">Add New Project</h2>
  <form onSubmit={createProject} className="grid gap-2 sm:grid-cols-2">
    {/* Project Name */}
    <input
      className="border p-2 rounded"
      placeholder="Project Name"
      value={newProject.name}
      onChange={e => setNewProject({ ...newProject, name: e.target.value })}
      required
    />

    {/* Deadline */}
    <input
      className="border p-2 rounded"
      placeholder="Deadline"
      type="date"
      value={newProject.deadline}
      onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
      required
    />

    {/* Description */}
    <textarea
      className="border p-2 rounded sm:col-span-2"
      placeholder="Description"
      value={newProject.description}
      onChange={e => setNewProject({ ...newProject, description: e.target.value })}
    ></textarea>

    {/* Select Members */}
    <select
      multiple
      className="border p-2 rounded sm:col-span-2"
      value={newProject.members || []}
      onChange={e =>
        setNewProject({
          ...newProject,
          members: Array.from(e.target.selectedOptions, option => option.value),
        })
      }
    >
      <option value="">Select Members</option>
      {users
        .filter(u => u.role === 'employee')
        .map(u => (
          <option key={u._id} value={u._id}>
            {u.name}
          </option>
        ))}
    </select>

    {/* Submit Button */}
    <button
      type="submit"
      disabled={submittingProject}
      className={`bg-blue-600 text-white px-4 py-2 rounded mt-2 sm:col-span-2 ${
        submittingProject ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {submittingProject ? 'Adding...' : 'Add Project'}
    </button>
  </form>
</motion.div>


      {/* Add Task Form */}
      <motion.div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-3">Add New Task</h2>
        <form onSubmit={createTask} className="grid gap-2 sm:grid-cols-2">
          <input className="border p-2 rounded" placeholder="Title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required />
          <input className="border p-2 rounded" type="date" value={newTask.deadline} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} required />
          <select className="border p-2 rounded" value={newTask.projectId} onChange={e => setNewTask({ ...newTask, projectId: e.target.value })} required>
            <option value="">Select Project</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={newTask.assignee} onChange={e => setNewTask({ ...newTask, assignee: e.target.value })} required>
            <option value="">Assign to</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          <textarea className="border p-2 rounded sm:col-span-2" placeholder="Description" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })}></textarea>
          <select className="border p-2 rounded sm:col-span-2" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <button type="submit" disabled={submittingTask} className={`bg-green-600 text-white px-4 py-2 rounded mt-2 sm:col-span-2 ${submittingTask ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {submittingTask ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </motion.div>

      {/* Tasks Table */}
      <motion.div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-4">All Tasks ({tasks.length})</h2>
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
                  <button className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600" onClick={() => navigate(`/tasks/edit/${t._id}`)}>Edit</button>
                  <button className={`bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ${deletingTaskId === t._id ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={deletingTaskId === t._id} onClick={() => deleteTask(t._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}