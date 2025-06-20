import {parseISO, addMinutes, format, isBefore, addDays, addWeeks, addMonths, differenceInDays} from 'date-fns';

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const START_HOUR = 6;
const END_HOUR = 22;

function initWeekGrid() {
    const grid = {};
    for (let day of DAYS){
        grid[day] = [];
    }
    return grid;
}

function hasSpace(daySlots, startTime, duration){
    const endTime = addMinutes(startTime, duration * 60);
    
    for (let slot of daySlots){
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);

        const overlaps = startTime <slotEnd && endTime > slotStart;

        if(overlaps)return false; 
    }
    return true;
}

function expandRepeatingTasks(tasks){
    const expanded = [];

    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(currentWeekStart.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

    for (const task of tasks){
        if (task.repeating && !task.locked && task.repeatEvery){
            const {value, unit} = task.repeatEvery;
            const baseDate = task.createdAt ? new Date(task.createdAt) : new Date(task.id ? parseInt(task.id) : Date.now());

            for (let d = new Date(currentWeekStart); d <= currentWeekEnd; d.setDate(d.getDate() + 1)){
                const diff = differenceInDays(d, baseDate);

                let match = false;
                if (unit === 'day'){
                    match = diff % value === 0;
                } else if (unit === 'week'){
                    match = diff % (7 * value) === 0;
                } else if (unit === 'month') {
                    const monthsPassed = (d.getFullYear() - baseDate.getFullYear()) * 12 + (d.getMonth() - baseDate.getMonth());
                    match = monthsPassed % value === 0 && d.getDate() === baseDate.getDate();
                }

                if(match){
                    const clone = {
                        ...task,
                        id: `${task.id}-r${d.toDateString()}`,
                        scheduledAt: null
                    };
                    expanded.push(clone);
                }
            }
        } else if (task.repeating && task.locked && task.repeatOn?.day?.length){
            for (const day of task.repeatOn.day){
                const index = DAYS.indexOf(day);
                if (index !== -1) {
                    const d = new Date(currentWeekStart);
                    d.setDate(currentWeekStart.getDate() + index);
                    const time = task.scheduledAt ? new Date(task.scheduledAt) : new Date();
                    d.setHours(time.getHours(), time.getMinutes(), 0, 0);

                    const clone = {
                        ...task, 
                        id: `${task.id}-r${d.toDateString()}`, 
                        scheduledAt: d.toISOString()
                    };
                    expanded.push(clone);
                }
            }
        } else{
            expanded.push(task);
        }
    }
    return expanded;
}

function insertFlexible(task, weekGrid){
    const durationMins = task.duration * 60;
    const now = new Date();

    for (let i = 0; i < 7; i++){
        const testDate = new Date(now);
        testDate.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + i);
        testDate.setHours(START_HOUR, 0,0,0);

        const latestStart = new Date(testDate);
        latestStart.setHours(END_HOUR, 0, 0, 0);
        latestStart.setTime(latestStart.getTime() - durationMins * 60 * 1000);
        
        while (testDate <= latestStart) {
            const day = DAYS[(testDate.getDay() + 6) % 7];

            if (hasSpace(weekGrid[day], testDate, task.duration)){
                const end = addMinutes(testDate, durationMins);
                weekGrid[day].push({
                    start: testDate.toISOString(),
                    end: end.toISOString(),
                    task
                });
                return;
            }
            testDate.setMinutes(testDate.getMinutes() + 15);
        }
    }
}

export function generateWeekSchedule(tasks) {
    const grid = initWeekGrid();
    const expandedTasks = expandRepeatingTasks(tasks);

    for (let task of expandedTasks){
        if(task.locked && task.scheduledAt){
            const date = new Date(task.scheduledAt);
            const day = DAYS[(date.getDay() + 6) % 7];
            const end = addMinutes(date, task.duration * 60);

            if (DAYS.includes(day)){
                grid[day].push({
                    start: date.toISOString(),
                    end: end.toISOString(),
                    task
                });
            }
        }
    }

    for (let task of expandedTasks){
        if(!task.locked){
            insertFlexible(task, grid);
        }
    }
    
    return grid;
}