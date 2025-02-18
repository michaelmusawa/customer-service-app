"use client";

import { useState } from "react";

export default function Date() {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>("");

  return (
    <div>
      <fieldset className="flex border bg-gray-50 shadow-sm p-2 rounded-md max-md:w-full">
        <legend>Date</legend>
        <input
          type="date"
          value={startDate || ""}
          onChange={(e) => setStartDate(e.target.value)}
          className="border px-1 m-1 rounded bg-gray-100"
        />
        <label className="max-lg:text-sm">To</label>
        <input
          type="date"
          value={endDate || ""}
          onChange={(e) => setEndDate(e.target.value)}
          className="border px-1 m-1 rounded bg-gray-100"
        />
      </fieldset>
    </div>
  );
}

{
  /*export function Values(start:string,end:string){
  return {
    startDate: start,
    endDate: end,
  }
}*/
}
