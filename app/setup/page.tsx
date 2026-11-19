import Link from "next/link";
import { missingSettings } from "@/lib/config";
export default function SetupPage() {
  const missing = missingSettings();
  const services = [
    ...new Set(
      missing.map((key) =>
        key.includes("CLERK")
          ? "Account sign-in"
          : key.includes("MONGO")
            ? "Community database"
            : "Video meetings",
      ),
    ),
  ];
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#101421",
        color: "#f5f7ff",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 580,
          padding: "clamp(24px, 5vw, 48px)",
          border: "1px solid #33415f",
          borderRadius: 24,
          background: "#192236",
        }}
      >
        <p
          style={{ color: "#98baff", fontWeight: 700, letterSpacing: "0.15em" }}
        >
          DevoverFlow
        </p>
        <h1
          style={{
            fontSize: "clamp(28px, 6vw, 38px)",
            lineHeight: 1.15,
            margin: "24px 0 16px",
          }}
        >
          {missing.length
            ? "Service setup is pending"
            : "Services are configured"}
        </h1>
        <p style={{ color: "#cad5ed", lineHeight: 1.7 }}>
          {missing.length
            ? "The app is running. The following services need to be connected before you can use it:"
            : "You can return to the app to continue."}
        </p>
        <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
          {services.map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
        <p style={{ color: "#cad5ed", lineHeight: 1.7 }}>
          Setup instructions are in the project README. After adding the
          settings, restart the app.
        </p>
        {!missing.length && (
          <Link style={{ color: "#98baff" }} href="/">
            Open app
          </Link>
        )}
      </section>
    </main>
  );
}
