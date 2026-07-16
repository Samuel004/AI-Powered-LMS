import { cn } from '../lib/utils';

export const Card = ({ className, ...props }) => (
  <div className={cn('rounded-lg border border-gray-200 bg-white shadow-sm', className)} {...props} />
);

export const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 border-b border-gray-200 p-6', className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h2 className={cn('text-2xl font-bold leading-none tracking-tight', className)} {...props} />
);

export const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-gray-500', className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
);

export const CardFooter = ({ className, ...props }) => (
  <div className={cn('flex items-center border-t border-gray-200 p-6 pt-0', className)} {...props} />
);
