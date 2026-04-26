import { RouteObject } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../../features/dashboard';
import EmailManager from '../../features/email';
import RegisManager from '../../features/regis';
import ProxyManager from '../../features/proxy';
import SearchManager from '../../features/search';
import SettingPage from '../../features/setting';
import NotFoundPage from '../pages/NotFoundPage';

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
        path: 'regis',
        element: <RegisManager />,
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
        path: 'search',
        element: <SearchManager />,
      },
      {
        path: 'setting',
        element: <SettingPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];
