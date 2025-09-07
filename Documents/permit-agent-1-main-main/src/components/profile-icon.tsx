import Link from 'next/link';
import { User } from 'lucide-react';

type ProfileIconProps = {
  href?: string;
  className?: string;
  title?: string;
};

export function ProfileIcon({ href = '/sign-in', className, title = 'Account' }: ProfileIconProps) {
  return (
    <Link
      href={href}
      aria-label={title}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-full border hover:bg-accent transition-colors ${className || ''}`}
      title={title}
    >
      <User className="h-5 w-5 text-gray-700" />
    </Link>
  );
}


