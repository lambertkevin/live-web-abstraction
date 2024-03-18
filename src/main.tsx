import React, { memo } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import ModalContainer from './modals/ModalContainer';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Accounts from './views/Accounts';
import Account from './views/Account';
import './index.css';

const AppLayout = memo(() => {
  return (
    <main className="flex flex-row min-h-[100vh] flex-grow">
      <Sidebar />
      <div className="flex flex-col flex-grow pl-64 pr-6 py-2">
        <TopBar />
        <div className="flex flex-grow">
          <Outlet />
        </div>
      </div>
      <div>
        <ModalContainer />
      </div>
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
        element: <Accounts />,
      },
      {
        path: '/accounts/:accountId',
        element: <Account />,
      },
      {
        path: '*',
        element: <h1>404</h1>,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
