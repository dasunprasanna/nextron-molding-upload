import "./globals.css";
import Logo from "./components/logo";

export const metadata = {
  title: "Nextron Molding Plan",
  description: "Bodyline Pvt Ltd",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Logo />
      </body>
    </html>
  );
}
