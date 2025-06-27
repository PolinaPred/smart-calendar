import './ScheduleGrid.css';
import { generateWeekSchedule } from '../utils/scheduler';
import {format} from 'date-fns';
import React from 'react';
import {addMinutes} from 'date-fns';

const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function ScheduleGrid({ tasks, setEditingTask }){
    const schedule = generateWeekSchedule(tasks);

    if (!schedule || Object.keys(schedule).length === 0){
        return <p style={{ textAlign: 'center', marginTop: '2rem'}}>No tasks to display.</p>;
    }

    return (
        <div className="schedule-grid">
            {Object.entries(schedule).map(([day, slots])=>(
                <div key={day} className="day-column">
                    <h3>{day}</h3>
                    {slots.map(({task, start, end, rawStart}) => {
                        const isInstance = task.originalId && task.id.includes("-r");
                        const baseTask = isInstance
                            ? tasks.find(t => t.id === task.originalId)
                            : task;
                        
                        const override = isInstance
                            ? baseTask?.instanceOverrides?.[task.id] || {}
                            : {};
                        
                        const bufferBefore = override.bufferBefore ?? baseTask.bufferBefore ?? 0;
                        const bufferAfter = override.bufferAfter ?? baseTask.bufferAfter ?? 0;

                        const MINUTE_HEIGHT = 2;
                        const bufferBeforeHeight = bufferBefore * MINUTE_HEIGHT;
                        const bufferAfterHeight = bufferAfter * MINUTE_HEIGHT;
                        const totalMinutes = (new Date(end) - new Date(start)) / 60000;
                        const taskHeight = (totalMinutes - bufferBefore - bufferAfter) * MINUTE_HEIGHT;

                        return(
                            <div key={`${task.id}-${start}`} className="task-wrapper">
                                {bufferBefore > 0 && (
                                    <div 
                                    className="buffer-zone before" 
                                    style={{height: `${bufferBeforeHeight}px`}}>
                                    <span className="buffer-label">
                                        {format(new Date(start), "hh:mmaaa").toLowerCase()}<br/>
                                        ({bufferBefore} min)
                                    </span>
                                    </div>
                                )}

                                <div onClick={() => {
                                    const fullTask = tasks.find(t => t.id === task.originalId || t.id === task.id);
                                    if(!fullTask) return;
                                    setEditingTask({
                                        ...fullTask,
                                        id: task.id,
                                        originalId: task.originalId
                                    });
                                }}
                                    className={`task-block ${task.locked ? 'Stone' : 'Sand'}`}
                                    style ={{height: `${taskHeight}px`}}>
                                    <strong>{task.title}</strong><br />
                                    <span>
                                        {format(new Date(rawStart), "hh:mmaaa")} - {format(addMinutes(new Date(rawStart), task.duration * 60), "hh:mmaaa").toLowerCase()}
                                    </span>
                                </div>

                                {bufferAfter > 0 && (
                                    <div 
                                    className="buffer-zone after" 
                                    style={{ height: `${bufferAfterHeight}px` }}>
                                    <span className="buffer-label">
                                        ({bufferAfter} min) <br/>
                                        {format(new Date(end), "hh:mmaaa").toLowerCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
            
        </div>
    );
}