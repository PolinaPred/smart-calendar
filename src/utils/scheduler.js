import {parseISO, addMinutes, format, isBefore} from 'date-fns';

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
    for (let task of tasks){
        if(!task || (task.locked && (!task.scheduledAt || isNaN(new Date(task.scheduledAt))))){
            console.warn("Invalid scheduledAt value for task:", task);
            continue;
        }else{
            if(task.locked && task.scheduledAt){
                const date = new Date(task.scheduledAt);
                const day = DAYS[(date.getDay() + 6) % 7];
                const end = addMinutes(date, task.duration * 60);
                console.log("Locked task date:", task.scheduledAt, "→ Day:", day);

                if (DAYS.includes(day)){
                    grid[day].push({
                        start: date.toISOString(),
                        end: end.toISOString(),
                        task
                    });
                }else{
                    console.warn("Invalid day parsed for locked task:", task);
                }
            }
        }
    }

    for (let task of tasks){
        if(!task.locked){
            insertFlexible(task, grid);
        }
    }
    console.log("Final schedule grid:", grid);
    return grid;
}