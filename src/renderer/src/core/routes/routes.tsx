import { RouteObject } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../../features/dashboard';
import AccountManager from '../../features/email';
import MailClient from '../../features/mail';
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
        element: <AccountManager />,
      },
      {
        path: 'mail',
        element: <MailClient />,
      },
      {
        path: 'setting',
        element: <SettingPage />,
      },
    ],
  },
];
