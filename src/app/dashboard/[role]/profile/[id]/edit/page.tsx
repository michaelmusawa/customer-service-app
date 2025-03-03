import { auth } from "../../../../../../../auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/app/lib/action";
import ProfileForm from "@/components/forms/profile";
import UnauthorizedMessage from "@/components/unathorizedAccess";

export default async function EditProfilePage({
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
  const id = params.id;
  const user = await getUserById(id);
  return (
    <div>
      <ProfileForm user={user} type={session.user.role} />
    </div>
  );
}
