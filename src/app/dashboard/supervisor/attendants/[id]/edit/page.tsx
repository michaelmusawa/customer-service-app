import { getUserById } from '@/app/lib/action';
import EditUserPage from '@/app/dashboard/admin/_components/editUser';
import { notFound, redirect } from 'next/navigation';
import { auth } from '../../../../../../../auth';

export default async function Page({params}:{params:{id:string}}) {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }
    const loggedInUser = session.user.role
    console.log("logged in user", loggedInUser)
    const id = params.id;
    const user = await getUserById(id);
    if (!user){
      notFound();
    }
  return (
    <div>
        <EditUserPage user={user} type='attendant' loggedInUser={loggedInUser} />
    </div>
    
  )
}

