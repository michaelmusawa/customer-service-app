"use client";

import HomeIcon from "./icons/HomeIcon";
import UserGroupIcon from "./icons/UserGroupIcon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import RecordIcon from "./icons/recordIcon";
import ProfileIcon from "./icons/profileIcon";
import NotificationIcon from "./icons/Notification";

export default function NavLinks({ role }: { role: string }) {
  const links = [
    {
      name: "Home",
      href: "/dashboard",
      icon: <HomeIcon />,
      role: ["attendant", "supervisor", "admin", "supersupervisor"],
    },
    {
      name: "Profile",
      href: `/dashboard/${role}/profile`,
      icon: <ProfileIcon />,
      role: ["attendant", "supervisor", "admin", "supersupervisor"],
    },
    {
      name: "Records",
      href: `/dashboard/${role}/records`,
      icon: <RecordIcon />,
      role: ["attendant", "supervisor", "supersupervisor"],
    },
    {
      name: "Supervisors",
      href: `/dashboard/${role}/supervisors/create`,
      icon: <UserGroupIcon />,
      role: ["admin"],
    },
    {
      name: "Attendants",
      href: `/dashboard/${role}/attendants/create`,
      icon: <UserGroupIcon />,
      role: ["supervisor"],
    },
    {
      name: "Reports",
      href: `/dashboard/${role}/report`,
      icon: <UserGroupIcon />,
      role: ["supersupervisor"],
    },
    {
      name: "Notification",
      href: `/dashboard/${role}/notification`,
      icon: <NotificationIcon />,
      role: ["attendant", "supervisor"],
    },
  ];

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
                "flex h-[48px] max-sm:h-[30px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-green-100 hover:text-green-600 md:flex-none md:justify-start md:p-2 md:px-3 ",
                {
                  "bg-sky-100 text-green-600": pathname === link.href,
                }
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
