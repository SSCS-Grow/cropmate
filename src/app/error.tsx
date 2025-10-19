"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  useEffect(() => {
    // Log mere læsbart i konsollen
    const asText =
      typeof error === "string"
        ? error
        : error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack ?? ""}`
        : JSON.stringify(error, null, 2);
    // eslint-disable-next-line no-console
    console.error("[App Error]", asText);
  }, [error]);

  return (
    <html>
      <body className="p-8">
        <h2 className="text-xl font-semibold mb-2">Noget gik galt</h2>
        <p className="text-sm text-gray-600 mb-4">
          Prøv at genindlæse siden. Hvis det sker igen, så tjek konsollen for detaljer.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-xl px-4 py-2 border"
        >
          Prøv igen
        </button>
      </body>
    </html>
  );
}
