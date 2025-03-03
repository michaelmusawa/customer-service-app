import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const UnauthorizedMessage = ({ role }: { role: string }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Access Restricted
        </h1>

        <p className="text-gray-600 mb-6">
          You need{" "}
          <span className="font-semibold text-countyYellow">{role}</span>{" "}
          privileges to view this page.
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full inline-block px-6 py-3 bg-countyGreen hover:bg-green-800 text-white font-medium rounded-lg transition duration-200"
          >
            Return to Login
          </Link>

          <p className="text-sm text-gray-500 mt-4">
            Contact support if you believe this is an error
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedMessage;
