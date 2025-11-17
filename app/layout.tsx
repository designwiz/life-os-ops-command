import "./globals.css";
import ThemeWrapper from "./ThemeWrapper";   // <-- required import

export const metadata = {
  title: "Life OS",
  description: "Ops Command for Will + Michelle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeWrapper>
          {children}
        </ThemeWrapper>
      </body>
    </html>
  );
}
