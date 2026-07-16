export const Progress = ({ value, className = '' }) => (
  <div className={`h-2 w-full rounded-full bg-gray-200 overflow-hidden ${className}`}>
    <div
      className="h-full bg-blue-600 transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);
