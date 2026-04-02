import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { runMigration } from './store/migration';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const KingdomPage = lazy(() => import('./pages/KingdomPage'));

export default function App() {
  useEffect(() => {
    runMigration();
  }, []);

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 text-sm uppercase tracking-[0.28em] text-emerald-200">
          Loading Kingdom...
        </main>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/kingdom" element={<KingdomPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
