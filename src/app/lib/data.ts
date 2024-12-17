import { GroupedByMonth } from "../dashboard/(overview)/page";
import { GroupedByDay, GroupedByWeek } from "./utils";

interface Service {
  name: string;
  subServices: string[];
}

export const Services: Service[] = [
  { name: "Daily parking", subServices: ["On-street", "Off-street"] },
  {
    name: "Seasonal parking",
    subServices: [
      "PSV Matatus",
      "Parking Stickers",
      "Lorries PSV Parking Stickers",
      "Taxis PSV Parking Stickers",
    ],
  },
  {
    name: "Reserved Parking",
    subServices: [
      "Loading Zones",
      "PSV Matatu Parking Bay Hire",
      "Trailer Parking  Bay Hire",
      "Parking bay hire",
    ],
  },
  { name: "VIP Parking", subServices: ["VIP Parking"] },
  {
    name: "Land Valuation",
    subServices: ["Land Valuation", "Provisional Valuation"],
  },
  {
    name: "Land Rates",
    subServices: [
      "Annual Land rates",
      "Rates Search",
      "Land Transfers",
      "Ground Rent",
      "Penalties on Land Rates",
      "Waiver of Penalties on Land",
      "SDR-Stand Premium",
      "Clearance Certificate",
    ],
  },
  { name: "Land Survey ", subServices: ["Land Surveying"] },
  {
    name: "Land Use Planning ",
    subServices: [
      "Land Subdivision",
      "Change of Use",
      "Land Amalgamation",
      "Extension/renewal of lease",
    ],
  },
  {
    name: "Development Control",
    subServices: [
      "Building Permits",
      "Construction Site Board",
      "Building Occupation Certificate",
      "Renovation Permit",
    ],
  },
];

export const getServiceStats = (
  groupedData: GroupedByMonth[] | GroupedByDay[] | GroupedByWeek[]
) => {
  const serviceStats: {
    [key: string]: { count: number; totalValue: number };
  } = {};

  // Iterate over grouped data
  groupedData.forEach((group) => {
    group.records.forEach((record) => {
      const service = record.service; // Each record has only one service
      const totalValue = record.totalValue;
      const count = record.count;

      if (!serviceStats[service]) {
        serviceStats[service] = { count: 0, totalValue: 0 };
      }
      serviceStats[service].count += count;
      serviceStats[service].totalValue += totalValue;
    });
  });

  // Convert serviceStats object to array
  const serviceStatsArray = Object.entries(serviceStats).map(
    ([service, stats]) => ({
      service,
      count: stats.count,
      totalValue: stats.totalValue,
    })
  );

  return serviceStatsArray;
};

export function FormatDate({ date }: { date: Date }) {
  const goodDate = new Date(date);
  const recordDate = goodDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return recordDate;
}

export function getCurrentTimeFormatted() {
  const currentTime = new Date();
  let hours = currentTime.getHours();
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert from 24-hour to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // If hours is 0, make it 12 (for 12 AM/PM)

  return `${hours}:${minutes} ${ampm}`;
}

export function formatTime(date: Date) {
  const currentTime = date;
  let hours = currentTime.getHours();
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert from 24-hour to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // If hours is 0, make it 12 (for 12 AM/PM)

  return `${hours}:${minutes} ${ampm}`;
}
