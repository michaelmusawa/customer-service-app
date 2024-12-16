import { GroupedByMonth } from "@/app/dashboard/(overview)/page";
import { lusitana } from "@/app/fonts/fonts";
import { generateYAxis, GroupedByDay, GroupedByWeek } from "@/app/lib/utils";

export default async function RevenueChart({
  revenue,
  type,
}: {
  type: string;
  revenue: GroupedByMonth[] | GroupedByDay[] | GroupedByWeek[] | undefined;
}) {
  const chartHeight = 300;

  const { yAxisLabels, topLabel } = generateYAxis(revenue ?? []);

  //console.log(revenue);

  return (
    <div className="w-full md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Recent Revenue
      </h2>

      <div className="rounded-xl bg-gray-50 p-4">
        <div className="sm:grid-cols-13 mt-0 grid grid-cols-12 items-end gap-2 rounded-md bg-white p-4 md:gap-4">
          <div
            className="mb-6 hidden flex-col justify-between text-sm text-gray-400 sm:flex"
            style={{ height: `${chartHeight}px` }}
          >
            {yAxisLabels.map((label) => (
              <p key={label}>{label}</p>
            ))}
          </div>
          {!revenue || revenue.length === 0 ? (
            <p className="mt-4 text-gray-400">No data available.</p>
          ) : (
            revenue.map((month, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-md bg-green-300"
                  style={{
                    height: `${(chartHeight / topLabel) * month.totalValue}px`,
                  }}
                ></div>
                {type === "monthly" && (
                  <p className="-rotate-90 text-sm text-gray-400 sm:rotate-0">
                    {month.month}
                  </p>
                )}
                {type === "weekly" && (
                  <p className="-rotate-90 text-sm text-gray-400 sm:rotate-0">
                    week{month.week}
                  </p>
                )}
                {type === "daily" && (
                  <p className="-rotate-90 text-sm text-gray-400 sm:rotate-0">
                    {month.date}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center pb-2 pt-4">
          {/* <CalendarIcon className="h-5 w-5 text-gray-500" /> */}
          {type === "monthly" && (
            <h3 className="ml-2 text-sm text-gray-500 ">Last 12 months</h3>
          )}
          {type === "weekly" && (
            <h3 className="ml-2 text-sm text-gray-500 ">For this month</h3>
          )}
          {type === "daily" && (
            <h3 className="ml-2 text-sm text-gray-500 ">For this week</h3>
          )}
        </div>
      </div>
    </div>
  );
}
