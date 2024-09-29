import { auth } from '../../../../../../../auth';
import { redirect } from 'next/navigation';
import { getUserById } from '@/app/lib/action';
import ProfileForm from '@/components/forms/profile';
import Link from 'next/link';

export default async function EditProfilePage({ params }: { params: { id: string } }){
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
      const id = params.id;
      const user = await getUserById(id);
  return (
    <div>
        <ProfileForm  user = {user} type={'supervisor'} />
    </div>
  )
}


