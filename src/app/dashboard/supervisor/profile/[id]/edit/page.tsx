import { auth } from '../../../../../../../auth';
import { redirect } from 'next/navigation';
import { getUserById } from '@/app/lib/action';
import ProfileForm from '@/components/forms/profile';

export default async function EditProfilePage({ params }: { params: { id: string } }){
    const session = await auth();
    if (!session){
      return redirect('/login');
    }
      const id = params.id;
      const user = await getUserById(id);
  return (
    <div>
        <ProfileForm  user = {user} type={'supervisor'} />
    </div>
  )
}


