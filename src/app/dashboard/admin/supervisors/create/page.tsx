import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import CreateUserPage from "../../_components/createUser";


export default async function Page() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }
  const type = 'supervisor'
  return (
    <div>
        <CreateUserPage loggedInUser={session.user.role} type={type} />
    </div>
  )
}
