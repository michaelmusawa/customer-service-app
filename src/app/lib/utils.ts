import { GroupedByMonth } from "../dashboard/(overview)/page";
import { EditedRecord, GroupedRecord, Record } from "./definitions";

export const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

export const formatDateToLocal = (
  dateStr: string,
  locale: string = "en-US"
) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

export const generateYAxis = (
  revenue: GroupedByMonth[] | GroupedByDay[] | GroupedByWeek[]
) => {
  const yAxisLabels = [];
  const highestRecord = Math.max(...revenue.map((month) => month.totalValue));

  // Determine the step size to keep labels within a reasonable count (maximum 6)
  const maxLabels = 6;
  const stepSize = Math.ceil(highestRecord / maxLabels / 1000) * 1000; // Round step size to the nearest 1,000
  const topLabel = Math.ceil(highestRecord / stepSize) * stepSize;

  // Generate labels from topLabel down to 0, with a maximum of 6 labels
  for (let i = topLabel; i >= 0; i -= stepSize) {
    if (i >= 1000) {
      yAxisLabels.push(`$${i / 1000}K`); // Use 'K' for thousands
    } else {
      yAxisLabels.push(`$${i}`); // Use raw value for smaller amounts
    }
  }

  return { yAxisLabels, topLabel };
};

export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage >= totalPages - 2) {
    return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

export function mergeRecordsWithEdits(
  records: Record[],
  editedRecords: EditedRecord[]
): Record[] {
  // Create a map for quick lookup of EditedRecords by recordId
  const editedRecordMap = new Map(
    editedRecords
      .filter((edited) => edited.status === "accepted") // Filter only "accepted" EditedRecords
      .map((edited) => [edited.recordId, edited])
  );

  // Map through the records array
  return records.map((record) => {
    const matchingEditedRecord = editedRecordMap.get(record.recordId);

    // If a matching EditedRecord exists, merge its values into the Record
    if (matchingEditedRecord) {
      return {
        ...record,
        name: matchingEditedRecord.name,
        ticket: matchingEditedRecord.ticket,
        recordType: matchingEditedRecord.recordType,
        value: matchingEditedRecord.value,
        service: matchingEditedRecord.service,
        subService: matchingEditedRecord.subService,
        shift: matchingEditedRecord.shift,
        recordCreatedAt: matchingEditedRecord.editedRecordCreatedAt,
        userName: matchingEditedRecord.userName,
        userEmail: matchingEditedRecord.userEmail,
        counter: matchingEditedRecord.counter,
      };
    }

    // If no match, return the original Record
    return record;
  });
}

export function getPendingRecordIds(
  records: Record[],
  editedRecords: EditedRecord[]
): string[] {
  // Filter EditedRecord for those with status === 'pending'
  const pendingEditedRecords = editedRecords.filter(
    (editedRecord) => editedRecord.status === "pending"
  );

  // Extract recordIds of the matching records
  const recordIds = records
    .filter((record) =>
      pendingEditedRecords.some(
        (editedRecord) => editedRecord.recordId === record.recordId
      )
    )
    .map((record) => record.recordId);

  return recordIds;
}

export type GroupedByWeek = {
  week: string;
  records: GroupedRecord[];
  totalValue: number;
};

export function groupRecordsByWeek(
  records: GroupedRecord[] | undefined
): GroupedByWeek[] {
  const groupedByWeek: {
    [week: string]: { records: GroupedRecord[]; totalValue: number };
  } = {};

  records?.forEach((record) => {
    const week = record.week;

    if (!groupedByWeek[week]) {
      groupedByWeek[week] = { records: [], totalValue: 0 };
    }
    groupedByWeek[week].records.push(record);

    groupedByWeek[week].totalValue += record.totalValue;
  });

  return Object.keys(groupedByWeek).map((week) => ({
    week,
    records: groupedByWeek[week].records,
    totalValue: groupedByWeek[week].totalValue,
  }));
}

export function groupRecordsByMonth(
  records: GroupedRecord[] | undefined
): GroupedByMonth[] {
  const groupedByMonth: {
    [month: string]: { records: GroupedRecord[]; totalValue: number };
  } = {};

  records?.forEach((record) => {
    const month = record.month;

    if (!groupedByMonth[month]) {
      groupedByMonth[month] = { records: [], totalValue: 0 };
    }
    groupedByMonth[month].records.push(record);

    groupedByMonth[month].totalValue += record.totalValue;
  });

  return Object.keys(groupedByMonth).map((month) => ({
    month,
    records: groupedByMonth[month].records,
    totalValue: groupedByMonth[month].totalValue,
  }));
}

export type GroupedByDay = {
  date: string;
  records: GroupedRecord[];
  totalValue: number;
};

export function groupRecordsByDay(
  records: GroupedRecord[] | undefined
): GroupedByDay[] {
  const groupedByDay: {
    [date: string]: { records: GroupedRecord[]; totalValue: number };
  } = {};

  records?.forEach((record) => {
    const date = record.date;

    if (!groupedByDay[date]) {
      groupedByDay[date] = { records: [], totalValue: 0 };
    }
    groupedByDay[date].records.push(record);

    groupedByDay[date].totalValue += record.totalValue;
  });

  return Object.keys(groupedByDay).map((date) => ({
    date,
    records: groupedByDay[date].records,
    totalValue: groupedByDay[date].totalValue,
  }));
}

export function filterRecordsByTimeRange(
  records: Record[],
  range: string
): Record[] {
  console.log("Im here", range);
  const now = new Date();
  let startDate: Date;

  switch (range) {
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1); // January 1st of the current year
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st day of the current month
      break;
    case "week":
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Adjust for Monday as start of week
      startDate.setHours(0, 0, 0, 0); // Reset to start of the day
      break;
    case "day":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
      break;
    default:
      throw new Error("Invalid range specified");
  }
  console.log("the date", startDate);
  console.log(records);

  console.log(
    records.filter((record) => new Date(record.recordCreatedAt) >= startDate)
  );

  return records.filter(
    (record) => new Date(record.recordCreatedAt) >= startDate
  );
}
