import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import AddProject from './pages/AddProject'; 
import AdminDashboard from './pages/AdminDashboard';
import API from './api';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await API.get('/users/me');
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (err) { 
        console.log('not logged in'); 
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchMe();
    else setLoading(false);
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
    if (u.role === 'admin') navigate('/admin');
    else navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
        <motion.div 
          className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100">
      {/* Navbar */}
      <motion.nav 
        className="bg-white shadow p-4 flex justify-between items-center"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Enterprise Task & Project Management Portal</div>
        <div className="flex items-center space-x-4">
          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Link to="/" className="text-gray-700 hover:text-indigo-500 font-medium">Home</Link>
          </motion.div>
          {user ? (
            <>
              <motion.span 
                className="text-gray-600 font-medium"
                whileHover={{ scale: 1.05 }}
              >
                {user.name}
              </motion.span>
              <motion.button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </>
          ) : (
            <>
              <motion.div whileHover={{ scale: 1.1 }}>
                <Link to="/login" className="text-gray-700 hover:text-indigo-500 font-medium">Login</Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }}>
                <Link to="/register" className="text-gray-700 hover:text-indigo-500 font-medium">Register</Link>
              </motion.div>
            </>
          )}
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="bg-white shadow-xl rounded-2xl p-6"
          >
            <Routes>
              <Route
                path="/"
                element={
                  user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Dashboard user={user} />)
                       : (<Navigate to="/login" />)
                }
              />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/add-project" element={user ? <AddProject /> : <Navigate to="/login" />} />
              <Route path="/project/:id" element={<ProjectPage user={user} />} />
              <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
