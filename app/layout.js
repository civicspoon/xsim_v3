import "./globals.css";



export const metadata = {
  title: "Xsim V3 CBT Platform",
  description: " XSIM V3 CBT Platform for Security Training",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={` antialiased overflow-hidden `}
      >
        {children}
      </body>
    </html>
  );
}
