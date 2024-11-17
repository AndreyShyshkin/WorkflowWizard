import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { get, getDatabase, onValue, ref, update } from 'firebase/database'
import { Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import noPhoto from '../../assets/noPhoto.png'

function Nav() {
	const [user, setUser] = useState(null)
	const auth = getAuth()
	const database = getDatabase()
	const navigate = useNavigate()
	const [userTeams, setUserTeams] = useState([])
	const [userProjects, setUserProjects] = useState([])
	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')
	const projectName = urlParams.get('projectname')

	const fetchUserTeams = userId => {
		const teamsRef = ref(database, 'teams')
		const unsubscribe = onValue(teamsRef, snapshot => {
			if (snapshot.exists()) {
				const teams = snapshot.val()
				const userTeamsList = []
				let redirected = false

				Object.keys(teams).forEach(teamName => {
					if (teams[teamName].users && teams[teamName].users[userId]) {
						userTeamsList.push(teamName)
						if (teams[teamName].users[userId].work === true && !redirected) {
							navigate(`/team?teamname=${teamName}`)
							redirected = true
						}
					}
				})

				setUserTeams(userTeamsList)
			} else {
				setUserTeams([])
			}
		})

		return unsubscribe
	}

	const fetchUserProjects = teamName => {
		const projectsRef = ref(database, `teams/${teamName}/projects`)
		const unsubscribe = onValue(projectsRef, snapshot => {
			if (snapshot.exists()) {
				const projects = Object.keys(snapshot.val() || {})
				setUserProjects(projects)
			} else {
				setUserProjects([])
			}
		})

		return unsubscribe
	}

	useEffect(() => {
		let unsubscribeTeams
		let unsubscribeProjects

		const unsubscribeAuth = onAuthStateChanged(auth, user => {
			if (user) {
				setUser(user)
				unsubscribeTeams = fetchUserTeams(user.uid)

				if (teamName) {
					unsubscribeProjects = fetchUserProjects(teamName)
				}
			} else {
				setUser(null)
				setUserTeams([])
				setUserProjects([])
			}
		})

		return () => {
			unsubscribeAuth()
			if (unsubscribeTeams) unsubscribeTeams()
			if (unsubscribeProjects) unsubscribeProjects()
		}
	}, [auth, teamName])

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
		<div className='nav flex justify-between py-5'>
			<div className='flex h-full'>
				<Link to='/' className='nav-title my-auto mr-8'>
					<img
						className='h-16 w-16 rounded-full my-auto'
						src={logo}
						alt='logo'
					/>
				</Link>
				{user ? (
					<div className='flex'>
						{teamName && (
							<Menu
								as='div'
								className='relative inline-block text-left my-auto'
							>
								<div>
									<MenuButton className='inline-flex w-full justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-neutral-800'>
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

						{projectName && <span className='my-auto mx-2'> {'>'} </span>}

						{projectName && (
							<Menu
								as='div'
								className='relative inline-block text-left my-auto'
							>
								<div>
									<MenuButton className='inline-flex w-full justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-neutral-800'>
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
					</div>
				) : null}
			</div>
			{user ? (
				<div className='flex'>
					<Link to='/settings' className='my-auto'>
						<Settings />
					</Link>
					<span className='my-auto ml-4'>{user.displayName}</span>
					<img
						src={user.photoURL || noPhoto}
						alt='User Avatar'
						className='h-8 w-8 rounded-full my-auto ml-2'
						onError={e => (e.target.style.display = 'none')}
					/>
				</div>
			) : (
				<Link to='/auth'>Login</Link>
			)}
		</div>
	)
}

export default Nav
