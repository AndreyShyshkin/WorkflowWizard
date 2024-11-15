import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import "../firebase.config.js";
import "./index.css";
import Nav from "./components/nav/Nav.jsx";
import Welcome from "./pages/welcome/Welcome.jsx";
import Auth from "./pages/auth/Auth.jsx";
import Main from "./pages/main/Main.jsx";

const RootLayout = () => (
  <>
    <Nav />
    <Outlet />
  </>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />, // используем RootLayout, чтобы включить Nav и Outlet
    children: [
      { index: true, element: <Welcome /> },
      { path: "auth", element: <Auth /> },
      { path: "main", element: <Main /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
