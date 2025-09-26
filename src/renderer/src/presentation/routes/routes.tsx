import { RouteObject } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import EmailManagerPage from '../pages/EmailManager'
import SettingPage from '../pages/Setting'
import PeopleManagerPage from '../pages/PeopleManager'
import NotFoundPage from '../pages/Other/NotFoundPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <EmailManagerPage />
      },
      {
        path: 'people',
        element: <PeopleManagerPage />
      },
      {
        path: 'setting',
        element: <SettingPage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]
