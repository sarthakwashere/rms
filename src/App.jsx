import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from '../app/dashboard/page';
import LoginPage from '../app/login/page';
import GanttPage from '../app/gantt/page';
import ConstraintsPage from '../app/constraints/page';
import RulesPage from '../app/rules/page';
import TemplatesPage from '../app/templates/page';
import SimulationsPage from '../app/simulations/page';
import ReportsPage from '../app/reports/page';
import AllocationsPage from '../app/allocations/page';
import ConflictsPage from '../app/conflicts/page';
import HistoryPage from '../app/history/page';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/gantt" element={<GanttPage />} />
      <Route path="/allocations" element={<AllocationsPage />} />
      <Route path="/conflicts" element={<ConflictsPage />} />
      <Route path="/rules" element={<RulesPage />} />
      <Route path="/constraints" element={<ConstraintsPage />} />
      <Route path="/templates" element={<TemplatesPage />} />
      <Route path="/simulations" element={<SimulationsPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
