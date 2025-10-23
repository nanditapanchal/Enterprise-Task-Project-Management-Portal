import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return alert("All fields are required");

    setLoading(true);
    try {
      await API.post('/auth/register', { name, email, password });
      alert('Registered successfully! Please login.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            className="w-full p-3 border rounded focus:outline-none focus:ring focus:ring-green-300"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="email"
            className="w-full p-3 border rounded focus:outline-none focus:ring focus:ring-green-300"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-3 border rounded focus:outline-none focus:ring focus:ring-green-300"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className={`w-full p-3 rounded text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
