import React, { useState, useEffect } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AddProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUsers() {
      const res = await API.get('/users');
      setMembers(res.data);
    }
    fetchUsers();
  }, []);

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/projects', { name, description, deadline, members: selectedMembers });
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating project');
    }
  }

  return (
    <motion.div
      className="max-w-md mx-auto bg-white p-6 rounded shadow mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold mb-4 text-center">Add Project</h2>
      <form onSubmit={submit} className="space-y-3">

        {/* Project Name */}
        <motion.input
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          placeholder="Project Name"
          value={name}
          onChange={e => setName(e.target.value)}
          whileFocus={{ scale: 1.02 }}
        />

        {/* Description */}
        <motion.textarea
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          whileFocus={{ scale: 1.02 }}
        />

        {/* Deadline */}
        <motion.input
          type="date"
          className="w-full p-2 border border-red-400 rounded focus:outline-none focus:ring-2 focus:ring-red-400 transition"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          whileFocus={{ scale: 1.02 }}
        />

        {/* Members */}
        <div className="border p-2 rounded max-h-40 overflow-auto">
          {members.map(u => (
            <motion.label 
              key={u._id} 
              className="block cursor-pointer hover:bg-gray-50 p-1 rounded transition"
              whileHover={{ scale: 1.02 }}
            >
              <input 
                type="checkbox" 
                checked={selectedMembers.includes(u._id)} 
                onChange={() => toggleMember(u._id)} 
              />
              <span className="ml-2">{u.name} ({u.email})</span>
            </motion.label>
          ))}
        </div>

        {/* Submit Button */}
        <motion.button
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition transform hover:scale-105"
          type="submit"
          whileTap={{ scale: 0.97 }}
        >
          Create Project
        </motion.button>
      </form>
    </motion.div>
  )
}
