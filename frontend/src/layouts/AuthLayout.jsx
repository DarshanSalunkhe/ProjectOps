import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-shell min-h-screen">
      <div className="auth-aside hidden lg:flex">
        <div className="relative z-10 max-w-lg">
          <div className="mb-14 flex items-center gap-3"><span className="brand-mark">P</span><span className="text-xl font-bold tracking-tight text-white">ProjectOps</span></div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">One workspace. Clear momentum.</p>
          <h1 className="max-w-md text-5xl font-semibold leading-[1.08] tracking-tight text-white">Make the work visible.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">Bring projects, people, and priorities into focus with a workspace built for getting things done.</p>
          <div className="mt-12 grid grid-cols-2 gap-3"><div className="auth-note"><span className="auth-note-dot" />Project clarity</div><div className="auth-note"><span className="auth-note-dot auth-note-green" />Team alignment</div></div>
        </div>
        <div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" />
      </div>
      <div className="auth-main flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center justify-center gap-3 lg:hidden"><span className="auth-brand-mark">P</span><span className="text-xl font-bold tracking-tight text-slate-900">ProjectOps</span></div>
          <Outlet />
          <p className="mt-6 text-center text-xs text-slate-400">A focused space for better project work</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
