/**
 * Command Options Manager
 * UI for managing slash command options/arguments
 * @author fkndean_
 * @date 2025-10-15
 */

const OPTION_TYPES = [
  { value: 3, label: 'String (Text)' },
  { value: 4, label: 'Integer (Number)' },
  { value: 5, label: 'Boolean (True/False)' },
  { value: 6, label: 'User (@mention)' },
  { value: 7, label: 'Channel (#channel)' },
  { value: 8, label: 'Role (@role)' }
];

/**
 * CommandOptionsManager Component
 * @param {Array} options - Current command options
 * @param {Function} onChange - Callback when options change
 * @param {Array} nodes - All nodes in the workflow
 */
export function CommandOptionsManager({ options = [], onChange, nodes = [] }) {
  // Safety check to ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];
  
  const addOption = () => {
    onChange([...safeOptions, {
      name: '',
      description: '',
      type: 3,
      required: true
    }]);
  };

  const updateOption = (index, field, value) => {
    const updated = [...safeOptions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeOption = (index) => {
    onChange(safeOptions.filter((_, i) => i !== index));
  };

  const detectUserInputs = () => {
    const userInputs = (nodes || [])
      .filter(n => n.type === 'variable' && n.data?.config?.type === 'user_input')
      .map(n => n.data.config.name);
    
    const newOptions = userInputs.map(name => ({
      name,
      description: `The ${name} parameter`,
      type: 3,
      required: true
    }));
    
    onChange([...safeOptions, ...newOptions]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Command Options</h3>
        <div className="flex gap-2">
          <button
            onClick={detectUserInputs}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
          >
            🔍 Auto-detect from Nodes
          </button>
          <button
            onClick={addOption}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            + Add Option
          </button>
        </div>
      </div>

      {safeOptions.length === 0 ? (
        <div className="text-gray-400 text-sm text-center py-4 border border-dashed border-gray-600 rounded-lg">
          No command options defined. Add options or auto-detect from Variable nodes.
        </div>
      ) : (
        <div className="space-y-2">
          {safeOptions.map((option, index) => (
            <div key={index} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Option name (e.g., question)"
                  value={option.name || ''}
                  onChange={(e) => updateOption(index, 'name', e.target.value)}
                  className="col-span-3 px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={option.description || ''}
                  onChange={(e) => updateOption(index, 'description', e.target.value)}
                  className="col-span-5 px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <select
                  value={option.type || 3}
                  onChange={(e) => updateOption(index, 'type', parseInt(e.target.value))}
                  className="col-span-2 px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  {OPTION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <label className="col-span-1 flex items-center justify-center gap-1 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={option.required || false}
                    onChange={(e) => updateOption(index, 'required', e.target.checked)}
                    className="rounded"
                  />
                  Req'd
                </label>
                <button
                  onClick={() => removeOption(index)}
                  className="col-span-1 px-2 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-sm rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
