import React, {useState} from 'react';

export default function TaskEditor({ task, onClose, onSave}){
    const [bufferBefore, setBufferBefore] = useState(task.bufferBefore || 0);
    const [bufferAfter, setBufferAfter] = useState(task.bufferAfter || 0);
    const [applyToAllInstances, setApplyToAllInstances] = useState(false);

    const handleSave = () => {
        onSave({
            ...task,
            bufferAfter,
            bufferBefore,
            applyBufferToRepeats: applyToAllInstances,
        });
        onClose();
    };

    return(
        <div className="modal">
            <h2>Edit Task: {task.title || task.name}</h2>

            <div className="field">
                <label>
                    Buffer Before (minutes):{''}
                    <input
                        type="number"
                        value={bufferBefore}
                        onChange={e => setBufferBefore(Number(e.target.value))}
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
                        onChange={e => setBufferAfter(Number(e.target.value))}
                        min={0}
                    />
                </label>
            </div>

            <div className="field">
                <label>
                    <input 
                        type="checkbox"
                        checked={applyToAllInstances}
                        onChange={e => setApplyToAllInstances(e.target.checked)}
                    />
                    Apply changes to all instances of this event
                </label>
            </div>

            <button onClick={handleSave}>Save</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    )
}