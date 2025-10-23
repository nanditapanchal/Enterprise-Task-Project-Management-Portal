import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api';
import { io } from 'socket.io-client';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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

  // Add Task state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  // Load project, tasks, messages
  useEffect(() => {
    loadProject();
    loadMessages();
    setupSocket();
    return () => socketRef.current?.disconnect();
  }, [id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (project?.members) setMembers(project.members); }, [project]);

  // Load project details and tasks
  const loadProject = async () => {
    try {
      const res = await API.get(`/projects/${id}`);
      setProject(res.data);
      const t = await API.get(`/tasks/project/${id}`);
      const grouped = { 'To-Do': [], 'In Progress': [], 'Done': [] };
      t.data.forEach(task => grouped[task.status]?.push(task));
      setTasks(grouped);
    } catch (err) { console.error(err); }
  };

  // Load chat messages
  const loadMessages = async () => {
    try {
      const res = await API.get(`/messages/project/${id}`);
      setMessages(res.data);
    } catch (err) { console.error(err); }
  };

  // Setup Socket.io
  const setupSocket = () => {
    socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000');
    socketRef.current.emit('joinProject', { projectId: id });
    socketRef.current.on('newMessage', (m) => setMessages(prev => [...prev, m]));
  };

  // Send chat message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText) return;
    try {
      const res = await API.post(`/messages/project/${id}`, { text: messageText });
      socketRef.current.emit('sendMessage', res.data);
      setMessageText('');
    } catch (err) { console.error(err); }
  };

  // Drag & Drop for Kanban board
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

    try { await API.put(`/tasks/task/${draggableId}`, { status: destCol }); } 
    catch (err) { console.error(err); }
  };

  // Priority badge
  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-yellow-400 text-black';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-300 text-black';
    }
  };

  // Project controls
  const deleteProject = async () => {
    if (!window.confirm('Delete this project?')) return;
    try { await API.delete(`/projects/${id}`); alert('Project deleted'); window.location.href = '/'; }
    catch (err) { console.error(err); }
  };
  const editProject = async () => {
    const newName = prompt('Project Name', project.name);
    const newDesc = prompt('Description', project.description);
    if (!newName || !newDesc) return;
    try { const res = await API.put(`/projects/${id}`, { name: newName, description: newDesc }); setProject(res.data); }
    catch (err) { console.error(err); }
  };

  // Task controls
  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await API.delete(`/tasks/task/${taskId}`); loadProject(); }
    catch (err) { console.error(err); }
  };
  const editTask = async (task) => {
    if (!(user.role === 'admin' || task.assignee?._id === user.id)) return alert('Not allowed');
    const newTitle = prompt('Task Title', task.title);
    const newDesc = prompt('Description', task.description);
    if (!newTitle || !newDesc) return;
    try { await API.put(`/tasks/task/${task._id}`, { title: newTitle, description: newDesc }); loadProject(); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      {/* Left/Main Column */}
      <div className="lg:col-span-2 space-y-4">

        {/* Project Info */}
        <div className="bg-white p-4 rounded shadow flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{project?.name}</h2>
            <p className="text-gray-600">{project?.description}</p>
          </div>
          {(user.role === 'admin' || user.id === project?.createdBy) && (
            <div className="space-x-2">
              <button onClick={editProject} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
              <button onClick={deleteProject} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
            </div>
          )}
        </div>

        {/* Add Task Form */}
        {(user.role === 'admin' || project?.members.some(m => m._id === user.id)) && (
          <motion.div
            className="bg-white p-4 rounded shadow mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="font-bold mb-2">Add New Task</h3>
            <form
              className="space-y-2"
              onSubmit={async (e) => {
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
                  setNewTaskPriority('Medium'); setNewTaskDeadline('');
                  loadProject();
                } catch (err) { console.error(err); }
              }}
            >
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Task Title"
                className="w-full p-2 border rounded"
              />
              <textarea
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
                placeholder="Description"
                className="w-full p-2 border rounded"
                rows={2}
              />
              <div className="flex gap-2">
                <select
                  value={newTaskAssignee}
                  onChange={e => setNewTaskAssignee(e.target.value)}
                  className="p-2 border rounded flex-1"
                >
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                <select
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <input
                  type="date"
                  value={newTaskDeadline}
                  onChange={e => setNewTaskDeadline(e.target.value)}
                  className="p-2 border rounded"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded mt-2 hover:bg-blue-700">
                Add Task
              </button>
            </form>
          </motion.div>
        )}

        {/* Kanban Board */}
        <h3 className="font-bold mb-2">Tasks</h3>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['To-Do', 'In Progress', 'Done'].map(col => (
              <Droppable droppableId={col} key={col}>
                {(provided) => (
                  <div className="bg-gray-100 p-3 rounded min-h-[400px]" ref={provided.innerRef} {...provided.droppableProps}>
                    <h4 className="font-semibold mb-2">{col}</h4>
                    {tasks[col].map((task, index) => (
                      <Draggable draggableId={task._id} index={index} key={task._id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 mb-2 rounded shadow ${snapshot.isDragging ? 'bg-blue-100' : ''}`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="font-semibold">{task.title}</div>
                              <span className={`px-2 py-0.5 rounded text-xs ${getPriorityBadge(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">{task.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Deadline: {new Date(task.deadline).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Assignee: {task.assignee?.name || 'Unassigned'}
                            </div>

                            {(user.role === 'admin' || task.assignee?._id === user.id) && (
                              <div className="mt-2 space-x-2">
                                <button onClick={() => editTask(task)} className="px-2 py-1 text-sm bg-yellow-400 rounded">Edit</button>
                                <button onClick={() => deleteTask(task._id)} className="px-2 py-1 text-sm bg-red-500 text-white rounded">Delete</button>
                              </div>
                            )}
                          </div>
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

      {/* Right Column: Chat */}
      <aside className="bg-white p-4 rounded shadow flex flex-col h-full">
        <h3 className="font-bold mb-2">Project Chat</h3>
        <div className="h-64 overflow-auto border p-2 mb-2 flex-1">
          {messages.map((m, i) => (
            <div key={i} className="mb-2">
              <div className="text-sm font-semibold">{m.sender?.name || m.sender}</div>
              <div className="text-sm text-gray-700">{m.text}</div>
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>
        <form onSubmit={sendMessage} className="flex gap-2 mt-auto">
          <input value={messageText} onChange={e => setMessageText(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Message..." />
          <button className="px-3 py-1 bg-blue-600 text-white rounded">Send</button>
        </form>
      </aside>
    </div>
  );
}
