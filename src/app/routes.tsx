import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Workspace } from "./components/Workspace";
import { CompareMode } from "./components/CompareMode";
import { MedicalMode } from "./components/MedicalMode";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { path: "login", Component: Login },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, Component: Dashboard },
          { path: "workspace", Component: Workspace },
          { path: "workspace/:id", Component: Workspace },
          { path: "compare/:id", Component: CompareMode },
          { path: "medical/:id", Component: MedicalMode },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);