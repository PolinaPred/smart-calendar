import { use, useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import TaskForm from './components/TaskForm';
import viteLogo from '/vite.svg';
import './App.css';
import ScheduleGrid from './components/ScheduleGrid';
import TaskEditor from './components/TaskEditor';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('list');
  const [darkMode, setDarkMode] = useState(false);

  const [editingTask, setEditingTask] = useState(null);

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

  useEffect(() => {
    const saved = localStorage.getItem('smart-theme');
    if (saved) setDarkMode (saved === 'dark');
  }, []);

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem("smart-theme", theme);
  }, [darkMode]);

  const handleSave = (updatedTask) => {
    const isInstance = updatedTask.originalId && updatedTask.id.includes("-r");
    const baseId = isInstance ? updatedTask.originalId : updatedTask.id;
      
    setTasks(prevTasks =>{
        return prevTasks.map(task => {
          const isCurrentInstance = isInstance && task.id === updatedTask.id;
          const isBase = task.id === baseId;
          const isRelatedInstance = task.originalId === baseId;

          //Apply to all instances:
          if(updatedTask.applyBufferToRepeats) {
            if(isBase){
              const newBaseTask = {...task};
              //apply to base
              if (updatedTask.changedBefore){
                newBaseTask.bufferBefore = updatedTask.bufferBefore;
              }
              if(updatedTask.changedAfter){
                newBaseTask.bufferAfter = updatedTask.bufferAfter;
              }
              //update instances whose override doesn't already override the field that is being changed
              const oldOverrides = newBaseTask.instanceOverrides || {};
              const newOverrides = {...oldOverrides};
              
              for (const [instanceId, override] of Object.entries(oldOverrides)) {
                const updatedOverride = {...override};

                if(
                  updatedTask.changedBefore &&
                  (override.bufferBefore === undefined || override.bufferBefore === null)
                ) {
                  updatedOverride.bufferBefore = updatedTask.bufferBefore;
                }

                if (
                  updatedTask.changedAfter &&
                  (override.bufferAfter === undefined || override.bufferAfter === null)
                ) {
                  updatedOverride.bufferAfter = updatedTask.bufferAfter;
                }

                  newOverrides[instanceId] = updatedOverride;
                
              }
              newBaseTask.instanceOverrides = newOverrides;
              return newBaseTask;
            }

            return task;
          }
          //Individual instance updates:
          if(isInstance && isCurrentInstance){
            const overrides = { ...(task.instanceOverrides || {}) };
            const newOverride = { ...(overrides[updatedTask.id] || {})};
            
            if(updatedTask.changedBefore){
              newOverride.bufferBefore = updatedTask.bufferBefore;
            }
            if(updatedTask.changedAfter){
              newOverride.bufferAfter = updatedTask.bufferAfter;
            }
            //remove override if the property matches base
            if(newOverride.bufferBefore === baseTask.bufferBefore){
              delete newOverride.bufferBefore;
            }
            if(newOverride.bufferAfter === baseTask.bufferAfter){
              delete newOverride.bufferAfter;
            }
            const updatedOverrides = {...overrides};
            if(Object.keys(newOverride).length > 0){
              updatedOverrides[updatedTask.id] = newOverride;
            }else{
              delete updatedOverrides[updatedTask.id];
            }
            return {
              ...baseTask,
              instanceOverrides: updatedOverrides
            };
          }
          //Update base task separately:
          if(!isInstance && isBase){
            const newBaseTask = {...task};
            if (updatedTask.changedBefore){
              newBaseTask.bufferBefore = updatedTask.bufferBefore;
            }
            if(updatedTask.changedAfter){
              newBaseTask.bufferAfter = updatedTask.bufferAfter;
            }
            return newBaseTask;
          }
          return task;
        });
      });
      setEditingTask(null);
    }

  return (
  <div>
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000
      }}>
        <label className="floating-toggle"
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={() => setDarkMode(prev => !prev)}
          />
          <span className="slider"/>
          <span className="emoji">
            {darkMode ? '🌙' : '☀️'}
          </span>
        </label>
    </div>


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
            {tasks.map(t => {
              const isInstance = t.originalId && t.id.includes("-r");
              const baseTask = isInstance
                ? tasks.find(base => base.id === t.originalId)
                : t;

                const override = isInstance
                  ? baseTask?.instanceOverrides?.[t.id] || {}
                  : {};

                const bufferBefore = override.bufferBefore ?? baseTask.bufferBefore;
                const bufferAfter = override.bufferAfter ?? baseTask.bufferAfter;
                
                return (
                  <li key={t.id}>
                    {t.title} ({t.locked ? "Stone" : "Sand"}, {t.duration} hr{t.duration !== 1 ? 's' : ''}) <br />
                    Buffer: before {bufferBefore} min, after {bufferAfter} min
                
                <button onClick={() => setEditingTask(t)} style={{marginLeft:'1rem', marginBottom: '0.6rem', paddingTop: '0.2rem', paddingBottom: '0.4rem'}}>
                  Edit
                </button>

                <button onClick={() => deleteTask(t.id)} style = {{ marginLeft: '1rem', marginBottom: '0.6rem', paddingTop: '0.2rem', paddingBottom: '0.4rem'}}>
                  Delete
                </button>
              </li>
                );
            })}
          </ul>
        </>
      ):(
        <>
          <h2>Weekly View</h2>
          <div style={{width: '100%', overflowX: 'auto'}}>
            <ScheduleGrid tasks={tasks} setEditingTask={setEditingTask} />
          </div>
        </>
      )}
    </div>
    {editingTask && (
                <TaskEditor
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onSave={handleSave}
                />
            )}
  </div>
  );
}

export default App;
