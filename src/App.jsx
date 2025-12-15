import Header from "@/components/Header";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Main from "@/components/Main";
import SearchResults from "@/pages/SearchResults";
import MoviesDetail from "@/pages/MoviesDetail";
import PersonDetail from "@/pages/PersonDetail";
import Loading from "@/components/Loading";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <>
      <Header />
      <NavBar />

      <Loading />

      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/movies/:id" element={<MoviesDetail />} />
        <Route path="/person/:id" element={<PersonDetail />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>

      <Footer />
    </>
  );
}