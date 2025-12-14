import Header from "@/components/Header";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Main from "@/components/Main";
import SearchResults from "@/pages/SearchResults";
import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <>
      <Header />
      <NavBar />

      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/search" element={<SearchResults />} />
      </Routes>

      <Footer />
    </>
  );
}