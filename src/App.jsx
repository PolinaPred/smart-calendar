import { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import TaskForm from './components/TaskForm';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("smart-tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if(loaded){
      localStorage.setItem("smart-tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  const addTask = (task) => {
    setTasks(prev => [...prev, task]);
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
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
            <button onClick={() => deleteTask(t.id)} style = {{ marginLeft: '1rem'}}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
