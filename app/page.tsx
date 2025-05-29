import Image from "next/image";

// app/page.tsx
export default function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-semibold mb-4">
        Welcome to the Work Status App
      </h1>
      <p className="text-gray-600">
        Select a role from the navigation bar to continue.
      </p>
    </div>
  );
}
