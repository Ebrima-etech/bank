interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export default function Alert({ type, message, onClose }: AlertProps) {
  const colors = {
    success: 'bg-success-50 text-success-600 border-success-200',
    error: 'bg-error-50 text-error-600 border-error-200',
    warning: 'bg-warning-50 text-warning-600 border-warning-200',
    info: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start justify-between ${colors[type]}`}>
      <div className="flex items-start space-x-3">
        <span className="text-lg font-bold">{icons[type]}</span>
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-lg leading-none opacity-70 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  );
}
