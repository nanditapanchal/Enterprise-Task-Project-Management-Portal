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

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
      generateAISuggestions(res.data, tasks);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTasks = async () => {
    try {
      const res = await API.get('/tasks');
      setTasks(res.data);
      generateAISuggestions(projects, res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Generate AI suggestions with severity
  const generateAISuggestions = (projectsData, tasksData) => {
    const suggestions = [];
    const today = new Date();

    projectsData.forEach((p) => {
      const projectTasks = tasksData.filter((t) => t.projectId === p._id);
      const pending = projectTasks.filter((t) => t.status !== 'Done').length;
      const deadline = new Date(p.deadline);
      const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      let severity = 'green';
      let text = '';

      if (pending > 5 || diffDays < 1) {
        severity = 'red';
        text = `Project "${p.name}" is urgent! ${pending} pending tasks and deadline in ${diffDays} day(s).`;
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

  // Handle Chat
  const handleChatSubmit = async (e) => {
  e.preventDefault();
  if (!chatInput.trim()) return;

  const userMessage = { sender: 'user', text: chatInput };
  setChatMessages((prev) => [...prev, userMessage]);

  try {
    const res = await API.post('/ai', {
      message: chatInput,
      context: JSON.stringify({ projects, tasks }),
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

  // Simple AI logic for chat (can integrate OpenAI API)
  const generateChatReply = (input) => {
    input = input.toLowerCase();
    if (input.includes('pending tasks')) {
      const totalPending = tasks.filter((t) => t.status !== 'Done').length;
      return `There are ${totalPending} pending tasks across all projects.`;
    }
    if (input.includes('urgent projects')) {
      const urgentProjects = aiSuggestions.filter((s) => s.severity === 'red').map((s) => s.text);
      return urgentProjects.length > 0 ? urgentProjects.join(' | ') : 'No urgent projects right now.';
    }
    return 'I can provide info about pending tasks or urgent projects. Try asking!';
  };

  // Stats calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'Done').length;

  // Pie chart data
  const pieData = {
    labels: ['To-Do / In Progress', 'Done'],
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link to="/add-project" className="px-3 py-2 bg-blue-600 text-white rounded">
          + New Project
        </Link>
      </div>

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
                  s.severity === 'red' ? 'bg-red-500' : s.severity === 'orange' ? 'bg-orange-500' : 'bg-green-500'
                }`}
              >
                {s.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Box */}
      <div className="bg-white p-4 rounded shadow mb-6 max-w-md">
        <h2 className="text-lg font-bold mb-2">AI Assistant Chat</h2>
        <div className="border p-2 h-48 overflow-y-auto mb-2">
          {chatMessages.map((m, i) => (
            <div key={i} className={`mb-1 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <span
                className={`inline-block px-2 py-1 rounded ${
                  m.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
                }`}
              >
                {m.text}
              </span>
            </div>
          ))}
        </div>
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask something..."
            className="flex-1 border p-2 rounded"
          />
          <button className="bg-blue-600 text-white px-3 rounded">Send</button>
        </form>
      </div>

      {/* Project Cards */}
      <h2 className="text-2xl font-bold mb-4">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {projects.map((p) => {
          const projectTasks = tasks.filter((t) => t.projectId === p._id);
          const completed = projectTasks.filter((t) => t.status === 'Done').length;
          const progress = projectTasks.length
            ? Math.round((completed / projectTasks.length) * 100)
            : 0;

          // Bar chart data for this project
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
                  <div className="bg-green-500 h-2 rounded" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm mt-1">{progress}% Complete</p>
              </div>
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
