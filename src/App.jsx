import { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import TaskForm from './components/TaskForm';
import viteLogo from '/vite.svg';
import './App.css';
import ScheduleGrid from './components/ScheduleGrid';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('list');

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
    <div style={{maxWidth: '900px', margin: '0 auto', padding: '1rem'}}>
      <h1>Smart Calendar</h1>
      <div style={{marginBottom: '2rem'}}>
        <TaskForm onAdd={addTask} />
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setView('list')}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: view === 'list' ? '#4caf50' : '#ccc',
            color: view === 'list' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          List View
        </button>

        <button
          onClick={() => setView('week')}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: view === 'week' ? '#4caf50' : '#ccc',
            color: view === 'week' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Week View
        </button>
      </div>

      {view === 'list' ? (
        <>
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
        </>
      ):(
        <>
          <h2>Weekly View</h2>
          <div style={{width: '100%', overflowX: 'auto'}}>
            <ScheduleGrid tasks={tasks} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
