import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { get, getDatabase, ref, update } from 'firebase/database'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function Nav() {
	const [user, setUser] = useState(null)
	const auth = getAuth()
	const database = getDatabase()
	const navigate = useNavigate()
	const location = useLocation()
	const [userTeams, setUserTeams] = useState([])
	const [userProjects, setUserProjects] = useState([])
	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')
	const projectName = urlParams.get('projectname')

	// Текущий путь
	console.log(location.pathname)

	const fetchUserTeams = async userId => {
		const teamsRef = ref(database, 'teams')
		try {
			const snapshot = await get(teamsRef)
			if (snapshot.exists()) {
				const teams = snapshot.val()
				const userTeamsList = []
				let redirected = false

				Object.keys(teams).forEach(teamName => {
					if (teams[teamName].users && teams[teamName].users[userId]) {
						userTeamsList.push(teamName)
						if (teams[teamName].users[userId].work === true && !redirected) {
							navigate(`/team?teamname=${teamName}`)
							redirected = true // Переадресуем только один раз
						}
					}
				})

				setUserTeams(userTeamsList) // Update user teams
			}
		} catch (error) {
			console.error('Error fetching teams:', error)
		}
	}

	const fetchUserProjects = async () => {
		try {
			const projectsRef = ref(database, `teams/${teamName}/projects`)
			const snapshot = await get(projectsRef)
			if (snapshot.exists()) {
				const projects = Object.keys(snapshot.val() || {})
				setUserProjects(projects)
			} else {
				setUserProjects([]) // Если проектов нет, очищаем массив
			}
		} catch (error) {
			console.error('Error fetching user projects:', error.code, error.message)
		}
	}

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, user => {
			if (user) {
				setUser(user)
				fetchUserTeams(user.uid)
				fetchUserProjects(user.uid)
			} else {
				setUser(null)
			}
		})

		return () => {
			unsubscribe()
		}
	}, [auth])

	const handleChangeTeam = async () => {
		if (!user) return

		try {
			const teamsRef = ref(database, 'teams')
			const snapshot = await get(teamsRef)

			if (snapshot.exists()) {
				const teams = snapshot.val()
				const updates = {}

				Object.keys(teams).forEach(team => {
					if (teams[team].users && teams[team].users[user.uid]) {
						updates[`teams/${team}/users/${user.uid}/work`] = false
					}
				})

				await update(ref(database), updates)
				navigate('/createTeam')
			}
		} catch (error) {
			console.error('Error changing team:', error)
		}
	}

	return (
		<div className='nav'>
			<Link to='/' className='nav-title'>
				Workflow Wizard
			</Link>
			{teamName && (
				<Menu as='div' className='relative inline-block text-left'>
					<div>
						<MenuButton className='inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'>
							{teamName}
							<ChevronDownIcon
								aria-hidden='true'
								className='-mr-1 size-5 text-gray-400'
							/>
						</MenuButton>
					</div>

					<MenuItems
						transition
						className='absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in'
					>
						<div className='py-1'>
							{userTeams.map(team => (
								<MenuItem key={team}>
									<Link
										className='block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none'
										to={`/team?teamname=${team}`}
									>
										{team}
									</Link>
								</MenuItem>
							))}
							<MenuItem>
								<p
									className='block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none'
									onClick={handleChangeTeam}
								>
									Full list
								</p>
							</MenuItem>
						</div>
					</MenuItems>
				</Menu>
			)}
			{projectName && (
				<Menu as='div' className='relative inline-block text-left'>
					<div>
						<MenuButton className='inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'>
							{projectName}
							<ChevronDownIcon
								aria-hidden='true'
								className='-mr-1 size-5 text-gray-400'
							/>
						</MenuButton>
					</div>

					<MenuItems
						transition
						className='absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in'
					>
						<div className='py-1'>
							{userProjects.map(project => (
								<MenuItem key={project}>
									<Link
										className='block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none'
										to={`/team/project?teamname=${teamName}&projectname=${project}`}
									>
										{project}
									</Link>
								</MenuItem>
							))}
							<MenuItem>
								<Link
									className='block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none'
									to={`/team?teamname=${teamName}`}
								>
									Full list
								</Link>
							</MenuItem>
						</div>
					</MenuItems>
				</Menu>
			)}
			<Link to='/settings'>settings</Link>
			{user ? <span>{user.displayName}</span> : <Link to='/auth'>login</Link>}
		</div>
	)
}

export default Nav
