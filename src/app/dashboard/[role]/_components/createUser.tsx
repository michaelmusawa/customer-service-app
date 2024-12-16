"use client";

import { createUser } from "@/app/lib/action";
import { UserState } from "@/app/lib/definitions";
import UserForm from "@/components/forms/form";
import React, { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import toast from "react-hot-toast";

export default function CreateUserPage({
  type,
  success,
  loggedInUser,
}: {
  loggedInUser: string;
  success: string | undefined;
  type: string;
}) {
  const initialState: UserState = {
    response: null,
    message: null,
    state_error: null,
    errors: {},
  };
  const [state, formAction] = useFormState(createUser, initialState);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (success === "true") {
      toast.success("User edited successfully", {
        id: "success-toast", // Assign a unique ID for the success message
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [success]);

  if (state?.message) {
    if (state?.response === "ok") {
      formRef.current?.reset();
      toast.success(state.message);
    } else if (state?.response === "!ok") {
      toast.error(state.message);
    }
  } else if (state?.state_error) {
    toast.error(state.state_error);
  } else {
    toast.dismiss();
  }

  return (
    <div>
      <form ref={formRef} action={formAction}>
        <UserForm
          loggedInUser={loggedInUser}
          type={type}
          label={`Create ${type}`}
          user={undefined}
        />
      </form>
    </div>
  );
}
