import Link from 'next/link';
import NavLinks from './nav-links';
import Logo from './logo';
import SignOutIcon from './icons/SignOutIcon';
import { auth } from '../../auth';
import { getUserById, signUserOut } from '@/app/lib/action';
import bcrypt from 'bcrypt';


export default async function SideNav() {

  const session = await auth();
 
  let user;
  if (session){
    user = await getUserById(session.user.id);
  }

  let passwordsMatch;
  if (user) {
    passwordsMatch = await bcrypt.compare(user.email, user.password);
  }

  return (
    <div className="flex flex-col px-3 py-4 md:px-2 sm">
      <Link
        className="mb-2 flex h-20 items-end justify-start rounded-md bg-gray-100 p-4 max-md:p-0 md:h-40"
        href="/dashboard"
      >
        <div className="max-w-32 m-auto max-lg:ml-14 max-sm:ml-6 text-white md:max-w-40">
          <Logo />
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        {!passwordsMatch && (
          <NavLinks role= {session?.user.role || ''}/>
        )}
        <div className="hidden h-auto w-full grow rounded-md  md:block">
        </div>
        <form
          action={signUserOut}
        >
          <button className="flex h-[48px] max-sm:h-[30px] max-w-44 shadow-md grow items-center justify-center gap-2 rounded-md bg-gray-100 p-3 text-sm font-medium hover:bg-green-100 hover:text-green-600 hover:shadow-black/20 md:flex-none md:p-2 md:px-3 md:fixed md:bottom-24">
            <SignOutIcon className="w-6" />
            <div className="hidden md:block">Sign Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}