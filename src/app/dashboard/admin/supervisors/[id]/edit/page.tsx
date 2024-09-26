import { getUserById } from '@/app/lib/action';
import EditUserPage from '../../../_components/editUser';
import { auth } from '../../../../../../../auth';
import { notFound, redirect } from 'next/navigation';

export default async function Page({params}:{params:{id:string}}) {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }
    const id = params.id;
    const user = await getUserById(id);
    if (!user) {
      notFound();
    }
    const loggedInUser= session.user.role
  return (
    <div>
        <EditUserPage user={user} type='supervisor' loggedInUser={loggedInUser} />
    </div>
    
  )
}

