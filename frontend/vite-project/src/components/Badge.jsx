import { cn } from '../lib/utils';

export const Badge = ({ className, variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-green-100 text-green-800',
    outline: 'border border-gray-300 bg-white text-gray-900',
    destructive: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
