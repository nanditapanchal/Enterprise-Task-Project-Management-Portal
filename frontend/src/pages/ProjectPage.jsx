import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api';
import { io } from 'socket.io-client';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function ProjectPage({ user }) {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({ 'To-Do': [], 'In Progress': [], 'Done': [] });
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const socketRef = useRef();
  const chatEndRef = useRef();

  // Load project, tasks, messages
  useEffect(() => {
    loadProject();
    loadMessages();
    setupSocket();
    return () => socketRef.current?.disconnect();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // Update task status on backend
    try {
      await API.put(`/tasks/${draggableId}`, { status: destCol });
    } catch (err) { console.error(err); }
  };

  // Priority badge styles
  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-yellow-400 text-black';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-300 text-black';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      {/* Left/Main Column: Project Details & Kanban */}
      <div className="lg:col-span-2 space-y-4">
        {/* Project Info */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold">{project?.name}</h2>
          <p className="text-gray-600">{project?.description}</p>
        </div>

        {/* Kanban Board */}
        <h3 className="font-bold mb-2">Tasks</h3>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['To-Do', 'In Progress', 'Done'].map(col => (
              <Droppable droppableId={col} key={col}>
                {(provided) => (
                  <div
                    className="bg-gray-100 p-3 rounded min-h-[400px]"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <h4 className="font-semibold mb-2">{col}</h4>
                    {tasks[col].map((task, index) => (
                      <Draggable draggableId={task._id} index={index} key={task._id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 mb-2 rounded shadow ${
                              snapshot.isDragging ? 'bg-blue-100' : ''
                            }`}
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
          <input
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Message..."
          />
          <button className="px-3 py-1 bg-blue-600 text-white rounded">Send</button>
        </form>
      </aside>
    </div>
  );
}
