import './globals.css';
export const metadata = {
  title: 'AODB · Resource Management System',
  description: 'Airport Operations Resource Management System'
};
export default function RootLayout({
  children
}) {
  return <html lang="en">
      <body>{children}</body>
    </html>;
}
