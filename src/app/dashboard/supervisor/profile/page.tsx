

import { getUser } from '@/app/lib/action'
import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcrypt';
import ProfileCard from '@/components/ProfileCard';
import Link from 'next/link';

export default async function page() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  } else if (session?.user.role !== 'supervisor'){
    return(
      <div>
        <h1>You are not authorized to visit this page!</h1>
        <Link
        className="button" 
          href='/login'>
          Go to Login
        </Link>
      </div>
    )
  }
  const supervisor = await getUser(session.user.email || '')

  let passwordsMatch;
  if (supervisor) {
    passwordsMatch = await bcrypt.compare(supervisor.email, supervisor.password);
  }

  
  return (
    <div>
      {passwordsMatch && (
        <p className='text-center text-red-500'>Change your password to continue</p>
      )}
      <ProfileCard user = {supervisor} type={'supervisor'} />  
    </div>
    
  )
}