import Header from "./components/Header";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <NavBar />

      <main className="w-full max-w-[1200px] mx-auto px-4 py-8">
        {/* Nội dung chính của app */}
      </main>
      <Footer />
    </div>
  );
}

export default App;