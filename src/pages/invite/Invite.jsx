import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { child, get, getDatabase, ref, remove, set } from 'firebase/database'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Invite() {
	const [inviteData, setInviteData] = useState(null)
	const [error, setError] = useState(null)
	const [user, setUser] = useState(null)
	const auth = getAuth()
	const navigate = useNavigate()

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, currentUser => {
			setUser(currentUser || null)
		})

		return () => {
			unsubscribe()
		}
	}, [auth])

	useEffect(() => {
		const database = getDatabase()
		const urlParams = new URLSearchParams(window.location.search)
		const teamName = urlParams.get('name')
		const inviteCode = urlParams.get('key')

		if (!teamName || !inviteCode) {
			setError('Invalid query parameters. Please check the invite link.')
			return
		}

		const inviteRef = child(
			ref(database),
			`/teams/${teamName}/invites/${inviteCode}`
		)

		get(inviteRef)
			.then(snapshot => {
				if (snapshot.exists()) {
					setInviteData(snapshot.val())
					setError(null)
				} else {
					setError('Invite not found or has expired.')
				}
			})
			.catch(err => {
				console.error('Error fetching invite data:', err)
				setError('Failed to fetch invite data.')
			})
	}, [])

	const acceptInvite = async (role, access, email) => {
		if (!user) {
			setError('You must be logged in to accept the invite.')
			return
		}
		console.log(email, user.email)
		if (email !== user.email) {
			setError('Your email does not match the one associated with this invite.')
			return
		}

		try {
			const database = getDatabase()
			const urlParams = new URLSearchParams(window.location.search)
			const teamName = urlParams.get('name')
			const inviteCode = urlParams.get('key')

			const userRef = child(
				ref(database),
				`/teams/${teamName}/users/${user.uid}`
			)
			const inviteRef = child(
				ref(database),
				`/teams/${teamName}/invites/${inviteCode}`
			)

			const userSnapshot = await get(userRef)
			if (userSnapshot.exists()) {
				setError('You are already a member of this team.')
				return
			}

			await set(userRef, {
				username: user.displayName,
				role: role,
				access: access,
			})
			await remove(inviteRef)

			alert('Invite accepted successfully!')
			navigate('/team?teamname=' + teamName)
		} catch (err) {
			console.error('Error accepting invite:', err)
			setError('Failed to accept invite.')
		}
	}

	const denyInvite = async () => {
		if (!user) {
			setError('You must be logged in to deny the invite.')
			return
		}

		try {
			const database = getDatabase()
			const urlParams = new URLSearchParams(window.location.search)
			const teamName = urlParams.get('name')
			const inviteCode = urlParams.get('key')

			const inviteRef = child(
				ref(database),
				`/teams/${teamName}/invites/${inviteCode}`
			)

			await remove(inviteRef)
			alert('Invite denied successfully!')
			navigate('/')
		} catch (err) {
			console.error('Error denying invite:', err)
			setError('Failed to deny invite.')
		}
	}

	return (
		<div>
			<h1>Invite</h1>
			{error && (
				<div style={{ color: 'red', marginBottom: '1em' }}>
					<p>{error}</p>
				</div>
			)}
			{inviteData ? (
				<div>
					<p>From: {inviteData.from}</p>
					<p>Role: {inviteData.role}</p>
					{inviteData.role !== 'admin' && <p>Access to: {inviteData.access}</p>}
					<button
						onClick={() =>
							acceptInvite(
								inviteData.role,
								inviteData.role !== 'admin' ? inviteData.access : null,
								inviteData.email
							)
						}
						className='mr-4'
					>
						Agree
					</button>
					<button onClick={denyInvite}>Deny</button>
				</div>
			) : !error ? (
				<h2>Loading invite details...</h2>
			) : null}
			{!user && (
				<p>
					<Link to='/auth'>Login</Link> to accept the invite.
				</p>
			)}
		</div>
	)
}

export default Invite
