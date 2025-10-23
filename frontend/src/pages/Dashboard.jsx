import React, { useEffect, useState } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
    } catch (err) { console.error(err); }
  }

  const loadTasks = async () => {
    try {
      const res = await API.get('/tasks');
      setTasks(res.data);
    } catch (err) { console.error(err); }
  }

  // Stats calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Done').length;

  // Pie chart data
  const pieData = {
    labels: ['To-Do / In Progress', 'Done'],
    datasets: [{
      label: 'Task Status',
      data: [pendingTasks, completedTasks],
      backgroundColor: ['#fbbf24', '#34d399'],
      borderWidth: 1
    }]
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link to="/add-project" className="px-3 py-2 bg-blue-600 text-white rounded">+ New Project</Link>
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

      {/* Project Cards */}
      <h2 className="text-2xl font-bold mb-4">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {projects.map(p => {
          const projectTasks = tasks.filter(t => t.projectId === p._id);
          const completed = projectTasks.filter(t => t.status === 'Done').length;
          const progress = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0;

          return (
            <div key={p._id} className="bg-white p-4 rounded shadow">
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-sm text-gray-600">{p.description}</p>

              {/* Display members */}
              {p.members && p.members.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Members: {p.members.map(m => m.name).join(', ')}
                </p>
              )}

              <div className="mt-2">
                <div className="w-full bg-gray-200 h-2 rounded">
                  <div className="bg-green-500 h-2 rounded" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm mt-1">{progress}% Complete</p>
              </div>
              <div className="mt-2">
                <Link to={`/project/${p._id}`} className="text-blue-600">Open Project</Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Task Status Pie Chart */}
      <div className="bg-white p-4 rounded shadow w-full md:w-1/2">
        <h2 className="text-lg font-bold mb-2">Task Status</h2>
        <Pie data={pieData} />
      </div>
    </div>
  )
}
