import { GroupedByMonth, LocalRecords } from "../dashboard/(overview)/page";
import { EditedRecord, Record } from "./definitions";

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
  revenue: GroupedByMonth[] | GroupedByDay[] | GroupedByWeek[] | GroupedByHour[]
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

export function getEditedRecordIds(
  records: Record[],
  editedRecords: EditedRecord[]
): string[] {
  // Filter EditedRecord for those with status === 'pending'
  const pendingEditedRecords = editedRecords.filter(
    (editedRecord) => editedRecord.status !== "pending"
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
  type: string;
  week: string;
  records: LocalRecords[];
  totalValue: number;
};

export function groupRecordsByWeek(
  records: LocalRecords[] | undefined
): GroupedByWeek[] {
  const groupedByWeek: {
    [week: string]: { records: LocalRecords[]; totalValue: number };
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
    type: "week",
    week,
    records: groupedByWeek[week].records,
    totalValue: groupedByWeek[week].totalValue,
  }));
}

export function groupRecordsByMonth(
  records: LocalRecords[] | undefined
): GroupedByMonth[] {
  const groupedByMonth: {
    [month: string]: { records: LocalRecords[]; totalValue: number };
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
    type: "month",
    month,
    records: groupedByMonth[month].records,
    totalValue: groupedByMonth[month].totalValue,
  }));
}

export type GroupedByHour = {
  type: string;
  hour: string;
  records: LocalRecords[];
  totalValue: number;
};

export function groupRecordsByHour(
  records: LocalRecords[] | undefined
): GroupedByHour[] {
  const groupedByHour: {
    [hour: string]: { records: LocalRecords[]; totalValue: number };
  } = {};

  records?.forEach((record) => {
    // Extract the hour from the time (e.g., "11:03:24" → "11:00")
    const hour = record.time.split(":")[0] + ":00";

    if (!groupedByHour[hour]) {
      groupedByHour[hour] = { records: [], totalValue: 0 };
    }

    groupedByHour[hour].records.push(record);
    groupedByHour[hour].totalValue += record.totalValue;
  });

  return Object.entries(groupedByHour).map(([hour, data]) => ({
    type: "hour",
    hour,
    records: data.records,
    totalValue: data.totalValue,
  }));
}

export type GroupedByDay = {
  type: string;
  dayName: string;
  records: LocalRecords[];
  totalValue: number;
};

export function groupRecordsByDay(
  records: LocalRecords[] | undefined
): GroupedByDay[] {
  const groupedByDay: {
    [dayName: string]: { records: LocalRecords[]; totalValue: number };
  } = {};

  records?.forEach((record) => {
    const dayName = record.dayName;

    if (!groupedByDay[dayName]) {
      groupedByDay[dayName] = { records: [], totalValue: 0 };
    }
    groupedByDay[dayName].records.push(record);

    groupedByDay[dayName].totalValue += record.totalValue;
  });

  return Object.keys(groupedByDay).map((dayName) => ({
    type: "day",
    dayName,
    records: groupedByDay[dayName].records,
    totalValue: groupedByDay[dayName].totalValue,
  }));
}

export interface G{
  startDate:Date;
  endDate:Date|null
}

export function filterRecordsByTimeRange(
  records: Record[],
  range: G
): Record[] {
  const startDate = new Date(range.startDate);
  const endDate = range.endDate;
  console.log(startDate+" to "+endDate)
  return records.filter((record) => {
    const recordDate = new Date(record.recordCreatedAt);

    // If endDate is provided, check both startDate and endDate
    if (endDate) {
      return recordDate >= startDate && recordDate <= endDate;
    } else {
      // If endDate is null, only check if recordDate is greater than or equal to startDate
      return recordDate >= startDate;
    }
  });
}



type Accumulator = {
  [userName: string]: {
    Name: string;
    numberOfTickets: number;
    value: number;
    shiftCounts: { [shift: string]: number };
  };
};

export function groupRecordsByUserName(records: Record[]) {
  return Object.values(
    records.reduce<Accumulator>((acc, record) => {
      const { userName, value, shift } = record;

      if (!acc[userName]) {
        acc[userName] = {
          Name: userName,
          numberOfTickets: 0,
          value: 0,
          shiftCounts: {}, // To track the frequency of shifts
        };
      }

      acc[userName].numberOfTickets += 1; // Increment the ticket count
      acc[userName].value += value || 0; // Sum up the values (handle missing values)

      // Track shift frequency
      if (shift) {
        acc[userName].shiftCounts[shift] =
          (acc[userName].shiftCounts[shift] || 0) + 1;
      }

      return acc;
    }, {})
  ).map((group) => {
    // Determine the most frequent shift
    const mostFrequentShift = Object.keys(group.shiftCounts).reduce((a, b) =>
      group.shiftCounts[a] > group.shiftCounts[b] ? a : b
    );

    return {
      Name: group.Name,
      numberOfTickets: group.numberOfTickets,
      value: group.value,
      shift: mostFrequentShift || null, // Handle if no shift is available
    };
  });
}
