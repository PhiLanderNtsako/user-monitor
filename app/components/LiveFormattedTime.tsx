"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "../utils/formatDateTime";

export default function LiveFormattedTime({
  timestamp,
}: {
  timestamp: string;
}) {
  const [time, setTime] = useState(() => formatDateTime(timestamp));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatDateTime(timestamp));
    }, 1000); // update every second

    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <span className="text-sm text-gray-100 mt-1 md:mt-0">
      {time.formatted}{" "}
      <span className="text-xs text-gray-100">({time.relative})</span>
    </span>
  );
}
