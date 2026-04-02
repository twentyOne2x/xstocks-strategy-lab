import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { WorkflowList } from "./components/WorkflowList/WorkflowList";
import { EditorPage } from "./pages/EditorPage";
import { ToastContainer } from "./components/Toast/Toast";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<WorkflowList />} />
        <Route path="/app/workflow/:id" element={<EditorPage />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
