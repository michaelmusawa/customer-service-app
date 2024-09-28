import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import CreateUserPage from "@/app/dashboard/admin/_components/createUser";


export default async function Page() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }
  return (
    <div>
        <CreateUserPage loggedInUser={session.user.role} type="attendant"/>
    </div>
  )
}
