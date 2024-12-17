"use client";

import { editUser } from "@/app/lib/action";
import { useState } from "react";
import { useFormStatus, useFormState } from "react-dom";
import { User, UserState } from "@/app/lib/definitions";
import { AtSymbolIcon, KeyIcon } from "@heroicons/react/24/outline";
import UserIcon from "../icons/userIcon";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Updating.." : "Update"}
    </button>
  );
}

export default function ProfileForm({
  user,
  type,
}: {
  user: User | undefined;
  type: string;
}) {
  function Edit() {
    const initialState: UserState = {
      message: null,
      errors: {},
      state_error: null,
      success: null,
    };
    const editUserById = editUser.bind(null, user?.id || "");
    const [editState, formAction] = useFormState(editUserById, initialState);

    const searchParams = useSearchParams();
    const resetPass = searchParams.get("resetPass");

    if (editState.success === false) {
      toast.error(editState.state_error);
    }

    return (
      <form action={formAction}>
        {resetPass === "true" && (
          <input type="hidden" name="resetPass" value="true" />
        )}
        <FormInputs label="Update profile" />
      </form>
    );
  }
  return (
    <section className="mt-8 max-w-xl mx-auto mb-20">
      <Edit />
    </section>
  );

  function FormInputs({ label }: { label: string }) {
    const [preview, setPreview] = useState<string | undefined>(user?.image);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setPreview(URL.createObjectURL(file));
      }
    };

    return (
      <div className="gap-2 items-end">
        <h2 className="mt-8 text-xl text-gray-500 text-center mb-6">{label}</h2>
        <div className="flex">
          <div className="w-1/3  h-2/3 mx-auto relative">
            <Image
              src={preview ?? "/images/avator.jpg"}
              width={150}
              height={100}
              alt="profile image"
              className="m-auto"
            />
            <label className="text-gray-700 text-sm ml-11 bottom-[5px] px-1 border rounded-lg pointer-events-none absolute">
              Choose Image
            </label>
            <input
              className="p-2 cursor-pointer opacity-0 ml-10 inset-0"
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="grow">
            <input
              type="hidden"
              id="name"
              name="role"
              defaultValue={type ?? ""}
              aria-describedby="name-error"
            />
            <div className="relative">
              <input
                type="text"
                id="name"
                placeholder="User Name"
                name="name"
                defaultValue={user?.name ?? ""}
                required
                aria-describedby="name-error"
                className="p-2 pl-8"
              />
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            {type === "supersupervisor" ? (
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="User Email"
                  defaultValue={user?.email ?? ""}
                  className="p-2 pl-8 my-6"
                  aria-describedby="email-error"
                />
                <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  placeholder="User Email"
                  defaultValue={user?.email ?? ""}
                  disabled
                  className="p-2 pl-8 my-6"
                  aria-describedby="email-error"
                />
                <input
                  type="hidden"
                  name="email"
                  defaultValue={user?.email ?? ""}
                />

                <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
            )}

            <div className="relative">
              <input
                type="password"
                id="password"
                placeholder="Leave blank to keep current password"
                name="password"
                defaultValue={""}
                aria-describedby="password-error"
                className="p-2 pl-8 my-6"
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div className="pb-2 flex gap-2 my-6">
              <SubmitButton />
              <Link href={`/dashboard/${type}/profile`} className="button">
                <span>Cancel</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
