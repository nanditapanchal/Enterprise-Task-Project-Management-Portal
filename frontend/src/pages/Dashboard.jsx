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

  const user = JSON.parse(localStorage.getItem('user'));

  // Fetch projects and tasks
  useEffect(() => {
    async function fetchData() {
      try {
        let projRes, taskRes;

        if (user?.role === 'admin') {
          [projRes, taskRes] = await Promise.all([
            API.get('/projects/all'),
            API.get('/tasks/all'),
          ]);
        } else {
          [projRes, taskRes] = await Promise.all([
            API.get('/projects/my-projects'),
            API.get('/tasks/my-tasks'),
          ]);
        }

        setProjects(projRes.data);
        setTasks(taskRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    }

    fetchData();
  }, []);

  // Generate AI suggestions
  useEffect(() => {
    if (projects.length && tasks.length) generateAISuggestions(projects, tasks);
  }, [projects, tasks]);

  const generateAISuggestions = (projectsData, tasksData) => {
    const suggestions = [];
    const today = new Date();

    projectsData.forEach((p) => {
      const projectTasks = tasksData.filter(
        (t) => (t.projectId?._id || t.projectId) === p._id
      );
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

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-yellow-400 text-black';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-300 text-black';
    }
  };

  return (
    <div className="p-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Total Projects</h2>
          <p className="text-2xl font-bold">{projects.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Tasks Completed</h2>
          <p className="text-2xl font-bold">{completedTasks}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Tasks Pending</h2>
          <p className="text-2xl font-bold">{pendingTasks}</p>
        </div>
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">AI Suggestions</h2>
          <div className="space-y-2">
            {aiSuggestions.map((s, i) => (
              <div
                key={i}
                className={`p-3 rounded shadow text-white ${
                  s.severity === 'red'
                    ? 'bg-red-500'
                    : s.severity === 'orange'
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
              >
                {s.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Cards */}
      <h2 className="text-2xl font-bold mb-4">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {projects.map((p) => {
          const projectTasks = tasks.filter(
            (t) => (t.projectId?._id || t.projectId) === p._id
          );
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
            <div key={p._id} className="bg-white p-4 rounded shadow">
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-sm text-gray-600">{p.description}</p>
              {p.members && p.members.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Members: {p.members.map((m) => m.name).join(', ')}
                </p>
              )}
              <div className="mt-2">
                <div className="w-full bg-gray-200 h-2 rounded">
                  <div
                    className="bg-green-500 h-2 rounded"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-1">{progress}% Complete</p>
              </div>

              {/* Task Status Update Dropdown */}
              {/* Task Status Update Dropdown with urgency highlighting */}
{projectTasks.length > 0 && (
  <div className="mt-4 space-y-2">
    {projectTasks.map((task) => {
      // Determine task urgency
      const today = new Date();
      const deadline = new Date(task.deadline);
      const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      let bgColor = 'bg-gray-50'; // default

      if (task.status !== 'Done' && diffDays < 1) bgColor = 'bg-red-100';
      else if (task.status !== 'Done' && diffDays <= 3) bgColor = 'bg-orange-100';
      else if (task.status === 'Done') bgColor = 'bg-green-100';

      return (
        <div
          key={task._id}
          className={`flex justify-between items-center p-2 rounded ${bgColor}`}
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
              className="border text-sm p-1 rounded"
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
                  <Bar data={barData} options={{ plugins: { legend: { display: false } } }} />
                </div>
              )}
              <div className="mt-2">
                <Link to={`/project/${p._id}`} className="text-blue-600">
                  Open Project
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Status Pie Chart */}
      <div className="bg-white p-4 rounded shadow w-full md:w-1/2">
        <h2 className="text-lg font-bold mb-2">Task Status</h2>
        <Pie data={pieData} />
      </div>
    </div>
  );
}
