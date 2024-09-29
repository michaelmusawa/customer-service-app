import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import CreateUserPage from "../../_components/createUser";
import Link from "next/link";


export default async function Page() {
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
  const loggedInUser = session.user.role
  return (
    <div>
        <CreateUserPage loggedInUser={loggedInUser} type="attendant"/>
    </div>
  )
}
