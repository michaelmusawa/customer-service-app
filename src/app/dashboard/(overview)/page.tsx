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
  type: "month";
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

  const [monthlyGroupedRecords, weeklyGroupedRecords, dailyGroupedRecords] =
    await Promise.all([
      fetchMonthlyGroupedRecords(),
      fetchWeeklyGroupedRecords(),
      fetchDailyGroupedRecords(),
    ]);

  
    let localMonthlyGroupedRecords;
    let localWeeklyGroupedRecords;
    let localDailyGroupedRecords;
    if (user?.role === 'admin' || user?.role === 'supersupervisor') {
      localMonthlyGroupedRecords = monthlyGroupedRecords;
      localWeeklyGroupedRecords = weeklyGroupedRecords;
      localDailyGroupedRecords = dailyGroupedRecords;
    } else {
      localMonthlyGroupedRecords = monthlyGroupedRecords?.filter(record => record.userStation === user?.station);
      localWeeklyGroupedRecords = weeklyGroupedRecords?.filter(record => record.userStation === user?.station);
      localDailyGroupedRecords = dailyGroupedRecords?.filter(record => record.userStation === user?.station);

    }

  const monthlyRecords = groupRecordsByMonth(localMonthlyGroupedRecords);
  const dailyRecords = groupRecordsByDay(localDailyGroupedRecords);
  const weeklyRecords = groupRecordsByWeek(localWeeklyGroupedRecords);

  return (
    <Dashboard
      monthlyRecords={monthlyRecords}
      weeklyRecords={weeklyRecords}
      dailyRecords={dailyRecords}
      user={session.user.role ?? ""}
    />
  );
}
