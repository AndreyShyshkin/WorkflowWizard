import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { get, getDatabase, ref, set } from 'firebase/database'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function CreateTeam() {
	const [user, setUser] = useState(null)
	const [teamName, setTeamName] = useState('')
	const [userTeams, setUserTeams] = useState([])
	const navigate = useNavigate()
	const auth = getAuth()
	const database = getDatabase()

	useEffect(() => {
		onAuthStateChanged(auth, currentUser => {
			if (currentUser) {
				setUser(currentUser)
				fetchUserTeams(currentUser.uid)
			} else {
				navigate('/auth')
			}
		})
	}, [auth, navigate])

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
							redirected = true
						}
					}
				})

				setUserTeams(userTeamsList)
			}
		} catch (error) {
			console.error('Error fetching teams:', error)
		}
	}

	const handleCreateTeam = async () => {
		const trimmedName = teamName.trim()

		if (trimmedName === '') {
			console.log('Team name cannot be empty')
			return
		}

		const forbiddenChars = /[^a-zA-Z0-9_]/
		if (forbiddenChars.test(trimmedName)) {
			console.log('Team name contains invalid characters')
			return
		}

		const teamRef = ref(database, 'teams/' + trimmedName)
		try {
			const snapshot = await get(teamRef)
			if (snapshot.exists()) {
				console.log('Team name already exists')
				return
			}
			await set(ref(database, 'teams/' + trimmedName + '/users/' + user.uid), {
				username: user.displayName,
				role: 'admin',
			})
			navigate('/team?teamname=' + trimmedName)
		} catch (error) {
			console.error('Error creating team:', error.code, error.message)
		}
	}

	return (
		<div>
			{userTeams.length > 0 ? (
				<div>
					<h3 className='text-center text-3xl'>Your Teams</h3>
					<ul role='list' className='divide-y divide-gray-100'>
						{userTeams.map(team => (
							<>
								<li key={team} className='flex justify-between gap-x-6 py-5'>
									<div className='flex min-w-0 gap-x-4'>
										<div className='min-w-0 flex-auto'>
											<p className='text-xl font-semibold text-white'>{team}</p>
										</div>
									</div>
									<div className='hidden shrink-0 sm:flex sm:flex-col sm:items-end'>
										<Link
											to={`/team?teamname=${team}`}
											className='text-gray-400'
										>
											Go to team
										</Link>
									</div>
								</li>
								<hr className='color-white w-full' />
							</>
						))}
					</ul>
				</div>
			) : (
				<h3 className='text-center text-3xl'>You have no teams</h3>
			)}
			<div className='flex'>
				<div className='mx-auto mt-6'>
					<input
						type='text'
						placeholder='Enter team name'
						value={teamName}
						className='create-team-input'
						onChange={e => setTeamName(e.target.value)}
					/>
					<button
						type='submit'
						className='create-team-button'
						onClick={handleCreateTeam}
					>
						Create Team
					</button>
				</div>
			</div>
		</div>
	)
}

export default CreateTeam
