import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api';
import { io } from 'socket.io-client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';

export default function ProjectPage({ user }) {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({ 'To-Do': [], 'In Progress': [], 'Done': [] });
  const [members, setMembers] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const socketRef = useRef();
  const chatEndRef = useRef();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  useEffect(() => {
    loadProject();
    loadMessages();
    setupSocket();
    return () => socketRef.current?.disconnect();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (project?.members) setMembers(project.members);
  }, [project]);

  const loadProject = async () => {
    try {
      const res = await API.get(`/projects/${id}`);
      setProject(res.data);
      const t = await API.get(`/tasks/project/${id}`);
      const grouped = { 'To-Do': [], 'In Progress': [], 'Done': [] };
      t.data.forEach(task => {
        grouped[task.status] ? grouped[task.status].push(task) : grouped['To-Do'].push(task);
      });
      setTasks(grouped);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await API.get(`/messages/project/${id}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const setupSocket = () => {
    socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000');
    socketRef.current.emit('joinProject', { projectId: id });
    socketRef.current.on('newMessage', (m) => setMessages(prev => [...prev, m]));
    socketRef.current.on('taskUpdated', (updatedTask) => {
      setTasks(prev => {
        const newTasks = { ...prev };
        Object.keys(newTasks).forEach(col => {
          newTasks[col] = newTasks[col].filter(t => t._id !== updatedTask._id);
        });
        newTasks[updatedTask.status]?.push(updatedTask);
        return newTasks;
      });
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText) return;
    try {
      const res = await API.post(`/messages/project/${id}`, { text: messageText });
      socketRef.current.emit('sendMessage', res.data);
      setMessageText('');
    } catch (err) {
      console.error(err);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    if (sourceCol === destCol && source.index === destination.index) return;
    const movedTask = tasks[sourceCol].find(t => t._id === draggableId);
    const newSourceTasks = Array.from(tasks[sourceCol]);
    newSourceTasks.splice(source.index, 1);
    const newDestTasks = Array.from(tasks[destCol]);
    newDestTasks.splice(destination.index, 0, movedTask);
    setTasks({ ...tasks, [sourceCol]: newSourceTasks, [destCol]: newDestTasks });
    try {
      await API.put(`/tasks/${draggableId}`, { status: destCol });
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-500 text-white shadow';
      case 'Medium': return 'bg-yellow-400 text-black shadow';
      case 'Low': return 'bg-green-500 text-white shadow';
      default: return 'bg-gray-300 text-black';
    }
  };

  const deleteProject = async () => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await API.delete(`/projects/${id}`);
      alert('Project deleted');
      window.location.href = '/';
    } catch (err) {
      console.error(err);
    }
  };

  const editProject = async () => {
    const newName = prompt('Project Name', project.name);
    const newDesc = prompt('Description', project.description);
    if (!newName || !newDesc) return;
    try {
      const res = await API.put(`/projects/${id}`, { name: newName, description: newDesc });
      setProject(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/task/${taskId}`);
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  const editTask = async (task) => {
    if (!(user.role === 'admin' || task.assignee?._id === user.id)) return alert('Not allowed');
    const newTitle = prompt('Task Title', task.title);
    const newDesc = prompt('Description', task.description);
    if (!newTitle || !newDesc) return;
    try {
      await API.put(`/tasks/task/${task._id}`, { title: newTitle, description: newDesc });
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskStatus = async (task, newStatus) => {
    try {
      await API.put(`/tasks/task/${task._id}`, { status: newStatus });
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left/Main Section */}
      <div className="lg:col-span-2 space-y-6">

        {/* Project Info Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 rounded-2xl shadow-lg text-white flex justify-between items-center"
        >
          <div>
            <h2 className="text-2xl font-bold">{project?.name}</h2>
            <p className="opacity-90">{project?.description}</p>
          </div>
          {user.role === 'admin' && (
            <div className="space-x-2">
              <button onClick={editProject} className="px-3 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-300">Edit</button>
              <button onClick={deleteProject} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          )}
        </motion.div>

        {/* Add Task Form */}
        {user.role === 'admin' && (
          <motion.div className="bg-white p-5 rounded-xl shadow-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="font-bold text-gray-700 mb-3">➕ Add New Task</h3>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              if (!newTaskTitle || !newTaskDesc) return alert('Title and description required');
              try {
                await API.post(`/tasks/${id}`, {
                  title: newTaskTitle,
                  description: newTaskDesc,
                  assignee: newTaskAssignee,
                  priority: newTaskPriority,
                  status: 'To-Do',
                  deadline: newTaskDeadline
                });
                setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskAssignee('');
                setNewTaskPriority('Medium'); setNewTaskDeadline(''); loadProject();
              } catch (err) { console.error(err); }
            }}>
              <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Task Title" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"/>
              <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} placeholder="Description" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400" rows={2}/>
              <div className="flex gap-2">
                <select value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} className="p-2 border rounded flex-1 focus:ring-2 focus:ring-blue-400">
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-blue-400">
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
                <input type="date" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-blue-400"/>
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Add Task</button>
            </form>
          </motion.div>
        )}

        {/* Kanban Board */}
        <h3 className="font-bold text-gray-700">🗂️ Tasks</h3>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['To-Do', 'In Progress', 'Done'].map(col => (
              <Droppable droppableId={col} key={col}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`bg-white p-3 rounded-xl shadow-md min-h-[400px] border-t-4 ${
                      col === 'To-Do' ? 'border-red-400' :
                      col === 'In Progress' ? 'border-yellow-400' : 'border-green-400'
                    }`}>
                    <h4 className="font-semibold mb-3 text-gray-700">{col}</h4>
                    {(tasks[col] || []).map((task, index) => (
                      <Draggable draggableId={task._id} index={index} key={task._id}>
                        {(provided, snapshot) => (
                          <motion.div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            layout
                            className={`bg-gray-50 p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition ${snapshot.isDragging ? 'bg-blue-50' : ''}`}>
                            <div className="flex justify-between items-center">
                              <div className="font-medium">{task.title}</div>
                              <span className={`px-2 py-0.5 rounded text-xs ${getPriorityBadge(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              🗓 {new Date(task.deadline).toLocaleDateString()} | 👤 {task.assignee?.name || 'Unassigned'}
                            </div>
                            {(user.role === 'admin' || task.assignee?._id === user.id) && (
                              <div className="mt-2 flex gap-2">
                                <select value={task.status} onChange={(e) => updateTaskStatus(task, e.target.value)} className="p-1 border rounded text-xs">
                                  <option>To-Do</option><option>In Progress</option><option>Done</option>
                                </select>
                                <button onClick={() => editTask(task)} className="px-2 py-1 text-xs bg-yellow-400 rounded hover:bg-yellow-300">Edit</button>
                                <button onClick={() => deleteTask(task._id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Right Column: Chat with Profile */}
      <aside className="bg-white p-5 rounded-xl shadow-md flex flex-col h-full">
        <h3 className="font-bold text-gray-700 mb-2">💬 Project Chat</h3>
        
        <div className="h-64 overflow-auto border p-2 mb-3 rounded bg-gray-50 flex flex-col">
          {messages.map((m, i) => {
            const isMe = m.sender?._id === user.id;
            return (
              <div key={i} className={`flex items-start mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <img src={m.sender?.avatarUrl || '/default-avatar.png'} alt="Avatar"
                       className="w-8 h-8 rounded-full object-cover mr-2"/>
                )}
                <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                  isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}>
                  {!isMe && <div className="font-semibold text-xs mb-1">{m.sender?.name}</div>}
                  <div>{m.text}</div>
                </div>
                {isMe && (
                  <img src={user.avatarUrl || '/default-avatar.png'} alt="Avatar"
                       className="w-8 h-8 rounded-full object-cover ml-2"/>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef}></div>
        </div>

        <form onSubmit={sendMessage} className="flex gap-2 mt-auto">
          <input value={messageText} onChange={e => setMessageText(e.target.value)} 
                 className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-400" 
                 placeholder="Type a message..." />
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Send</button>
        </form>
      </aside>
    </div>
  );
}
