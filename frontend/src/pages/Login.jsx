import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Please enter email and password");

    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      const { user, token } = res.data;
      // Save token to localStorage or context
      localStorage.setItem('token', token);
      onLogin(user, token);
      navigate('/');
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
