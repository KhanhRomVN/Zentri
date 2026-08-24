import { RouteObject } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../features/dashboard';
import EmailManager from '../features/email';
import ProxyManager from '../features/proxy';
import FilterPage from '../features/filter';
import SettingPage from '../features/setting';
import WorkflowPage from '../features/workflow';
import Forge from '@renderer/features/forge/Forrge';

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
        path: 'forge',
        element: <Forge />,
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
        element: <FilterPage />,
      },
      {
        path: 'setting',
        element: <SettingPage />,
      },
      {
        path: 'workflow',
        element: <WorkflowPage />,
      },
    ],
  },
];
