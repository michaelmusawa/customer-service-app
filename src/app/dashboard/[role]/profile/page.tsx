

import { getUser } from '@/app/lib/action'
import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import ProfileCard from '@/components/ProfileCard';
import Link from 'next/link';

type Params = { role: string };
type SearchParams = { [key: string]: string | string[] | undefined };

export default async function page({ params, searchParams }: { params: Params, searchParams: SearchParams }) {
  const session = await auth();
  const { role } = params;
  const success = searchParams.success as string | undefined;

  if (!session){
    return redirect('/login');

  } else if (session?.user.role !== role){

    return(
      <div>
        <h1>You are not authorized to visit this page!</h1>
        <Link
          className="button" 
          href='/login'
        >
          Go to Login
        </Link>
      </div>
    )
  }

  const user = await getUser(session.user.email || '')
  
  return (
    <div>
      <ProfileCard user = {user} type={session.user.role} success= {success}/>
    </div>
    
  )
}