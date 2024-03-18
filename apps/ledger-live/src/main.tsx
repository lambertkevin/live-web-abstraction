import { memo } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import ModalContainer from './modals/ModalContainer';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Discover from './views/Discover';
import Accounts from './views/Accounts';
import Account from './views/Account';
import Connect from './views/Connect';
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

const ConnectLayout = memo(() => {
  return (
    <main className="flex flex-row min-h-[100vh] flex-grow">
      <Outlet />
      <ModalContainer />
    </main>
  );
});
ConnectLayout.displayName = 'ConnectLayout';

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
        path: '/discover',
        element: <Discover />,
      },
      {
        path: '*',
        element: <h1>404</h1>,
      },
    ],
  },
  {
    element: <ConnectLayout />,
    children: [
      {
        path: '/Connect',
        element: <Connect />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
