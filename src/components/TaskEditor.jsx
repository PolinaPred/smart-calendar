import React, {useState, useEffect} from 'react';

export default function TaskEditor({ task, onClose, onSave}){
    const isInstance = task.originalId && task.id.includes("-r");
    const baseTask = isInstance ? null : task;
    const override = isInstance ? (task.override || {}) : {};

    const effectiveBufferBefore = override.bufferBefore ?? task.bufferBefore ?? 0;
    const effectiveBufferAfter = override.bufferAfter ?? task.bufferAfter ?? 0;

    const [bufferBefore, setBufferBefore] = useState(effectiveBufferBefore);
    const [bufferAfter, setBufferAfter] = useState(effectiveBufferAfter);
    
    const [changedBefore, setChangedBefore] = useState(false);
    const [changedAfter, setChangedAfter] = useState(false);

    const handleSave = () => {
        const payload = {
            ...task,
            changedBefore,
            changedAfter,
            bufferBefore,
            bufferAfter
        };
        onSave(payload);
    };

    return(
        <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Task: {task.title || task.name}</h2>

            <div className="field">
                <label>
                    Buffer Before (minutes):{''}
                    <input
                        type="number"
                        value={bufferBefore}
                        onChange={e => {setBufferBefore(Number(e.target.value));
                            setChangedBefore(true);
                        }}
                        min={0}
                    />
                </label>
            </div>

            <div className="field">
                <label>
                    Buffer After (minutes):{''}
                    <input
                        type="number"
                        value={bufferAfter}
                        onChange={e => {setBufferAfter(Number(e.target.value));
                            setChangedAfter(true);
                        }}
                        min={0}
                    />
                </label>
            </div>

            <button onClick={handleSave}>Save</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    );
}