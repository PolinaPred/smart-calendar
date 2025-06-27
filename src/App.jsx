import { use, useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import TaskForm from './components/TaskForm';
import viteLogo from '/vite.svg';
import './App.css';
import ScheduleGrid from './components/ScheduleGrid';
import TaskEditor from './components/TaskEditor';
import ConfirmModal from './components/ConfirmModal';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('list');
  const [darkMode, setDarkMode] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);
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

  const [confirming, setConfirming] = useState(false);

  const handleSave = (updatedTask) => {
    if(view === 'list'){
      handleConfirm(true, updatedTask);
    } else {
      setPendingSave(updatedTask);
      setConfirming(true);
    }
  };
  const handleConfirm = (applyToAll, task = pendingSave) => {
    if (!task) return;
  
    const isInstance = task.originalId && task.id.includes("-r");
    const baseId = isInstance ? task.originalId : task.id;
    const baseTask = tasks.find(t => t.id === baseId);
    
    const taskToSave = {
      ...task,
      applyBufferToRepeats: applyToAll
    };

    setTasks(prevTasks =>{
        return prevTasks.map(task => {
          const isCurrentInstance = isInstance && task.id === task.id;
          const isBase = task.id === baseId;
          
          //Apply to all instances:
          if(taskToSave.applyBufferToRepeats) {
            if(isBase){
              const newBaseTask = {...task};
              //apply to base
              if (taskToSave.changedBefore){
                newBaseTask.bufferBefore = taskToSave.bufferBefore;
              }
              if(taskToSave.changedAfter){
                newBaseTask.bufferAfter = taskToSave.bufferAfter;
              }
              if (view === 'list'){
                newBaseTask.instanceOverrides = {};
              } else {

              //update instances whose override doesn't already override the field that is being changed
              const oldOverrides = newBaseTask.instanceOverrides || {};
              const newOverrides = {...oldOverrides};
              
              for (const [instanceId, override] of Object.entries(oldOverrides)) {
                const updatedOverride = {...override};

                if(
                  taskToSave.changedBefore &&
                  (override.bufferBefore === undefined || override.bufferBefore === null)
                ) {
                  updatedOverride.bufferBefore = taskToSave.bufferBefore;
                }

                if (
                  taskToSave.changedAfter &&
                  (override.bufferAfter === undefined || override.bufferAfter === null)
                ) {
                  updatedOverride.bufferAfter = taskToSave.bufferAfter;
                }

                  newOverrides[instanceId] = updatedOverride;
                
              }
              newBaseTask.instanceOverrides = newOverrides;
            }
              return newBaseTask;
            }

            return task;
          }

          if(isBase && view !== 'list'){
            const base = {...task};
            const overrides = { ...(baseTask.instanceOverrides || {}) };
            const newOverride = { ...(overrides[pendingSave.id] || {})};
            
            if(taskToSave.changedBefore){
              newOverride.bufferBefore = taskToSave.bufferBefore;
            }
            if(taskToSave.changedAfter){
              newOverride.bufferAfter = taskToSave.bufferAfter;
            }
            //remove override if the property matches base
            if(newOverride.bufferBefore === base.bufferBefore){
              delete newOverride.bufferBefore;
            }
            if(newOverride.bufferAfter === base.bufferAfter){
              delete newOverride.bufferAfter;
            }
            const updatedOverrides = {...overrides};
            if(Object.keys(newOverride).length > 0){
              updatedOverrides[pendingSave.id] = newOverride;
            }else{
              delete updatedOverrides[pendingSave.id];
            }
            base.instanceOverrides = updatedOverrides;
            return base;
          }
            
            return task;
        });
      });
      setEditingTask(null);
      setConfirming(false);
      setPendingSave(null);
    };

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
    {confirming && (
      <ConfirmModal
      message="Apply changes to all future events?"
      onConfirm={handleConfirm}
      />
    )}
  </div>
  );
}

export default App;
