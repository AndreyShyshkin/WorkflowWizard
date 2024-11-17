import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { get, getDatabase, ref, update } from 'firebase/database'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CreateProject from '../../components/CreateProject'
import InviteOnTeam from '../../components/InviteOnTeam'

function Team() {
	const [user, setUser] = useState(null)
	const [teamStatus, setTeamStatus] = useState({ exists: null, member: null })
	const [teamUsers, setTeamUsers] = useState([]) // Список пользователей команды
	const [userProjects, setUserProjects] = useState([])
	const [userRole, setUserRole] = useState(null) // Роль пользователя
	const auth = getAuth()
	const database = getDatabase()
	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')
	const navigate = useNavigate()

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, currentUser => {
			if (currentUser) {
				setUser(currentUser)
				checkTeamStatus(currentUser.uid)
				updateWorkStatus(currentUser.uid)
				fetchUserProjects()
			} else {
				setUser(null)
				navigate('/auth')
			}
		})

		return () => {
			unsubscribe()
		}
	}, [auth, navigate])

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

	const updateWorkStatus = async userId => {
		try {
			await update(ref(database, `teams/${teamName}/users/${userId}`), {
				work: true,
			})

			const teamsRef = ref(database, 'teams')
			const snapshot = await get(teamsRef)

			if (snapshot.exists()) {
				const teams = snapshot.val()
				const updates = {}

				Object.keys(teams).forEach(team => {
					if (
						teams[team].users &&
						teams[team].users[userId] &&
						teamName !== team
					) {
						updates[`teams/${team}/users/${userId}/work`] = false
					}
				})

				await update(ref(database), updates)
			}
		} catch (error) {
			console.error('Error updating work status:', error)
		}
	}

	const checkTeamStatus = async userId => {
		if (!teamName) {
			setTeamStatus({ exists: false, member: false })
			return
		}

		const teamRef = ref(database, `teams/${teamName}`)
		try {
			const snapshot = await get(teamRef)
			if (snapshot.exists()) {
				const teamData = snapshot.val()
				const isMember = teamData.users && teamData.users[userId]
				setTeamStatus({ exists: true, member: Boolean(isMember) })

				if (isMember) {
					setUserRole(teamData.users[userId]?.role || 'view') // Получение роли пользователя
					loadTeamUsers() // Загружаем список пользователей
				}
			} else {
				setTeamStatus({ exists: false, member: false })
			}
		} catch (error) {
			console.error('Error checking team status:', error)
			setTeamStatus({ exists: null, member: null })
		}
	}

	const loadTeamUsers = async () => {
		try {
			const teamRef = ref(database, `teams/${teamName}/users`)
			const snapshot = await get(teamRef)

			if (snapshot.exists()) {
				const usersData = snapshot.val()
				const usersArray = Object.entries(usersData).map(([uid, data]) => ({
					uid,
					...data,
				}))
				setTeamUsers(usersArray) // Обновляем состояние
			}
		} catch (error) {
			console.error('Error loading team users:', error)
		}
	}

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
				fetchUserProjects()
				navigate('/createTeam')
			}
		} catch (error) {
			console.error('Error changing team:', error)
		}
	}

	const handleLogoutTeam = async () => {
		const confirmLogout = window.confirm(
			'Вы уверены, что хотите выйти из команды?'
		)
		if (!confirmLogout) return // Если пользователь нажал "Отмена", выходим из функции

		try {
			const teamUsersRef = ref(database, `teams/${teamName}/users`)

			const snapshot = await get(teamUsersRef)
			if (snapshot.exists()) {
				const users = snapshot.val()

				delete users[user.uid]

				const remainingUsers = Object.keys(users)

				if (remainingUsers.length === 0) {
					await update(ref(database, `teams`), {
						[teamName]: null,
					})
				} else {
					await update(teamUsersRef, {
						[user.uid]: null,
					})
				}

				navigate('/createTeam')
			} else {
				console.error('Ошибка: команда не найдена.')
			}
		} catch (error) {
			console.error('Ошибка при выходе из команды:', error)
		}
	}
	return (
		<div>
			{user ? (
				teamStatus.exists === null ? (
					<span>Loading...</span>
				) : teamStatus.exists === false ? (
					<span>Команда не существует</span>
				) : teamStatus.member === false ? (
					<span>Вы не состоите в этой команде</span>
				) : (
					<div>
						<div className='flex mb-6'>
							<span className='text-2xl my-auto'>
								Welcome to the team {teamName}
							</span>
							<button
								className='btn-team text-xl my-auto btn-orange'
								onClick={handleChangeTeam}
							>
								Change team
							</button>
							<button
								className='btn-team text-xl my-auto btn-red'
								onClick={handleLogoutTeam}
							>
								Exit
							</button>
						</div>
						{userProjects.length > 0 ? (
							<div>
								<h3 className='text-2xl mt-8 mb-4'>Team Projects</h3>
								<div className='mt-4 grid gap-4 lg:grid-cols-3 cursor-pointer'>
									{userProjects.map(project => (
										<Link
											key={project}
											to={`/team/project?teamname=${teamName}&projectname=${project}`}
										>
											<div className='relative max-lg:row-start-1'>
												<div className='absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]'></div>
												<div className='relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]'>
													<div className='px-8 pt-4 sm:px-10 sm:pt-5'>
														<p className='text-lg/7 font-medium tracking-tight text-gray-950 max-lg:text-center'>
															Project name: {project}
														</p>
														<p className='mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center'>
															Go to project
														</p>
													</div>
													<div className='flex flex-1 items-center justify-center px-8 py-6 max-lg:pt-10 sm:px-10'></div>
												</div>
												<div className='pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-t-[2rem]'></div>
											</div>
										</Link>
									))}
									<div>
										<div className='relative max-lg:row-start-1'>
											<div className='absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]'></div>
											<div className='relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]'>
												<div className='px-8 pt-4 sm:px-10 sm:pt-5'>
													<p className='text-lg/7 font-medium tracking-tight text-gray-950 max-lg:text-center'>
														{['admin', 'edit'].includes(userRole) && (
															<CreateProject />
														)}
													</p>
												</div>
												<div className='flex flex-1 items-center justify-center px-8 py-5 max-lg:pt-10 sm:px-10'></div>
											</div>
											<div className='pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-t-[2rem]'></div>
										</div>
									</div>
								</div>
							</div>
						) : (
							<>
								<h3 className='text-center text-3xl my-10'>
									The team does not have any projects yet.
								</h3>
								<div className='mt-4 grid gap-4 lg:grid-cols-3 cursor-pointer'>
									<div>
										<div className='relative max-lg:row-start-1'>
											<div className='absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]'></div>
											<div className='relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]'>
												<div className='px-8 pt-4 sm:px-10 sm:pt-5'>
													<p className='text-lg/7 font-medium tracking-tight text-gray-950 max-lg:text-center'>
														{['admin', 'edit'].includes(userRole) && (
															<CreateProject />
														)}
													</p>
												</div>
												<div className='flex flex-1 items-center justify-center px-8 py-5 max-lg:pt-10 sm:px-10'></div>
											</div>
											<div className='pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-t-[2rem]'></div>
										</div>
									</div>
								</div>
							</>
						)}
						<hr className='my-8' />
						{userRole === 'admin' && <InviteOnTeam />}
						<hr className='my-8' />
						<h3 className='text-center text-3xl my-10'>Team composition:</h3>
						<ul>
							{teamUsers.map(teamUser => (
								<li key={teamUser.uid} className='text-center text-xl my-2'>
									{teamUser.username}
									{teamUser.uid === user.uid && <span>(YOU)</span>}
								</li>
							))}
						</ul>
					</div>
				)
			) : (
				<span>Redirection...</span>
			)}
		</div>
	)
}

export default Team
