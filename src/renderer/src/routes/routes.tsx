import { RouteObject } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../features/dashboard';
import Email from '../features/email/Email';
import Proxy from '../features/proxy/Proxy';
import Filter from '../features/filter/Filter';
import Setting from '../features/setting/Setting';
import Workflow from '../features/workflow/Workflow';
import Dfd from '../features/dfd/Dfd';
import Forge from '@renderer/features/forge/Forrge';
import Device from '@renderer/features/device/Device';

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
        element: <Email />,
      },
      {
        path: 'proxy',
        element: <Proxy />,
      },
      {
        path: 'filter',
        element: <Filter />,
      },
      {
        path: 'setting',
        element: <Setting />,
      },
      {
        path: 'workflow',
        element: <Workflow />,
      },
      {
        path: 'dfd',
        element: <Dfd />,
      },
      {
        path: 'device',
        element: <Device />,
      },
    ],
  },
];
