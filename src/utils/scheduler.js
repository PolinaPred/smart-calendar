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
        const slotStart = parseISO(slot.start);
        const slotEnd = parseISO(slot.end);
        if(
            (isBefore(startTime, slotEnd) && isBefore(slotStart, endTime))
        ){
            return false;
        }
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

    for (let day of DAYS){
        let startHour = START_HOUR;
        while (startHour + task.duration <= END_HOUR) {
            const now = new Date();
            const testTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour);
            const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
            const targetDayIndex = DAYS.indexOf(day);
            const daysUntil = (targetDayIndex - currentDayIndex + 7) % 7;
            
            testTime.setDate(now.getDate() + daysUntil);

            if (hasSpace(weekGrid[day], testTime, task.duration)){
                const end = addMinutes(testTime, durationMins);
                weekGrid[day].push({
                    start: testTime.toISOString(),
                    end: end.toISOString(),
                    task
                });
                return;
            }

            startHour += 1;
        }
    }
}

export function generateWeekSchedule(tasks) {
    const grid = initWeekGrid();
    const expandedTasks = expandRepeatingTasks(tasks);

    for (let task of expandedTasks){
        if(!task || (task.locked && (!task.scheduledAt || isNaN(new Date(task.scheduledAt))))){
            console.warn("Invalid scheduledAt value for task:", task);
            continue;
        }
        
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