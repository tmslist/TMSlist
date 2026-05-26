interface WidgetOption {
  id: string;
  title: string;
  description?: string;
}

interface AdminWidgetPickerProps {
  hiddenWidgets: WidgetOption[];
  onAdd: (widgetId: string) => void;
  onClose: () => void;
}

export default function AdminWidgetPicker({ hiddenWidgets, onAdd, onClose }: AdminWidgetPickerProps) {
  return (
    <div className="bg-[#0D1117] border border-[#1E242C] rounded-xl shadow-xl p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#E6EAF0]">Add Widget</h3>
        <button
          onClick={onClose}
          className="text-[#8B9DB5] hover:text-[#E6EAF0] transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {hiddenWidgets.length === 0 ? (
        <p className="text-xs text-[#8B9DB5]">All widgets are currently visible.</p>
      ) : (
        <div className="space-y-2">
          {hiddenWidgets.map((widget) => (
            <button
              key={widget.id}
              onClick={() => onAdd(widget.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg border border-[#1E242C] hover:border-[var(--ink)] hover:bg-[#0A1628]/30 transition-colors group"
            >
              <p className="text-sm font-medium text-[#E6EAF0] group-hover:text-[var(--warm)]">{widget.title}</p>
              {widget.description && (
                <p className="text-xs text-[#8B9DB5] mt-0.5">{widget.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
