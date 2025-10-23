import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import AddProject from './pages/AddProject'; 
import AdminDashboard from './pages/AdminDashboard';
import API from './api';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await API.get('/users/me');
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (err) { console.log('not logged in'); }
    }
    if (user) fetchMe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4 flex justify-between">
        <div className="font-bold">ETPM</div>
        <div className="space-x-4">
          <Link to="/">Home</Link>
          {user ? (
            <>
              <span>{user.name}</span>
              <button onClick={handleLogout} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>

      <main className="p-6">
        <Routes>
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/add-project" element={user ? <AddProject /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login onLogin={(u, token) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(u)); setUser(u); }} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/project/:id" element={<ProjectPage user={user} />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />

        </Routes>
      </main>
    </div>
  )
}

export default App;
