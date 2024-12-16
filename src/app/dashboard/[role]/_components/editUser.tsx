"use client";

import { editUser } from "@/app/lib/action";
import { User, UserState } from "@/app/lib/definitions";
import UserForm from "@/components/forms/form";
import React, { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import toast from "react-hot-toast";

export default function EditUserPage({
  user,
  type,
  loggedInUser,
}: {
  loggedInUser: string;
  type: string;
  user: User | undefined;
}) {
  const initialState: UserState = { message: null, errors: {} };
  const editUserById = editUser.bind(null, user?.id ?? "");
  const [state, formAction] = useFormState(editUserById, initialState);

  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    console.log("This state 1", state);
    if (state && !toastShown) {
      if (state.message && state.success) {
        toast.success(state.message);
        setToastShown(true); // Mark the toast as shown
      }
      if (state.state_error) {
        toast.error(state.state_error);
      }
      if (state.errors) {
        const errorMessages = Object.values(state.errors)
          .flat() // Flatten arrays of error messages
          .filter(Boolean) // Remove undefined or null values
          .join(", "); // Join all error messages into a single string
        if (errorMessages.length > 0) {
          toast.error(errorMessages);
        }
      }
    }
    console.log("This state 2", state);
  }, [state, toastShown]);

  return (
    <div>
      <form action={formAction}>
        <UserForm
          type={type}
          label={`Update ${type}`}
          user={user}
          loggedInUser={loggedInUser}
        />
      </form>
    </div>
  );
}
