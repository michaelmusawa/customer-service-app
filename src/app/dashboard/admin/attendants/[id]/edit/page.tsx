import { getUserById } from '@/app/lib/action';
import EditUserPage from '../../../_components/editUser';
import { notFound, redirect } from 'next/navigation';
import { auth } from '../../../../../../../auth';
import Link from 'next/link';

export default async function Page({params}:{params:{id:string}}) {
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
    const loggedInUser = session.user.role;
    const id = params.id;
    const user = await getUserById(id);
    if (!user){
      notFound();
    }
  return (
    <div>
        <EditUserPage user={user} type='attendant' loggedInUser={loggedInUser}/>
    </div>
    
  )
}

