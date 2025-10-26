import React, { useEffect, useState } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch projects and tasks
  useEffect(() => {
    async function fetchData() {
      try {
        let projRes, taskRes;

        if (user?.role === 'admin') {
          [projRes, taskRes] = await Promise.all([API.get('/projects/all'), API.get('/tasks/all')]);
        } else {
          [projRes, taskRes] = await Promise.all([API.get('/projects/my-projects'), API.get('/tasks/my-tasks')]);
        }

        setProjects(projRes.data);
        setTasks(taskRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    }

    fetchData();
  }, [user]);

  // Generate AI suggestions
  useEffect(() => {
    if (projects.length && tasks.length) generateAISuggestions(projects, tasks);
  }, [projects, tasks]);

  const generateAISuggestions = (projectsData, tasksData) => {
    const suggestions = [];
    const today = new Date();

    projectsData.forEach((p) => {
      const projectTasks = tasksData.filter((t) => (t.projectId?._id || t.projectId) === p._id);
      const pending = projectTasks.filter((t) => t.status !== 'Done').length;
      const deadline = new Date(p.deadline);
      const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      let severity = 'green';
      let text = '';

      if (pending > 5 || diffDays < 1) {
        severity = 'red';
        text = `Project "${p.name}" is urgent! ${pending} pending tasks, deadline in ${diffDays} day(s).`;
      } else if (pending > 0 || diffDays <= 3) {
        severity = 'orange';
        text = `Project "${p.name}" has ${pending} pending tasks. Deadline in ${diffDays} day(s).`;
      } else {
        severity = 'green';
        text = `Project "${p.name}" is on track.`;
      }

      suggestions.push({ text, severity });
    });

    setAiSuggestions(suggestions);
  };

  // Chat
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { sender: 'user', text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const res = await API.post('/ai', {
        message: chatInput,
        context: JSON.stringify({
          projects: projects.map((p) => ({ _id: p._id, name: p.name })),
          tasks: tasks.map((t) => ({
            _id: t._id,
            title: t.title,
            status: t.status,
            projectId: t.projectId?._id || t.projectId,
          })),
        }),
      });
      const aiMessage = { sender: 'ai', text: res.data.message };
      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, AI service is unavailable.' },
      ]);
    }

    setChatInput('');
  };

  // Avatar upload
  const handleAvatarChange = (e) => setAvatarFile(e.target.files[0]);
  const uploadAvatar = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const res = await API.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setAvatarFile(null);
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Profile update
  const handleProfileChange = (e) =>
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await API.put('/users/me', profileForm);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setEditingProfile(false);
    } catch (err) {
      console.error('Profile update error:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Task stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const pendingTasks = totalTasks - completedTasks;

  const pieData = {
    labels: ['Pending', 'Done'],
    datasets: [
      {
        label: 'Task Status',
        data: [pendingTasks, completedTasks],
        backgroundColor: ['#fbbf24', '#34d399'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* ===== Profile Card ===== */}
      <div className="flex flex-col md:flex-row items-center mb-8 bg-white p-5 rounded-xl shadow-md border border-gray-100">
        <div className="mr-5 mb-3 md:mb-0">
          <img
            src={user.avatarUrl || '/default-avatar.png'}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border border-gray-300"
          />
          <div className="mt-2 flex items-center gap-2">
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
            <button
              onClick={uploadAvatar}
              disabled={avatarUploading || !avatarFile}
              className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {avatarUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        <div className="flex-1 w-full">
          {editingProfile ? (
            <div className="space-y-2">
              <input
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="Name"
              />
              <input
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="Email"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <button
                onClick={() => setEditingProfile(true)}
                className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== Top Summary Cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Projects', value: projects.length, color: 'from-blue-500 to-indigo-500' },
          { label: 'Tasks Completed', value: completedTasks, color: 'from-green-400 to-emerald-500' },
          { label: 'Tasks Pending', value: pendingTasks, color: 'from-yellow-400 to-orange-500' },
        ].map((card, i) => (
          <div
            key={i}
            className={`bg-gradient-to-r ${card.color} p-5 rounded-xl shadow-md text-white transition-transform transform hover:scale-[1.02]`}
          >
            <h2 className="text-lg font-semibold">{card.label}</h2>
            <p className="text-3xl font-extrabold mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ===== AI Suggestions ===== */}
      {aiSuggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-gray-700 flex items-center gap-2">
            🤖 AI Suggestions
          </h2>
          <div className="space-y-3">
            {aiSuggestions.map((s, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg shadow-sm text-white border-l-4 ${
                  s.severity === 'red'
                    ? 'bg-red-500 border-red-700'
                    : s.severity === 'orange'
                    ? 'bg-orange-500 border-orange-700'
                    : 'bg-green-500 border-green-700'
                }`}
              >
                {s.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Projects Section ===== */}
      <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">📁 Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {projects.map((p) => {
          const projectTasks = tasks.filter((t) => (t.projectId?._id || t.projectId) === p._id);
          const completed = projectTasks.filter((t) => t.status === 'Done').length;
          const progress = projectTasks.length
            ? Math.round((completed / projectTasks.length) * 100)
            : 0;

          const taskStatusCounts = {
            'To-Do': projectTasks.filter((t) => t.status === 'To-Do').length,
            'In Progress': projectTasks.filter((t) => t.status === 'In Progress').length,
            Done: completed,
          };

          const barData = {
            labels: Object.keys(taskStatusCounts),
            datasets: [
              {
                label: 'Tasks',
                data: Object.values(taskStatusCounts),
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
              },
            ],
          };

          return (
            <div
              key={p._id}
              className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-gray-800">{p.name}</h3>
                <span className="text-xs text-gray-500 italic">
                  {new Date(p.deadline).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">{p.description}</p>
              {p.members && p.members.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  👥 {p.members.map((m) => m.name).join(', ')}
                </p>
              )}

              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-1 text-gray-600">{progress}% Complete</p>
              </div>

              {/* Task list */}
              {projectTasks.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                  {projectTasks.map((task) => {
                    const today = new Date();
                    const deadline = new Date(task.deadline);
                    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                    let bgColor = 'bg-gray-50';

                    if (task.status !== 'Done' && diffDays < 1) bgColor = 'bg-red-100';
                    else if (task.status !== 'Done' && diffDays <= 3) bgColor = 'bg-orange-100';
                    else if (task.status === 'Done') bgColor = 'bg-green-100';

                    return (
                      <div
                        key={task._id}
                        className={`flex justify-between items-center p-2 rounded-lg ${bgColor}`}
                      >
                        <span className="text-sm">{task.title}</span>
                        {(task.assignee?._id === user.id || user.role === 'admin') && (
                          <select
                            value={task.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                await API.put(`/tasks/task/${task._id}`, { status: newStatus });
                                setTasks((prev) =>
                                  prev.map((t) =>
                                    t._id === task._id ? { ...t, status: newStatus } : t
                                  )
                                );
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="border border-gray-300 text-sm p-1 rounded focus:ring focus:ring-indigo-200"
                          >
                            {['To-Do', 'In Progress', 'Done'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {projectTasks.length > 0 && (
                <div className="mt-4">
                  <Bar
                    data={barData}
                    options={{
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                    }}
                  />
                </div>
              )}

              <div className="mt-4 text-right">
                <Link
                  to={`/project/${p._id}`}
                  className="text-indigo-600 text-sm font-medium hover:underline"
                >
                  🔗 Open Project
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Status Pie Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 w-full md:w-1/2 mx-auto">
        <h2 className="text-lg font-bold mb-3 text-gray-700">📊 Task Status Overview</h2>
        <Pie data={pieData} />
      </div>
    </div>
  );
}
