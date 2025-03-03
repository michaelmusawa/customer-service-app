import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import UnauthorizedMessage from "@/components/unathorizedAccess";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { role: string };
}) {
  const session = await auth();
  const role = params.role;
  if (!session) {
    return redirect("/login");
  } else if (session?.user.role !== role) {
    return <UnauthorizedMessage role={role} />;
  }

  return (
    <div>
      <div className="max-w-screen-lg mx-auto mb-4">{children}</div>
    </div>
  );
}
