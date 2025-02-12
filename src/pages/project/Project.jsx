import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { get, getDatabase, ref, update } from 'firebase/database'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Statistics from '../../components/Statistics'
import TasksBoard from '../../components/TasksBoard'

function Project() {
	const [user, setUser] = useState(null)
	const [projectStatus, setProjectStatus] = useState({
		exists: null,
		member: null,
	})
	const [currentView, setCurrentView] = useState('statistics')
	const [teamUsers, setTeamUsers] = useState([])

	const auth = getAuth()
	const database = getDatabase()
	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')
	const projectName = urlParams.get('projectname')
	const navigate = useNavigate()

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, currentUser => {
			if (currentUser) {
				setUser(currentUser)
				checkProjectStatus(currentUser.uid)
				fetchTeamUsers()
			} else {
				setUser(null)
				navigate('/auth')
			}
		})
		return () => {
			unsubscribe()
		}
	}, [auth, navigate])

	const getUserData = async userId => {
		try {
			const userRef = ref(database, `/users/${userId}`)
			const userSnapshot = await get(userRef)
			if (userSnapshot.exists()) {
				return userSnapshot.val()
			}
			return null
		} catch (error) {
			console.error('Error fetching user data:', error)
			return null
		}
	}

	const fetchTeamUsers = async () => {
		if (!teamName) return

		const usersRef = ref(database, `teams/${teamName}/users`)
		try {
			const snapshot = await get(usersRef)
			if (snapshot.exists()) {
				const usersData = snapshot.val()
				const usersArray = await Promise.all(
					Object.entries(usersData).map(async ([userId, userData]) => {
						const userAuthData = await getUserData(userId)

						if (userData.role === 'admin') {
							return {
								id: userId,
								...userData,
								...userAuthData,
							}
						}

						const accessRef = ref(
							database,
							`teams/${teamName}/users/${userId}/access`
						)
						const accessSnapshot = await get(accessRef)
						const accessData = accessSnapshot.exists()
							? accessSnapshot.val()
							: []

						if (accessData.includes(projectName)) {
							return {
								id: userId,
								...userData,
								...userAuthData,
							}
						}
						return null
					})
				)
				setTeamUsers(usersArray.filter(user => user !== null))
			}
		} catch (error) {
			console.error('Error fetching team users:', error)
		}
	}

	const checkProjectStatus = async userId => {
		if (!teamName) {
			setProjectStatus({ exists: false, member: false })
			return
		}

		try {
			const projectRef = ref(
				database,
				`teams/${teamName}/projects/${projectName}/`
			)
			const projectSnapshot = await get(projectRef)

			if (!projectSnapshot.exists()) {
				setProjectStatus({ exists: false, member: false })
				return
			}

			const userRef = ref(database, `teams/${teamName}/users/${userId}`)
			const userSnapshot = await get(userRef)

			if (!userSnapshot.exists()) {
				setProjectStatus({ exists: true, member: false })
				return
			}

			const userData = userSnapshot.val()

			if (userData.role === 'admin') {
				setProjectStatus({ exists: true, member: true })
				return
			}

			const accessRef = ref(
				database,
				`teams/${teamName}/users/${userId}/access`
			)
			const accessSnapshot = await get(accessRef)

			if (accessSnapshot.exists()) {
				const accessData = accessSnapshot.val()
				if (Array.isArray(accessData) && accessData.includes(projectName)) {
					setProjectStatus({ exists: true, member: true })
					return
				}
			}

			setProjectStatus({ exists: true, member: false })
		} catch (error) {
			console.error('Error checking project status:', error)
			setProjectStatus({ exists: null, member: null })
		}
	}

	const toggleView = view => {
		setCurrentView(view)
	}

	const handleDellProject = async () => {
		const confirmDell = window.confirm(
			'Are you sure you want to delete the project??'
		)
		if (!confirmDell) return

		try {
			await update(ref(database, `teams/${teamName}/projects/`), {
				[projectName]: null,
			})

			navigate(`/team?teamname=${teamName}`)
		} catch (error) {
			console.error('Error when deleting from the project:', error)
		}
	}

	return (
		<div>
			{user ? (
				projectStatus.exists === null ? (
					<span>Loading...</span>
				) : projectStatus.exists === false ? (
					<>
						<Link to={`/team?teamname=${teamName}`} className='text-gray-500'>
							Go bake
						</Link>
						<p>The project does not exist</p>
					</>
				) : projectStatus.member === false ? (
					<>
						<Link to={`/team?teamname=${teamName}`} className='text-gray-500'>
							Go bake
						</Link>
						<p>You are not a member of this project</p>
					</>
				) : (
					<>
						<div className='flex mb-6'>
							<span className='text-2xl my-auto'>
								Welcome to the team {teamName} you are working on a project{' '}
								{projectName}
							</span>
							<Link
								to={`/team?teamname=${teamName}`}
								className='text-xl my-auto btn-project btn-orange'
							>
								Change team
							</Link>
							<button
								className='btn-team text-xl my-auto btn-red'
								onClick={handleDellProject}
							>
								Dell
							</button>
						</div>
						<div className='flex'>
							<div className='w-64 pr-6 border-r'>
								<div className='mb-6'>
									<p
										className={`cursor-pointer p-2 ${
											currentView === 'statistics'
												? 'border-2 border-gray-200 rounded-md'
												: ''
										}`}
										onClick={() => toggleView('statistics')}
									>
										Statistics
									</p>
									<p
										className={`cursor-pointer p-2 ${
											currentView === 'tasks'
												? 'border-2 border-gray-200 rounded-md'
												: ''
										}`}
										onClick={() => toggleView('tasks')}
									>
										Tasks
									</p>
								</div>
								<div>
									<p className='font-semibold mb-2'>Project Members:</p>
									<div className='space-y-2'>
										{teamUsers.map(teamUser => (
											<div key={teamUser.id} className='p-2 rounded '>
												<p className='font-medium'>
													{teamUser.displayName ||
														teamUser.username ||
														teamUser.email ||
														'Unknown User'}
												</p>
											</div>
										))}
									</div>
								</div>
							</div>
							<div className='flex-1 pl-6'>
								{currentView === 'statistics' ? <Statistics /> : <TasksBoard />}
							</div>
						</div>
					</>
				)
			) : (
				<span>Redirection...</span>
			)}
		</div>
	)
}

export default Project
