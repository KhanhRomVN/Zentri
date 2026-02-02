import { RouteObject } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../../features/dashboard';
import AccountManager from '../../features/email';
import SettingPage from '../../features/setting';
import ProxyPage from '../../features/proxy';
import RegPage from '../../features/reg';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'email',
        element: <AccountManager />,
      },
      {
        path: 'setting',
        element: <SettingPage />,
      },
      {
        path: 'proxy',
        element: <ProxyPage />,
      },
      {
        path: 'reg',
        element: <RegPage />,
      },
    ],
  },
];
