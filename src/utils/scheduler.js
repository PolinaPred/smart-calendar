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

function hasSpace(daySlots, startTime, duration, bufferBefore = 0, bufferAfter = 0){
    const startWithBuffer = addMinutes(startTime, -bufferBefore);
    const endWithBuffer = addMinutes(startTime, duration * 60 + bufferAfter);
    
    for (let slot of daySlots){
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);

        const overlaps = startWithBuffer <slotEnd && endWithBuffer > slotStart;

        if(overlaps) return false; 
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
                        originalId: task.id,
                        scheduledAt: null,
                        bufferBefore: task.bufferBefore || 0,
                        bufferAfter: task.bufferAfter || 0
                    };

                    if(task.instanceOverrides && task.instanceOverrides[clone.id]){
                        const override = task.instanceOverrides[clone.id];
                        clone.bufferAfter = override.bufferAfter;
                        clone.bufferBefore = override.bufferBefore;
                    }
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
                        originalId: task.id,
                        scheduledAt: d.toISOString()
                    };

                    if(task.instanceOverrides && task.instanceOverrides[clone.id]){
                        const override = task.instanceOverrides[clone.id];
                        clone.bufferBefore = override.bufferBefore;
                        clone.bufferAfter = override.bufferAfter;
                    }
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
    const bufferBefore = task.bufferBefore || 0;
    const bufferAfter = task.bufferAfter || 0;
    const now = new Date();

    const slotCandidates = [];
    const penaltyFactor = 0.5;

    for (let i = 0; i < 7; i++){
        const testDate = new Date(now);
        testDate.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + i);
        testDate.setHours(START_HOUR, 0,0,0);

        const latestStart = new Date(testDate);
        latestStart.setHours(END_HOUR, 0, 0, 0);
        latestStart.setTime(latestStart.getTime() - durationMins * 60 * 1000);
        
        while (testDate <= latestStart) {
            const day = DAYS[(testDate.getDay() + 6) % 7];

            const existingSameTasks = weekGrid[day].filter(slot => slot.task.title === task.title);
            
            if(task.maxPer && task.maxPerUnit === 'week'){
                const totalThisWeek = Object.values(weekGrid).flat()
                        .filter(slot => slot.task.title === task.title).length;
                if(totalThisWeek >= task.maxPerValue){
                    testDate.setMinutes(testDate.getMinutes() + 15);
                    continue;
                }
            }

            const hour = testDate.getHours() + testDate.getMinutes() / 60;
            const earlyBird = (22 - hour) * 0.25;
            let preferredBoost = 0;

            if(task.prefStartTime != null && task.prefEndTime != null){
                    if(hour >= task.prefStartTime && hour < task.prefEndTime){
                        preferredBoost = 3;
                    } else {
                        if(task.strictStart && hour < task.prefStartTime) {
                    testDate.setMinutes(testDate.getMinutes() + 15);
                    continue;
                        }
                        if(task.strictEnd && hour >= task.prefEndTime) {
                    testDate.setMinutes(testDate.getMinutes() + 15);
                    continue;
                        }
                        preferredBoost = -2;
                    }
            }

            const lastSameType = existingSameTasks.sort((a, b) => new Date(b.start) - new Date(a.start))[0];
            if(lastSameType){
                const gap = (testDate - new Date(lastSameType.start)) / (1000 * 60 * 60);
                if (gap < 4) {
                    testDate.setMinutes(testDate.getMinutes() + 15);
                    continue;
                }
            }

            if(task.deadline) {
                const deadlineDate = new Date(task.dueDate);
                const daysUntilDeadline = (deadlineDate - testDate) / (1000 * 60 * 60 *24);
                
                if(daysUntilDeadline < 0) {
                    testDate.setMinutes(testDate.getMinutes() + 15);
                    continue;
                }
            }

            if (hasSpace(weekGrid[day], testDate, task.duration, task.bufferBefore || 0, task.bufferAfter || 0)){
 
                let score =
                (7-i) * 1.5 + 
                (22-totalHours(weekGrid[day])) * 0.75 + 
                Math.random() * 0.2 +
                preferredBoost +
                earlyBird;

                const sameTypeToday = weekGrid[day].filter(slot => slot.task.title === task.title).length;
                score -= sameTypeToday * penaltyFactor;

                score += Math.max(0, 5 - ((new Date(task.dueDate) - testDate) / (1000 * 60 * 60 * 24))); //boost earlier slots if deadline approaching

                slotCandidates.push({
                    day,
                    start: new Date(testDate),
                    end: addMinutes(testDate, durationMins),
                    rawStart: new Date(testDate),
                    score
                });
            }
            testDate.setMinutes(testDate.getMinutes() + 15);
        }
    }
    if(slotCandidates.length > 0){
        const bestSlot = slotCandidates.sort((a, b) => b.score - a.score)[0];
        const adjustedStart = addMinutes(bestSlot.start, -bufferBefore);
        const adjustedEnd = addMinutes(bestSlot.end, task.duration * 60 + bufferAfter); //might need to change the bufferAfter

        weekGrid[bestSlot.day].push({
            start: adjustedStart.toISOString(), 
            end: adjustedEnd.toISOString(),
            rawStart: bestSlot.rawStart.toISOString(), 
            bufferBefore,
            bufferAfter,
            task
        });
    }
}

function totalHours(slots){
    return slots.reduce((sum, slot) =>{
        const start = new Date(slot.start);
        const end = new Date(slot.end);
        return sum + (end - start) / (1000 * 60 * 60);
    }, 0);
}

export function generateWeekSchedule(tasks) {
    const grid = initWeekGrid();

    const expandedTasks = expandRepeatingTasks(tasks);

    for (let task of expandedTasks){
        if(task.locked && task.scheduledAt){
            const date = new Date(task.scheduledAt);
            const day = DAYS[(date.getDay() + 6) % 7];

            const bufferBefore = task.bufferBefore || 0;
            const bufferAfter = task.bufferAfter || 0;

            const adjustedStart = addMinutes(date, -bufferBefore);
            const adjustedEnd = addMinutes(date, task.duration * 60 + bufferAfter);

            grid[day].push({
                start: adjustedStart.toISOString(),
                end: adjustedEnd.toISOString(),
                task,
                rawStart: date.toISOString(),
                bufferBefore,
                bufferAfter
            });
        }
    }

    for (let task of expandedTasks){
        if(!task.locked){
            insertFlexible(task, grid);
        }
    }

    for (const day of DAYS){
        grid[day].sort((a, b) => new Date(a.start) - new Date(b.start));
    }
    
    return grid;
}