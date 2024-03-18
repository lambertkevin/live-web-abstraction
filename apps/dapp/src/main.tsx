import { memo } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import Index from './views/index';
import './index.css';

const AppLayout = memo(() => {
  return (
    <main className="flex flex-row flex-grow py-4">
      <Outlet />
    </main>
  );
});
AppLayout.displayName = 'AppLayout';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <Index />,
      },
      {
        path: '*',
        element: <h1>404</h1>,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
