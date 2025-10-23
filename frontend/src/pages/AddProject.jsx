import React, { useState, useEffect } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

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
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Add Project</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 border" placeholder="Project Name" value={name} onChange={e => setName(e.target.value)} />
        <textarea className="w-full p-2 border" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <input type="date" className="w-full p-2 border" value={deadline} onChange={e => setDeadline(e.target.value)} />
        <div className="border p-2 rounded max-h-40 overflow-auto">
          {members.map(u => (
            <label key={u._id} className="block">
              <input type="checkbox" checked={selectedMembers.includes(u._id)} onChange={() => toggleMember(u._id)} />
              <span className="ml-2">{u.name} ({u.email})</span>
            </label>
          ))}
        </div>
        <button className="w-full bg-blue-600 text-white p-2 rounded">Create Project</button>
      </form>
    </div>
  )
}
