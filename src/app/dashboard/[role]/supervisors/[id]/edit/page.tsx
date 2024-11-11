import { getUserById } from '@/app/lib/action';
import EditUserPage from '../../../_components/editUser';
import { auth } from '../../../../../../../auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Page({ params }: { params:{ id:string,role: string  }}) {
  const session = await auth();
  const role = params.role;

  if (!session){
    return redirect('/login');
  } else if (session?.user.role !== role){
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

