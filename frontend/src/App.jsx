import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import AddProject from './pages/AddProject'; 
import AdminDashboard from './pages/AdminDashboard';
import API from './api';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await API.get('/users/me');
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (err) { 
        console.log('not logged in'); 
      }
    }
    if (user) fetchMe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const handleLogin = (u, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);

    // ✅ Redirect based on role
    if (u.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4 flex justify-between">
        <div className="font-bold text-lg">ETPM</div>
        <div className="space-x-4 flex items-center">
          <Link to="/">Home</Link>
          {user ? (
            <>
              <span className="text-gray-600">{user.name}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
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
  <Route
    path="/"
    element={
      user ? (
        user.role === 'admin' ? <Navigate to="/admin" /> : <Dashboard user={user} />
      ) : (
        <Navigate to="/login" />
      )
    }
  />
  <Route path="/login" element={<Login onLogin={(u, token) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(u)); setUser(u); }} />} />
  <Route path="/register" element={<Register />} />
  <Route path="/add-project" element={user ? <AddProject /> : <Navigate to="/login" />} />
  <Route path="/project/:id" element={<ProjectPage user={user} />} />
  <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
</Routes>

      </main>
    </div>
  );
}

export default App;
