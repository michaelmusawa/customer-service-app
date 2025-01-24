"use client";

import { createUser } from "@/app/lib/action";
import { CreateUserState } from "@/app/lib/definitions";
import UserForm from "@/components/forms/form";
import React, { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import toast from "react-hot-toast";

export default function CreateUserPage({
  type,
  success,
  loggedInUser,
  label,
  station,
}: {
  loggedInUser: string;
  success: string | undefined;
  type: string;
  label: string;
  station: string | undefined;
}) {
  const initialState: CreateUserState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const [state, formAction] = useFormState(createUser, initialState);

  const formRef = useRef<HTMLFormElement>(null);

  if(state.state_error) {
    toast.error(state.state_error, {
      id: 'state_error',
    });
  }

  useEffect(() => {
    if (success === "true") {
      toast.success("User edited successfully", {
        id: "success-toast", // Assign a unique ID for the success message
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [success]);

  if (state?.message) {
    formRef.current?.reset();
    toast.success(state.message, { id: "add-success"});
    state.message = null;
  }

  return (
    <div>
      <form ref={formRef} action={formAction}>
        <UserForm
          loggedInUser={loggedInUser}
          type={type}
          label={label}
          user={undefined}
          station={station}
        />
      </form>
    </div>
  );
}
