import "./globals.css";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import AuthProvider from "../features/auth/AuthContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "DatingHub — Find Your Perfect Match",
  description:
    "A modern premium dating platform to meet genuine people and build meaningful relationships.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: "var(--font-poppins), sans-serif",
                fontWeight: 500,
                fontSize: "0.875rem",
                borderRadius: "14px",
                padding: "12px 18px",
                boxShadow:
                  "0 10px 25px -5px rgba(0,0,0,.12), 0 4px 6px -2px rgba(0,0,0,.06)",
              },
              success: {
                style: {
                  background: "linear-gradient(135deg,#fdf2f8,#faf5ff)",
                  color: "#be185d",
                  border: "1px solid #fbcfe8",
                },
                iconTheme: { primary: "#ec4899", secondary: "#fff" },
              },
              error: {
                style: {
                  background: "#fff1f2",
                  color: "#be123c",
                  border: "1px solid #fecdd3",
                },
                iconTheme: { primary: "#f43f5e", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
