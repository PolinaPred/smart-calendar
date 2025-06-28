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

function getTaskKey(task){
    return task.originalId || task.id;
}

function insertFlexible(task, weekGrid){
    const maxPerUnit = task.maxPer?.unit || null;
    const maxPerValue = task.maxPer?.value || null;
    const durationMins = task.duration * 60;
    const bufferBefore = task.bufferBefore || 0;
    const bufferAfter = task.bufferAfter || 0;
    const now = new Date();

    const slotCandidates = [];
    const penaltyFactor = 0.5;

    const taskKey = getTaskKey(task);

    if(task.maxPer && maxPerUnit === 'week'){
        const scheduled = Object.values(weekGrid).flat().filter(slot => getTaskKey(slot.task) === taskKey).length;
        if (scheduled >= maxPerValue) return;
    }

    const daysWithMaxAlready = new Set();
    for (const day of DAYS){
        const existing = weekGrid[day].filter(slot => getTaskKey(slot.task) === taskKey);
        if (task.maxPer && maxPerUnit === 'day' && existing.length >= maxPerValue){
            daysWithMaxAlready.add(day);
        }
    }

    for (let i = 0; i < 7; i++){
        const testDate = new Date(now);
        testDate.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + i);
        testDate.setHours(START_HOUR, 0,0,0);

        const latestStart = new Date(testDate);
        latestStart.setHours(END_HOUR, 0, 0, 0);
        latestStart.setTime(latestStart.getTime() - durationMins * 60 * 1000);
        
        while (testDate <= latestStart) {
            const day = DAYS[(testDate.getDay() + 6) % 7];

            if(daysWithMaxAlready.has(day)){
                testDate.setMinutes(testDate.getMinutes() + 15);
                continue;
            }

            const existingSameDay = weekGrid[day].filter(slot => getTaskKey(slot.task) === taskKey);
            const existingSameWeek = Object.values(weekGrid).flat().filter(slot => getTaskKey(slot.task) === taskKey);

            if(task.maxPer){
                if(maxPerUnit === 'day' && existingSameDay.length >= maxPerValue){
                    testDate.setMinutes(testDate.getMinutes() + 15);
                    continue;
                }

                if(maxPerUnit === 'week' && existingSameWeek.length >= maxPerValue){
                    return;
                }
            }

            const hour = testDate.getHours() + testDate.getMinutes() / 60;
            const earlyBird = (22 - hour) * 0.25;
            let preferredBoost = 0;

            if(task.prefStartTime != null && task.prefEndTime != null){
                if(task.strictStart && hour < task.prefStartTime) {
                    testDate.setMinutes(testDate.getMinutes() + 15);
                    continue;
                }
                if(task.strictEnd && hour >= task.prefEndTime) {
                    testDate.setMinutes(testDate.getMinutes() + 15);
                    continue;
                }
                        const midpoint = (task.prefStartTime + task.prefEndTime) / 2;
                        const distanceFromMid = Math.abs(hour - midpoint);
                    if(hour >= task.prefStartTime && hour < task.prefEndTime){
                        preferredBoost = Math.max(0, 15 - distanceFromMid * 10);
                    } else {
                        const outsideDistance = hour < task.prefStartTime
                            ? task.prefEndTime - hour
                            : hour - task.prefEndTime;
                            
                        preferredBoost -= outsideDistance * 10;
                    }
            }

            const lastSameType = existingSameDay.sort((a, b) => new Date(b.start) - new Date(a.start))[0];
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
                (7-i) * 3 + 
                (22-totalHours(weekGrid[day])) * 0.75 + 
                Math.random() * 0.1 +
                preferredBoost +
                earlyBird;

                if(task.repeating && task.repeatEvery && task.repeatEvery.unit === 'day'){
                    const desiredGap = task.repeatEvery.value;
                    const allSlots = Object.values(weekGrid).flat().filter(slot => getTaskKey(slot.task) === getTaskKey(task));
                    
                    for(let other of allSlots){
                        const gapDays = Math.abs((testDate - new Date(other.start)) / (1000 * 60 * 60 * 24));
                        const diffFromIdeal = Math.abs(gapDays - desiredGap);
                        
                        if(gapDays === desiredGap) {
                            score += 2;    
                        } else {
                            const weight = gapDays < desiredGap ? 1.5 : 0.5;
                            score -= Math.max(0, 3-diffFromIdeal) * weight;
                        }
                    }
                }

                const sameTypeToday = existingSameDay.length;
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

        const existingThisDay = weekGrid[bestSlot.day].filter(slot => getTaskKey(slot.task) === getTaskKey(task));
        const allThisWeek = Object.values(weekGrid).flat().filter(slot => getTaskKey(slot.task) === getTaskKey(task));

        if(maxPerUnit === 'day' && existingThisDay.length >= maxPerValue) return;
        if(maxPerUnit === 'week' && allThisWeek.length >= maxPerValue) return;

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
    const groupedByOriginal = {};
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

        if(!task.locked){
            const key = task.originalId || task.id;
            if (!groupedByOriginal[key]) groupedByOriginal[key] = [];
            groupedByOriginal[key].push(task);
        }
    }

    const allGroups = Object.values(groupedByOriginal);

    allGroups.sort((groupA, groupB) => {
        const a = groupA[0];
        const b = groupB[0];

        const aStrict = a.strictStart || a.strictEnd ? 1 : 0;
        const bStrict = b.strictStart || b.strictEnd ? 1 : 0;

        const aWindow = (a.prefEndTime ?? 24) - (a.prefStartTime ?? 0);
        const bWindow = (b.prefEndTime ?? 24) - (b.prefStartTime ?? 0);

        const aScore = aStrict * 100 + (24 - aWindow);
        const bScore = bStrict * 100 + (24 - bWindow);

        return bScore - aScore;
    });

    for (const group of allGroups){

        const baseTask = group[0];
        const maxPerValue = baseTask.maxPer?.value || null;
        const maxPerUnit = baseTask.maxPer?.unit || null;
        
        const internalOrder = [...group].sort(() => Math.random() - 0.5);
        
        if(maxPerUnit === 'week'){
            let inserted = 0;
            for (const clone of internalOrder){
            if(inserted >= maxPerValue) break;
            const beforeInsert = JSON.stringify(grid);
            insertFlexible(clone, grid);
            const afterInsert = JSON.stringify(grid);
            if(beforeInsert !== afterInsert){
                inserted++;
            }
            }
        } else {
            for (const clone of internalOrder){
                insertFlexible(clone, grid);
            }
        }
    }

    for (const day of DAYS){
        grid[day].sort((a, b) => new Date(a.start) - new Date(b.start));
    }
    
    return grid;
}