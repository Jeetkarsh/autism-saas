import './globals.css'
import { Nunito, DM_Sans } from 'next/font/google'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const metadata = {
  title: 'AutismConnect - Supporting Your Child\'s Journey',
  description: 'A platform for parents of autistic children to track progress, access resources, and join a supportive community.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${nunito.variable} ${dmSans.variable}`}>
      <body className="font-body">
        <div className="layout">
          <Navbar />
          <main className="main-content">{children}</main>
          <Footer />
        </div>
        <Chatbot />
      </body>
    </html>
  )
}