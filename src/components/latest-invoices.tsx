import ArrowPathIcon from "./icons/ArrowPath";
import { lusitana } from "@/app/fonts/fonts";
import clsx from "clsx";
import { getServiceStats } from "@/app/lib/data";
import { GroupedByMonth } from "@/app/dashboard/(overview)/page";
import { GroupedByDay, GroupedByWeek, GroupedByHour } from "@/app/lib/utils";

export default async function LatestInvoices({
  records,
}: {
  records: GroupedByMonth[] | GroupedByDay[] | GroupedByWeek[] | GroupedByHour[] | undefined;
}) {
  const services = getServiceStats(records ?? []);

  const sortedServices = [...services].sort(
    (a, b) => b.totalValue - a.totalValue
  );

  return (
    <div className="flex w-full flex-col md:col-span-4 shadow-md shadow-black/20">
      <h2 className={`${lusitana.className} m-4 text-xl md:text-2xl`}>
        Top services
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-2">
          {sortedServices.length > 0 ? (
            sortedServices.slice(0, 6).map((service, index) => {
              return (
                <div
                  key={index}
                  className={clsx(
                    "flex flex-row items-center justify-between py-4",
                    {
                      "border-t border-t-green-500": index !== 0,
                    }
                  )}
                >
                  <div className="grid grid-cols-3 gap-10 items-start w-full">
                    <p className="truncate text-sm font-semibold md:text-base ml-10">
                      {service.service}
                    </p>
                    <p className="text-sm text-gray-500 sm:block mx-4 ">
                      {service.count}
                    </p>

                    <p
                      className={`${lusitana.className} truncate text-sm font-medium md:text-base`}
                    >
                      Ksh.{service.totalValue.toLocaleString("en-US")}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No Records found</p>
          )}
        </div>
        <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">Updated just now</h3>
        </div>
      </div>
    </div>
  );
}
