import './ScheduleGrid.css';
import { generateWeekSchedule } from '../utils/scheduler';
import {format} from 'date-fns';

const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const getScheduledHourRange = (tasks) => {
    const hours = tasks
        .filter(t => t.scheduledAt)
        .map(t => new Date(t.scheduledAt).getHours());

    const minHour = Math.min(...hours, 8);
    const maxHour = Math.max(...hours, 18);

    return {
        minHour: Math.max(minHour - 1, 0), 
        maxHour: Math.min(maxHour + 1, 23)
    };
};

function getDayNameFromDate(dateString){
    const date = new Date(dateString);
    return daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

function getHourFromDate(dateString){
    return new Date(dateString).getHours();
}

export default function ScheduleGrid({ tasks }){
    const schedule = generateWeekSchedule(tasks);
    
    if (!schedule || Object.keys(schedule).length === 0){
        return <p style={{ textAlign: 'center', marginTop: '2rem'}}>No tasks to display.</p>;
    }
    console.log("Schedule passed to grid:", schedule);

    return (
        <div className="schedule-grid">
            {Object.entries(schedule).map(([day, slots])=>(
                <div key={day} className="day-column">
                    <h3>{day}</h3>
                    {slots.map(({task, start, end}) => (
                        <div key={`${task.id}-${start}`} className={`task-block ${task.locked ? 'Stone' : 'Sand'}`}>
                            <strong>{task.title}</strong><br />
                            <span>{format(new Date(start), "HH:mm")} - {format(new Date(end), "HH:mm")}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );



    /*
    const {minHour, maxHour} = getScheduledHourRange(tasks);
    const hours = Array.from({length: maxHour-minHour + 1}, (_, i) => i + minHour);
    return (
        <div className="schedule-grid">
            <div className="header-row">
                <div className="time-cell" />
                {daysOfWeek.map(day => (
                    <div key={day} className="day-header">{day}</div>
                ))}
            </div>
            {hours.map(hour => (
                <div key={hour} className="hour-row">
                    <div className='time-cell'>{hour}:00</div>
                    {daysOfWeek.map(day => (
                        <div key={day + hour} className="grid-cell">
                            {tasks.map(task => {
                                if (!task.scheduledAt) return null;
                                const taskDay = getDayNameFromDate(task.scheduledAt);
                                const taskHour = getHourFromDate(task.scheduledAt);
                                if (taskDay === day && taskHour === hour){
                                    return (
                                        <div 
                                            key={task.id} 
                                            className={`task-block ${task.locked ? 'locked' : ''}`}
                                        >
                                        {task.title}
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
    */
}