import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ScrollManager } from './components/ScrollManager'
import { Home } from './pages/Home'
import { Safaris } from './pages/Safaris'
import { SafariDetail } from './pages/SafariDetail'
import { Experiences } from './pages/Experiences'
import { Destinations } from './pages/Destinations'
import { About } from './pages/About'

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-savanna-green focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/safaris" element={<Safaris />} />
          <Route path="/safaris/:id" element={<SafariDetail />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}

export default App
