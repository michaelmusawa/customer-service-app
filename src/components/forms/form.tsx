"use client";

import { useFormStatus } from "react-dom";
import { User } from "@/app/lib/definitions";
import { AtSymbolIcon } from "@heroicons/react/24/outline";
import UserIcon from "../icons/userIcon";
import Link from "next/link";
import { Stations } from "@/app/lib/data";

function SubmitButton({ editedUser }: { editedUser: User | undefined }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending
        ? editedUser
          ? "Updating..."
          : "Creating..."
        : editedUser
        ? "Update"
        : "Create"}
    </button>
  );
}



export default function UserForm({
  user,
  type,
  label,
  loggedInUser,
  station,
}: {
  loggedInUser: string;
  label: string;
  user: User | undefined;
  type: string;
  station: string | undefined;
}) {


  return (
    <div className="gap-2 items-end">
      <div className="flex grow items-center justify-center mb-4">
        <h2 className="text-gray-500">{label}</h2>
      </div>

      <div className="grow">
        <input
          type="hidden"
          id="name"
          name="role"
          defaultValue={type || ""}
          aria-describedby="name-error"
        />
        <div className="relative">
          <input
            type="text"
            id="name"
            placeholder="User Name"
            name="name"
            defaultValue={user?.name || ""}
            required
            aria-describedby="name-error"
            className="p-2 pl-8"
          />
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
        </div>
        <div className="relative">
          <input
            type="email"
            id="email"
            placeholder="User Email"
            name="email"
            defaultValue={user?.email || ""}
            required
            aria-describedby="email-error"
            className="p-2 pl-8"
          />
          <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
        </div>
        {loggedInUser === "admin" ? (
          <div>
          <label className="block text-sm font-medium text-gray-500">Select station</label>
          <select
            name="station"
            defaultValue={user?.station || ""}
            className="border p-2 rounded-lg w-full"
          >
            {Stations.map((station, index) => (
              <option key={index} value={station.name}>
                {station.name}
              </option>
            ))}
          </select>
        </div>
        ):(
          <input
          type="hidden"
          id="station"
          name="station"
          defaultValue={user?.station ?? station}
          aria-describedby="name-error"
        />
        )}
        

        <div className="relative">
          <input
            type="hidden"
            id="password"
            placeholder="Password"
            name="password"
            defaultValue={""}
            required
            aria-describedby="password-error"
            className="p-2 pl-8"
          />
        </div>
      </div>
      <div className="pb-2 flex gap-2">
        <SubmitButton editedUser={user} />
        {user && (
          <Link
            className="button"
            href={`/dashboard/${loggedInUser}/${type}s/create`}
          >
            Cancel
          </Link>
        )}
      </div>
    </div>
  );
}
