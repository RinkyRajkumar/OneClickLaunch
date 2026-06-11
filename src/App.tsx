import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LaunchStatus from "./pages/LaunchStatus";
import LogsPage from "./pages/LogsPage";
import PresetEditor from "./pages/PresetEditor";
import SettingsPage from "./pages/SettingsPage";
import Templates from "./pages/Templates";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="preset/new" element={<PresetEditor />} />
        <Route path="preset/:id" element={<PresetEditor />} />
        <Route path="launch/:id" element={<LaunchStatus />} />
        <Route path="templates" element={<Templates />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
