import { BanknotesIcon, InboxIcon } from "@heroicons/react/24/outline";
import { lusitana } from "@/app/fonts/fonts";
import { GroupedByDay, GroupedByWeek } from "@/app/lib/utils";
import { GroupedByMonth } from "@/app/dashboard/(overview)/page";
import { getServiceStats } from "@/app/lib/data";

const iconMap = {
  services: BanknotesIcon,
  invoice: BanknotesIcon,
  records: InboxIcon,
};

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: GroupedByDay[] | GroupedByWeek[] | GroupedByMonth[];
  type: "records" | "invoice" | "services";
}) {
  const Icon = iconMap[type];

  function getTotalNumberOfRecords(
    records: GroupedByDay[] | GroupedByWeek[] | GroupedByMonth[]
  ): number {
    const services = getServiceStats(records);
    return services.reduce((total, entry) => total + entry.count, 0);
  }

  function getTotalValue(
    records: GroupedByDay[] | GroupedByWeek[] | GroupedByMonth[]
  ): number {
    const services = getServiceStats(records);
    return services.reduce((total, entry) => total + entry.totalValue, 0);
  }

  function getTypesOfServices(
    records: GroupedByDay[] | GroupedByWeek[] | GroupedByMonth[]
  ): number {
    const services = getServiceStats(records);
    return services.length;
  }

  const records = getTotalNumberOfRecords(value);
  const numberOfServices = getTypesOfServices(value);
  const totalValue = getTotalValue(value);

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium text-gray-800">{title}</h3>
      </div>

      {type === "records" ? (
        <h2
          className={`${lusitana.className} truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
        >
          {records || 0}
        </h2>
      ) : (
        <h2
          className={`${lusitana.className} truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
        >
          {type === "services" ? (
            <>{numberOfServices || 0}</>
          ) : (
            <>
              <span className="max-xl:hidden">Ksh.</span>{" "}
              {totalValue.toLocaleString("en-US") || 0}
            </>
          )}
        </h2>
      )}
    </div>
  );
}
