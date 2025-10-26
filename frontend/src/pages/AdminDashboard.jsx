import React, { useEffect, useState } from 'react';
import API from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newProject, setNewProject] = useState({ name: '', description: '', deadline: '', members: [] });
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '', assignee: '', deadline: '', priority: 'Medium', status: 'To-Do' });

  const [submittingProject, setSubmittingProject] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);

  const [updatingRoleId, setUpdatingRoleId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectData, setEditingProjectData] = useState({ name: '', description: '', deadline: '', members: [] });
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskData, setEditingTaskData] = useState({ title: '', assignee: '', deadline: '', priority: '', status: '' });

  const [chatTaskId, setChatTaskId] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');

  const navigate = useNavigate();

  // Fetch initial data
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
{/* Users Table */}
<motion.div className="bg-white text-black shadow rounded p-4">
  <h2 className="text-xl font-bold mb-4">Users ({users.length})</h2>
  <table className="w-full table-auto border-collapse">
    <thead>
      <tr className="bg-gray-200">
        <th className="p-2 border">Profile</th>
        <th className="p-2 border">Name</th>
        <th className="p-2 border">Email</th>
        <th className="p-2 border">Role</th>
        <th className="p-2 border">Actions</th>
      </tr>
    </thead>
    <tbody>
      {users.map(u => (
        <tr key={u._id} className="hover:bg-gray-100">
          {/* Profile Picture */}
          <td className="p-2 border">
            <img 
              src={u.profilePic || '/default-avatar.png'} 
              alt={u.name} 
              className="w-10 h-10 rounded-full object-cover cursor-pointer"
              onClick={() => setSelectedUserProfile(u)} // show profile modal on click
            />
          </td>
          <td className="p-2 border cursor-pointer hover:underline" onClick={() => setSelectedUserProfile(u)}>
            {u.name}
          </td>
          <td className="p-2 border">{u.email}</td>
          <td className="p-2 border">
            <select 
              value={u.role} 
              disabled={updatingRoleId === u._id} 
              onChange={e => changeRole(u._id, e.target.value)} 
              className="border rounded p-1"
            >
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

  // Role change
  const changeRole = async (userId, role) => {
    setUpdatingRoleId(userId);
    try {
      const res = await API.put(`/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => (u._id === userId ? res.data : u)));
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
    } catch (err) { console.error(err); alert('Failed to delete user'); } 
    finally { setDeletingUserId(null); }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    setDeletingTaskId(taskId);
    try { await API.delete(`/tasks/${taskId}`); setTasks(prev => prev.filter(t => t._id !== taskId)); } 
    catch (err) { console.error(err); alert('Failed to delete task'); } 
    finally { setDeletingTaskId(null); }
  };

  // Delete project
  const deleteProject = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;
    setDeletingProjectId(projectId);
    try { await API.delete(`/projects/${projectId}`); setProjects(prev => prev.filter(p => p._id !== projectId)); } 
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
      setNewProject({ name: '', description: '', deadline: '', members: [] });
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
      refreshProjects();
    } catch (err) { console.error(err); alert('Failed to update project'); }
  };

  // Create Task
  const createTask = async (e) => {
    e.preventDefault();
    setSubmittingTask(true);
    try {
      if (!newTask.projectId) { alert('Please select a project'); return; }
      const res = await API.post(`/tasks/${newTask.projectId}`, newTask);
      setTasks(prev => [...prev, res.data]);
      setNewTask({ title: '', description: '', projectId: '', assignee: '', deadline: '', priority: 'Medium', status: 'To-Do' });
      refreshTasks();
    } catch (err) { console.error(err); alert('Failed to create task'); } 
    finally { setSubmittingTask(false); }
  };
const [messages, setMessages] = useState([]);
const [messageInput, setMessageInput] = useState('');
const [selectedUser, setSelectedUser] = useState(null); // e.g. employee/admin id

// Fetch messages
useEffect(() => {
  if (selectedUser) {
    API.get(`/chat/messages?projectId=${projectId}&userId=${selectedUser}`)
      .then(res => setMessages(res.data))
      .catch(console.error);
  }
}, [selectedUser]);

// Send message
const handleSendMessage = async () => {
  await API.post('/chat/send', {
    projectId,
    receiver: selectedUser,
    message: messageInput,
  });
  setMessageInput('');
  // Refresh messages
  const res = await API.get(`/chat/messages?projectId=${projectId}&userId=${selectedUser}`);
  setMessages(res.data);
};

  // Task inline edit save
  const [savingTaskId, setSavingTaskId] = useState(null);

const saveTaskEdit = async (taskId) => {
  setSavingTaskId(taskId);
  try {
    const res = await API.put(`/tasks/${taskId}`, editingTaskData);
    if (res.status === 200 && res.data) {
      setTasks(prev => prev.map(t => (t._id === taskId ? res.data : t)));
      setEditingTaskId(null);
    } else {
      console.error('Unexpected response:', res);
      alert('Failed to update task');
    }
  } catch (err) {
    console.error('Error updating task:', err.response?.data || err.message);
    alert('Failed to update task: ' + (err.response?.data?.message || err.message));
  } finally {
    setSavingTaskId(null);
  }
};


  // Chatbox send
  const sendMessage = (taskId) => {
    if (!newMessage.trim()) return;
    setChatMessages(prev => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), { sender: 'Admin', message: newMessage, timestamp: new Date() }]
    }));
    setNewMessage('');
  };

  // Calculate project progress
  const getProjectProgress = (projectId) => {
    const projectTasks = tasks.filter(t => t.projectId?._id === projectId);
    if (!projectTasks.length) return 0;
    const completed = projectTasks.filter(t => t.status === 'Completed' || t.status === 'Done').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  if (loading) return <p className="text-center mt-10 text-white">Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 p-6 space-y-10 text-white">
      
      {/* Users Table */}
      <motion.div className="bg-white text-black shadow rounded p-4">
        <h2 className="text-xl font-bold mb-4">Users ({users.length})</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Profile</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="hover:bg-gray-100">
                <td className="p-2 border">
                  <img 
                    src={u.profilePic || '/default-avatar.png'} 
                    alt={u.name} 
                    className="w-10 h-10 rounded-full object-cover cursor-pointer"
                    onClick={() => setSelectedUserProfile(u)}
                  />
                </td>
                <td className="p-2 border cursor-pointer hover:underline" onClick={() => setSelectedUserProfile(u)}>
                  {u.name}
                </td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">
                  <select 
                    value={u.role} 
                    disabled={updatingRoleId === u._id} 
                    onChange={e => changeRole(u._id, e.target.value)} 
                    className="border rounded p-1"
                  >
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

      {/* User Profile Modal */}
      {selectedUserProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded p-6 w-96 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setSelectedUserProfile(null)}>✕</button>
            <div className="flex flex-col items-center gap-4">
              <img src={selectedUserProfile.profilePic || '/default-avatar.png'} alt={selectedUserProfile.name} className="w-24 h-24 rounded-full object-cover" />
              <h2 className="text-xl font-bold">{selectedUserProfile.name}</h2>
              <p><strong>Email:</strong> {selectedUserProfile.email}</p>
              <p><strong>Role:</strong> {selectedUserProfile.role}</p>
            </div>
          </div>
        </div>
      )}


      {/* Projects Table with Detailed Task Status and Edit/Delete */}
<motion.div className="bg-white text-black shadow rounded p-4">
  <h2 className="text-xl font-bold mb-4">Projects ({projects.length})</h2>
  {projects.map(p => {
    const projectTasks = tasks.filter(t => t.projectId?._id === p._id);
    const completedTasks = projectTasks.filter(
      t => t.status === 'Completed' || t.status === 'Done'
    ).length;
    const progressPercent = projectTasks.length
      ? Math.round((completedTasks / projectTasks.length) * 100)
      : 0;

    return (
      <div key={p._id} className="mb-6 border rounded p-4 bg-gray-50">
        {/* Project Header with Actions */}
        <div className="flex justify-between items-center mb-2">
          {editingProjectId === p._id ? (
            <input
              className="border p-1 rounded w-1/3"
              value={editingProjectData.name}
              onChange={e =>
                setEditingProjectData({ ...editingProjectData, name: e.target.value })
              }
            />
          ) : (
            <h3 className="font-bold text-lg">{p.name}</h3>
          )}

          <div className="flex items-center gap-2">
            {editingProjectId === p._id ? (
              <>
                <input
                  type="date"
                  className="border p-1 rounded"
                  value={editingProjectData.deadline}
                  onChange={e =>
                    setEditingProjectData({ ...editingProjectData, deadline: e.target.value })
                  }
                />
                <button
                  onClick={saveProjectEdit}
                  className="bg-green-500 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingProjectId(null)}
                  className="bg-gray-500 text-white px-2 py-1 rounded"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">Deadline: {p.deadline?.split('T')[0]}</p>
                <button
                  onClick={() => {
                    setEditingProjectId(p._id);
                    setEditingProjectData({
                      name: p.name,
                      description: p.description,
                      deadline: p.deadline?.split('T')[0] || '',
                      members: p.members?.map(m => m._id) || [],
                    });
                  }}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteProject(p._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Members */}
        {editingProjectId === p._id ? (
          <div className="flex flex-wrap gap-2 mb-2 max-h-40 overflow-y-auto border p-2 rounded">
            {users
              .filter(u => u.role === 'employee')
              .map(u => (
                <label key={u._id} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={editingProjectData.members.includes(u._id)}
                    onChange={e => {
                      const newMembers = e.target.checked
                        ? [...editingProjectData.members, u._id]
                        : editingProjectData.members.filter(m => m !== u._id);
                      setEditingProjectData({ ...editingProjectData, members: newMembers });
                    }}
                  />
                  {u.name}
                </label>
              ))}
          </div>
        ) : (
          <p className="text-sm mb-2">
            Members: {p.members?.map(m => m.name).join(', ') || 'None'}
          </p>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-gray-300 rounded h-4 mb-2">
          <motion.div
            className="h-4 bg-green-500 rounded"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm mb-4">
          {progressPercent}% completed ({completedTasks}/{projectTasks.length} tasks)
        </p>

        {/* Task Breakdown */}
        <table className="w-full table-auto border-collapse text-black">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Task</th>
              <th className="p-2 border">Assignee</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {projectTasks.map(t => (
              <tr key={t._id} className="hover:bg-gray-100">
                <td className="p-2 border">{t.title}</td>
                <td className="p-2 border">{t.assignee?.name || 'Unassigned'}</td>
                <td className="p-2 border">{t.status}</td>
              </tr>
            ))}
            {projectTasks.length === 0 && (
              <tr>
                <td colSpan={3} className="p-2 border text-center text-gray-500">
                  No tasks added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  })}
</motion.div>


      {/* Add Project Form */}
      <motion.div className="bg-white text-black shadow rounded p-4">
        <h2 className="text-xl font-bold mb-3">Add New Project</h2>
        <form onSubmit={createProject} className="grid gap-2 sm:grid-cols-2">
          <input className="border p-2 rounded" placeholder="Project Name" value={newProject.name} onChange={e => setNewProject({...newProject,name:e.target.value})} required />
          <input className="border p-2 rounded" type="date" placeholder="Deadline" value={newProject.deadline} onChange={e => setNewProject({...newProject,deadline:e.target.value})} required />
          <textarea className="border p-2 rounded sm:col-span-2" placeholder="Description" value={newProject.description} onChange={e => setNewProject({...newProject,description:e.target.value})}></textarea>
          <div className="flex flex-wrap gap-2 sm:col-span-2 max-h-40 overflow-y-auto border p-2 rounded">
            {users.filter(u=>u.role==='employee').map(u=>(
              <label key={u._id} className="flex items-center gap-1">
                <input type="checkbox" checked={newProject.members.includes(u._id)} onChange={e=>{
                  const newMembers = e.target.checked ? [...newProject.members,u._id] : newProject.members.filter(m=>m!==u._id);
                  setNewProject({...newProject,members:newMembers});
                }} />
                {u.name}
              </label>
            ))}
          </div>
          <button type="submit" disabled={submittingProject} className={`bg-blue-600 text-white px-4 py-2 rounded mt-2 sm:col-span-2 ${submittingProject?'opacity-50 cursor-not-allowed':''}`}>{submittingProject?'Adding...':'Add Project'}</button>
        </form>
      </motion.div>

      {/* Add Task Form */}
      <motion.div className="bg-white text-black shadow rounded p-4">
        <h2 className="text-xl font-bold mb-3">Add New Task</h2>
        <form onSubmit={createTask} className="grid gap-2 sm:grid-cols-2">
          <input className="border p-2 rounded" placeholder="Title" value={newTask.title} onChange={e => setNewTask({...newTask,title:e.target.value})} required />
          <input className="border p-2 rounded" type="date" value={newTask.deadline} onChange={e => setNewTask({...newTask,deadline:e.target.value})} required />
          <select className="border p-2 rounded" value={newTask.projectId} onChange={e => setNewTask({...newTask,projectId:e.target.value})} required>
            <option value="">Select Project</option>
            {projects.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={newTask.assignee} onChange={e => setNewTask({...newTask,assignee:e.target.value})} required>
            <option value="">Assign to</option>
            {users.map(u=><option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          <textarea className="border p-2 rounded sm:col-span-2" placeholder="Description" value={newTask.description} onChange={e => setNewTask({...newTask,description:e.target.value})}></textarea>
          <select className="border p-2 rounded sm:col-span-2" value={newTask.priority} onChange={e => setNewTask({...newTask,priority:e.target.value})}>
            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
          </select>
          <button type="submit" disabled={submittingTask} className={`bg-green-600 text-white px-4 py-2 rounded mt-2 sm:col-span-2 ${submittingTask?'opacity-50 cursor-not-allowed':''}`}>{submittingTask?'Adding...':'Add Task'}</button>
        </form>
      </motion.div>

      {/* Tasks Table */}
      <motion.div className="bg-white text-black shadow rounded p-4">
        <h2 className="text-xl font-bold mb-4">All Tasks ({tasks.length})</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Assignee</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Project</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t=>(
              <tr key={t._id} className="hover:bg-gray-100">
                <td className="p-2 border">{editingTaskId===t._id ? <input className="border p-1 rounded w-full" value={editingTaskData.title} onChange={e=>setEditingTaskData({...editingTaskData,title:e.target.value})}/> : t.title}</td>
                <td className="p-2 border">{editingTaskId===t._id ? <select className="border p-1 rounded" value={editingTaskData.assignee} onChange={e=>setEditingTaskData({...editingTaskData,assignee:e.target.value})}><option value="">Assign</option>{users.map(u=><option key={u._id} value={u._id}>{u.name}</option>)}</select> : t.assignee?.name || 'Unassigned'}</td>
                <td className="p-2 border">{editingTaskId===t._id ? <select className="border p-1 rounded" value={editingTaskData.status} onChange={e=>setEditingTaskData({...editingTaskData,status:e.target.value})}><option value="To-Do">To-Do</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option></select> : t.status}</td>
                <td className="p-2 border">{t.projectId?.name || ''}</td>
                <td className="p-2 border space-x-2">
                  {editingTaskId===t._id ? <>
                    <button onClick={()=>saveTaskEdit(t._id)} className="bg-green-500 text-white px-2 py-1 rounded">Save</button>
                    <button onClick={()=>setEditingTaskId(null)} className="bg-gray-500 text-white px-2 py-1 rounded">Cancel</button>
                  </> : <>
                    <button onClick={()=>{ setEditingTaskId(t._id); setEditingTaskData({ title:t.title, assignee:t.assignee?._id || '', status:t.status, priority:t.priority, deadline:t.deadline?.split('T')[0] || '' }); }} className="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
                    <button disabled={deletingTaskId===t._id} onClick={()=>deleteTask(t._id)} className={`bg-red-500 text-white px-2 py-1 rounded ${deletingTaskId===t._id?'opacity-50 cursor-not-allowed':''}`}>Delete</button>
                    {/* <button onClick={()=>setChatTaskId(t._id)} className="bg-blue-500 text-white px-2 py-1 rounded">Chat</button> */}
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      
    </div>
  );
}
