import Header from "./Header";
import NavBar from "./NavBar";
import Footer from "./Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <NavBar />
      {/* content của bạn ở đây */}
      <Footer />
    </div>
  );
}