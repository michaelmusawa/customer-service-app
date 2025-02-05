"use client";
import { useEffect, useState } from "react";

const Loading = () => {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center text-lg font-semibold text-gray-600">
      Loading{dots}
    </div>
  );
};

export default Loading;
