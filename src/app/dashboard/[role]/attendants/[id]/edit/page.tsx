import { getUserById } from "@/app/lib/action";
import EditUserPage from "../../../_components/editUser";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../../../../auth";
import UnauthorizedMessage from "@/components/unathorizedAccess";

export default async function Page({
  params,
}: {
  params: { id: string; role: string };
}) {
  const session = await auth();
  const role = params.role;

  if (!session) {
    return redirect("/login");
  } else if (session?.user.role !== role) {
    return <UnauthorizedMessage role={role} />;
  }
  const loggedInUser = session.user.role;
  const id = params.id;
  const user = await getUserById(id);
  if (!user) {
    notFound();
  }
  return (
    <div>
      <EditUserPage
        user={user}
        type="attendant"
        loggedInUser={loggedInUser}
        label="Update biller"
      />
    </div>
  );
}
