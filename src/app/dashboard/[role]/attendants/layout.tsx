
import { redirect } from 'next/navigation';
import { auth } from '../../../../../auth';
import Users from '../_components/users';
import Link from 'next/link';

export default async function Layout({ 
  children,
  params
 }: {
   children: React.ReactNode,
   params: { role: string }
   }) {
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
  const loggedInUser= session.user.role

  return (
    <div>
        <div className='max-w-2xl mx-auto mb-4'>
            {children}
            <Users type={'attendant'} loggedInUser={loggedInUser}  />
        </div>
  </div>
  )
}