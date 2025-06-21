import './ScheduleGrid.css';
import { generateWeekSchedule } from '../utils/scheduler';
import {format} from 'date-fns';
import React from 'react';

const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function ScheduleGrid({ tasks, setEditingTask }){
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
                    {slots.map(({task, start, end}) => {
                        const bufferBefore = task.bufferBefore || 0;
                        const bufferAfter = task.bufferAfter || 0;

                        return(
                            <div key={`${task.id}-${start}`} className="task-wrapper">
                                {bufferBefore > 0 && (
                                    <div className="buffer-zone before" style={{height: `${(bufferBefore / 60) * 100}%`}}/>
                                )}

                                <div onClick={() => setEditingTask(task)} key={`${task.id}-${start}`} className={`task-block ${task.locked ? 'Stone' : 'Sand'}`}>
                                    <strong>{task.title}</strong><br />
                                    <span>
                                        {format(new Date(start), "hh:mm")} - {format(new Date(end), "hh:mmaaa").toLowerCase()}
                                    </span>
                                </div>

                                {bufferAfter > 0 && (
                                    <div className="buffer-zone after" style={{ height: `${(bufferAfter / 60) * 100}%` }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
            
        </div>
    );
}