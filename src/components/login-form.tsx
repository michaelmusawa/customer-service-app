"use client";

import { lusitana } from "@/app/fonts/fonts";
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import ArrowRightIcon from "./icons/arrowRight";
import { useFormStatus, useFormState } from "react-dom";
import { authenticate } from "@/app/lib/action";
import { useState } from "react";

function LoginButton() {
  const { pending } = useFormStatus();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (pending) {
      e.preventDefault();
    }
  };
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={handleClick}
      className="flex gap-2 mt-2"
    >
      {pending ? "Logging in..." : "Login"}
      <ArrowRightIcon className="w-4" />
    </button>
  );
}

export default function LoginForm() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  }

  return (
    <form action={dispatch} className="space-y-3 shadow-md shadow-black/20">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-lg`}>
          Please log in to continue.
        </h1>
        <div className="w-full">
          <div>
            <label
              className="mb-1 mt-5 block text-xs font-medium text-gray-700"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="mb-1 mt-5 block text-xs font-medium text-gray-700"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative mb-6 border">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
              />
              <span className="absolute right-2 top-0.5 pt-2 cursor-pointer" onClick={togglePassword}>
              {showPassword ? "👁️" : "🙈"}
              </span>
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              
            </div>
          </div>
        </div>
        <LoginButton />
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
