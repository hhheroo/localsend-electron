type QuickSaveOption = 'off' | 'favorites' | 'on'

interface QuickSaveToggleProps {
  value: QuickSaveOption
  onChange: (value: QuickSaveOption) => void
}

export function QuickSaveToggle({ value, onChange }: QuickSaveToggleProps) {
  const options: { id: QuickSaveOption; label: string }[] = [
    { id: 'off', label: 'Off' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'on', label: 'On' },
  ]

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-base text-black">Quick Save</span>
      <div className="flex bg-white rounded-full border border-gray-200 overflow-hidden">
        {options.map((option) => (
          <button
            key={option.id}
            className={`px-6 py-2 text-sm font-medium border-none cursor-pointer transition-all duration-200 ${
              value === option.id
                ? 'bg-sidebar-bg text-black'
                : 'bg-transparent text-black hover:bg-gray-50'
            }`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export type { QuickSaveOption }
