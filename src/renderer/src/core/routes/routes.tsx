import { RouteObject } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../../features/dashboard';
import EmailManager from '../../features/email';
import ProxyManager from '../../features/proxy';
import SettingPage from '../../features/setting';

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
        element: <EmailManager />,
      },
      {
        path: 'proxy',
        element: <ProxyManager />,
      },
      {
        path: 'setting',
        element: <SettingPage />,
      },
    ],
  },
];
