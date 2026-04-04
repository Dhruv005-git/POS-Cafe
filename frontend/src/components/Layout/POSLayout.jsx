import { Outlet } from 'react-router-dom';
import TopBar from './TopBar.jsx';

export default function POSLayout() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}