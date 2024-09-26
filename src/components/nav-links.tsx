'use client'

import HomeIcon from "./icons/HomeIcon";
import UserGroupIcon from "./icons/UserGroupIcon";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import RecordIcon from "./icons/recordIcon";
import ProfileIcon from "./icons/profileIcon";

const links = [
  { name: 'Home', href: '/dashboard', icon: <HomeIcon />, role: ['attendant','supervisor','admin']}, 
  { name: 'Profile', href: '/dashboard/admin/profile', icon: <ProfileIcon />, role: ['admin']},
  { name: 'Profile', href: '/dashboard/supervisor/profile', icon: <ProfileIcon />, role: ['supervisor']},
  { name: 'Profile', href: '/dashboard/attendant/profile', icon: <ProfileIcon />, role: ['attendant']},
  { name: 'Records', href: '/dashboard/attendant/records', icon: <RecordIcon />, role: ['attendant']},
  { name: 'Records', href: '/dashboard/supervisor/records', icon: <RecordIcon />, role: ['supervisor']},
  {name: 'Supervisors', href: '/dashboard/admin/supervisors/create', icon: <UserGroupIcon />, role: ['admin']},
  {name: 'Attendants', href: '/dashboard/admin/attendants/create', icon: <UserGroupIcon  />, role: ['admin']},
  {name: 'Attendants', href: '/dashboard/supervisor/attendants/create', icon: <UserGroupIcon  />, role: ['supervisor']}

];

export default function NavLinks({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        if (link.role.includes(role)) {
          return (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                'flex h-[48px] max-sm:h-[30px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-green-100 hover:text-green-600 md:flex-none md:justify-start md:p-2 md:px-3 ',
                {
                  'bg-sky-100 text-green-600': pathname === link.href,
                },
              )}
            >
              <span className="max-w-6">{link.icon}</span>
              <p className="hidden md:block">{link.name}</p>
            </Link>
          );
        }
        return null; 
      })}
    </>
  );
}