

import { getUser } from '@/app/lib/action'
import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import ProfileCard from '@/components/ProfileCard';
import Link from 'next/link';

export default async function page() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  } else if (session?.user.role !== 'admin'){
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
  const admin = await getUser(session.user.email || '')
  
  return (
    <div>
      <ProfileCard user = {admin} type={'admin'} />
    </div>
    
  )
}