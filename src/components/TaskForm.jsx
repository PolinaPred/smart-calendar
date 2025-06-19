import { useState } from 'react';

export default function TaskForm({ onAdd }){
    const[title, setTitle] = useState('');
    const[duration, setDuration] = useState('');
    const[locked, setLocked] = useState(false);
    const[scheduledAt, setScheduledAt] = useState('');
    const[repeating, setRepeating] = useState(false);
    const[repeatEveryValue, setRepeatEveryValue] = useState(1);
    const[repeatEveryUnit, setRepeatEveryUnit] = useState('week');
    const[repeatDay, setRepeatDay] = useState('Monday');
    const[repeatTime, setRepeatTime] = useState('12:00');
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
            ? { day: repeatDay, time: repeatTime }
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
    setRepeatTime('12:00');
    setNotes('');
};

return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem'}}>
        <h2>Create New Task</h2>

    <label>
        Title:
        <input value={title} onChange={e => setTitle(e.target.value)} required/>
    </label>
    
    <label>
        Duration (hours):
        <input
        type="number"
        step="0.25"
        value={duration}
        onChange={e => setDuration(e.target.value)}
        required
        />
    </label>

    <label>
        Is this a stone?
        <input
        type="checkbox"
        checked={locked}
        onChange={e => setLocked(e.target.checked)}
        />
    </label>

    {locked && (
        <label>
            Scheduled At:
            <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
            />
        </label>
    )}

    <label>
        Is this task recurring?
        <input
        type="checkbox"
        checked={repeating}
        onChange={e => setRepeating(e.target.checked)}
        />
    </label>
    
    {repeating && (
        <>
        {locked == false && (
            <label>
                Complete every:
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
            </label>
        )}

        {locked == true && (
            <>
            <label>
                Repeat on day:
                <select
                    value={repeatDay}
                    onChange={e => setRepeatDay(e.target.value)}
                >
                    {['Monday',"Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day =>(
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </label>

            <label>
                At time:
                <input 
                    type="time"
                    value={repeatTime}
                    onChange={e => setRepeatTime(e.target.value)}
                />
            </label>
            </>
        )}
        </>
    )}

    <label>
        Notes:
        <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
        />
    </label>
    
    <button type="submit">Add Task</button>
    
    </form>
    );
}