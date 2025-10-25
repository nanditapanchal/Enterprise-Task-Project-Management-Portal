import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee'); // default role selected
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Please enter email and password");

    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password, role });

      const { user, token } = res.data;

      // Save token + user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user, token);

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }

    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {/* Role selection */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            type="button"
            onClick={() => setRole('employee')}
            className={`px-3 py-1 rounded ${role === 'employee' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Employee
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`px-3 py-1 rounded ${role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            className="w-full p-3 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-3 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className={`w-full p-3 rounded text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={loading}
          >
            {loading ? 'Logging in...' : `Login as ${role}`}
          </button>
        </form>
      </div>
    </div>
  );
}
