import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import '../firebase.config.js'
import CreateTeam from './components/CreateTeam.jsx'
import Nav from './components/nav/Nav.jsx'
import './index.css'
import Auth from './pages/auth/Auth.jsx'
import Invite from './pages/invite/Invite.jsx'
import Project from './pages/project/Project.jsx'
import Settings from './pages/settings/Settings.jsx'
import Task from './pages/task/Task.jsx'
import Team from './pages/team/Team.jsx'
import Welcome from './pages/welcome/Welcome.jsx'

const RootLayout = () => (
	<>
		<Nav />
		<Outlet />
	</>
)

const router = createBrowserRouter([
	{
		path: '/',
		element: <RootLayout />,
		children: [
			{ index: true, element: <Welcome /> },
			{ path: 'auth', element: <Auth /> },
			{ path: 'team', element: <Team /> },
			{ path: 'team/project', element: <Project /> },
			{ path: 'team/project/task', element: <Task /> },
			{ path: 'createteam', element: <CreateTeam /> },
			{ path: 'settings', element: <Settings /> },
			{ path: 'invite', element: <Invite /> },
		],
	},
])

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>
)
