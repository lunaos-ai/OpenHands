import {
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import "./tailwind.css";
import "./index.css";
import React from "react";
import { Toaster } from "react-hot-toast";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "14px",
              background: "rgba(16, 26, 40, 0.82)",
              color: "#edf4ff",
              border: "1px solid rgba(200, 222, 255, 0.24)",
              backdropFilter: "blur(16px)",
            },
          }}
        />
        <div id="modal-portal-exit" />
      </body>
    </html>
  );
}

export const meta: MetaFunction = () => [
  { title: "OpenHands" },
  { name: "description", content: "Let's Start Building!" },
];

export default function App() {
  return <Outlet />;
}
