import { useState } from 'react';

export default function TaskForm({ onAdd }){
    const[title, setTitle] = useState('');
    const[duration, setDuration] = useState('');
    const[locked, setLocked] = useState(false);
    const[scheduledAt, setScheduledAt] = useState('');
    const[repeating, setRepeating] = useState(false);
    const[repeatEveryValue, setRepeatEveryValue] = useState(1);
    const[repeatEveryUnit, setRepeatEveryUnit] = useState('week');
    const[repeatDay, setRepeatDay] = useState([]);
    const[notes, setNotes] = useState('');

const handleSubmit = (e) => {
    e.preventDefault();
    if(!title || !duration) return alert('Please enter a title and duration');

    const task = {
        id: Date.now().toString(),
        title,
        duration: parseFloat(duration),
        locked,
        repeating,
        repeatEvery: repeating && locked == false
            ? { value: repeatEveryValue, unit: repeatEveryUnit}
            : null,
        repeatOn: repeating && locked == true
            ? { day: repeatDay }
            : null,
        scheduledAt: locked ? scheduledAt : null,
        notes,
    };

    onAdd(task);

    //Reset form
    setTitle('');
    setDuration('');
    setLocked(false);
    setScheduledAt();
    setRepeating(false);
    setRepeatEveryValue(1);
    setRepeatEveryUnit('week');
    setNotes('');
};

return (
    <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }}>
    {
    <form 
        onSubmit={handleSubmit} 
        className="task-form"
        style={{ 
            display: 'grid', 
            gap: '1rem',
            maxWidth: '500px',
            width: '100%',
            marginBottom: '2rem'
        }}
    >
        <h2>Create New Task</h2>

    <div className="form-row">
        <label htmlFor="title">Title:</label>
        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required/>
    </div>
    
    <div className="form-row">
        <label>Duration (hours):</label>
        <input
            type="number"
            step="0.25"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            required
        />
    </div>

    <div className="form-row">
        <label>Is this a stone?</label>
        <input
            type="checkbox"
            checked={locked}
            onChange={e => setLocked(e.target.checked)}
        />
    </div>
    
    {locked && (
        <div className="form-row">
            <label>Scheduled At:</label>
            <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                step="60"
            />
        </div>
    )}
    
    <div className="form-row">
        <label>Is this task recurring?</label>
        <input
            type="checkbox"
            checked={repeating}
            onChange={e => setRepeating(e.target.checked)}
        />
    </div>
    
    {repeating && (
            <>
            {locked == false && (
                <div className="form-row">
                <label>Complete every:</label>
                <input
                    type="number"
                    min="1"
                    value={repeatEveryValue}
                    onChange={e => setRepeatEveryValue(e.target.value)}
                    style={{width: '4rem', marginRight: '0.5rem'}}
                />
                <select
                    value={repeatEveryUnit}
                    onChange={e => setRepeatEveryUnit(e.target.value)}
                >
                    <option value="day">Day(s)</option>
                    <option value="week">Week(s)</option>
                    <option value="month">Month(s)</option>
                </select>
                </div>
            )}

            {locked == true && (
                <fieldset>
                    <legend>Repeat on:</legend>
                    {['Monday',"Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day =>(
                        <label key={day} style={{display: 'block', marginBottom: '4px'}}>
                            <input
                                type="checkbox"
                                value={day}
                                checked={repeatDay.includes(day)}
                                onChange={e => {
                                    const checked = e.target.checked;
                                        setRepeatDay(prev => {
                                            if (checked) {
                                                return prev.includes(day) ? prev : [...prev, day];
                                            }else{
                                                return prev.filter(d => d !== day);
                                            }
                                    });
                                }}
                            />
                            {day}
                        </label>
                    ))}
                </fieldset>
            )}
            </>
    )}
    
    <div className="form-row">
        <label>Notes:</label>
        <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
        />
    </div>
    
    <button 
    type="submit" 
    style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        width: '160px',
        margin: '0 auto'
    }}>
        Add Task
    </button>
    
    </form>
    }
    </div>
    );
}