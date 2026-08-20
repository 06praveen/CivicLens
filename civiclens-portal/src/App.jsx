import TopBar from './components/TopBar.jsx'
import Header from './components/Header.jsx'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <TopBar />
      <Header />
      <Navbar />
      <main id="main-content">
        <Hero />
        {/* Add BudgetAtAGlance, ExploreBudget, Departments, AiInsights, AskCivicLens
            sections here, following the same component pattern. */}
      </main>
    </div>
  )
}
