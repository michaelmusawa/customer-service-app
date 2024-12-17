import {
  getUserById,
  fetchMonthlyGroupedRecords,
  fetchWeeklyGroupedRecords,
  fetchDailyGroupedRecords,
} from "../../lib/action";
import { auth } from "../../../../auth";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { GroupedRecord } from "@/app/lib/definitions";
import {
  groupRecordsByDay,
  groupRecordsByMonth,
  groupRecordsByWeek,
} from "@/app/lib/utils";
import Dashboard from "./Dashboard";

export type GroupedByMonth = {
  month: string;
  records: GroupedRecord[];
  totalValue: number;
};

export default async function Page() {
  const session = await auth();
  if (!session) {
    return redirect("/login");
  }

  const user = await getUserById(session.user.id);
  let passwordsMatch;
  if (user) {
    passwordsMatch = await bcrypt.compare(user.email, user.password);
  }

  if (passwordsMatch) {
    return redirect(`/dashboard/${user?.role}/profile?resetPass=true`);
  }

  const monthlyGroupedRecords = await fetchMonthlyGroupedRecords();
  const weeklyGroupedRecords = await fetchWeeklyGroupedRecords();
  const dailyGroupedRecords = await fetchDailyGroupedRecords();
  const monthlyRecords = groupRecordsByMonth(monthlyGroupedRecords);
  const dailyRecords = groupRecordsByDay(dailyGroupedRecords);
  const weeklyRecords = groupRecordsByWeek(weeklyGroupedRecords);

  return (
    <Dashboard
      monthlyRecords={monthlyRecords}
      weeklyRecords={weeklyRecords}
      dailyRecords={dailyRecords}
      user={session.user.role ?? ""}
    />
  );
}
