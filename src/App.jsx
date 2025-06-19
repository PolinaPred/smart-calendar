import { useState } from 'react';
import reactLogo from './assets/react.svg';
import TaskForm from './components/TaskForm';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);

  const addTask = (task) => {
    setTasks(prev => [...prev, task]);
  };

  return (
    <div>
      <h1>Smart Calendar</h1>
      <TaskForm onAdd={addTask} />
      <h2>Tasks</h2>
      <ul>
        {tasks.map(t => (
          <li key={t.id}>
            {t.title} ({t.locked ? "Stone" : "Sand"}, {t.duration} hr{t.duration !== 1 ? 's' : ''})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
