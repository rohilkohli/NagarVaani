import React, { useEffect } from "react";

export default function RootPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/citizen";
    }
  }, []);

  return null;
}
