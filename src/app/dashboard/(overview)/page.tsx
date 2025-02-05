import {
  getUserById,
  fetchMonthlyGroupedRecords,
  fetchWeeklyGroupedRecords,
  fetchDailyGroupedRecords,
  fetchYearlyGroupedRecords,
} from "../../lib/action";
import { auth } from "../../../../auth";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import {
  groupRecordsByDay,
  groupRecordsByHour,
  groupRecordsByMonth,
  groupRecordsByWeek,
} from "@/app/lib/utils";
import Dashboard from "./Dashboard";

export type LocalRecords = {
  count: number;
  date: string;
  dayName: string;
  month:string;
  service:string
  time:string;
  totalValue:number;
  userStation:string;
  week: number;
}

export type GroupedByMonth = {
  type: "month";
  month: string;
  records: LocalRecords[];
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

  const [monthlyGroupedRecords, weeklyGroupedRecords, dailyGroupedRecords, yearlyGroupedRecords] =
    await Promise.all([
      fetchMonthlyGroupedRecords(),
      fetchWeeklyGroupedRecords(),
      fetchDailyGroupedRecords(),
      fetchYearlyGroupedRecords(),
    ]);

  
    let localMonthlyGroupedRecords;
    let localWeeklyGroupedRecords;
    let localDailyGroupedRecords;
    let localYearlyGroupedRecords;
    if (user?.role === 'admin' || user?.role === 'supersupervisor') {
      localYearlyGroupedRecords = yearlyGroupedRecords;
      localMonthlyGroupedRecords = monthlyGroupedRecords;
      localWeeklyGroupedRecords = weeklyGroupedRecords;
      localDailyGroupedRecords = dailyGroupedRecords;
    } else {
      localYearlyGroupedRecords = yearlyGroupedRecords?.filter(record => record.userStation === user?.station);
      localMonthlyGroupedRecords = monthlyGroupedRecords?.filter(record => record.userStation === user?.station);
      localWeeklyGroupedRecords = weeklyGroupedRecords?.filter(record => record.userStation === user?.station);
      localDailyGroupedRecords = dailyGroupedRecords?.filter(record => record.userStation === user?.station);

    }

    

  const monthlyRecords = groupRecordsByWeek(localMonthlyGroupedRecords);
  const dailyRecords = groupRecordsByHour(localDailyGroupedRecords);
  const weeklyRecords = groupRecordsByDay(localWeeklyGroupedRecords);
  const yearlyRecords = groupRecordsByMonth(localYearlyGroupedRecords);

  return (
    <Dashboard
      yearlyRecords={yearlyRecords}
      monthlyRecords={monthlyRecords}
      weeklyRecords={weeklyRecords}
      dailyRecords={dailyRecords}
      user={session.user.role ?? ""}
    />
  );
}
