import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { get, getDatabase, onValue, ref, set } from 'firebase/database'
import { useEffect, useState } from 'react'

function InviteOnTeam() {
	const [user, setUser] = useState(null)
	const [email, setEmail] = useState('')
	const [role, setRole] = useState('view')
	const [access, setAccess] = useState([])
	const [projects, setProjects] = useState([])
	const [emailError, setEmailError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const auth = getAuth()
	const database = getDatabase()
	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, user => {
			setUser(user || null)
		})
		return () => unsubscribe()
	}, [auth])

	useEffect(() => {
		if (!teamName) return

		const projectsRef = ref(database, `teams/${teamName}/projects`)
		onValue(projectsRef, snapshot => {
			const data = snapshot.val()
			if (data) {
				const formattedProjects = Object.entries(data).map(([projectName]) => ({
					id: projectName,
					name: projectName,
				}))
				setProjects(formattedProjects)
			} else {
				setProjects([])
			}
		})
	}, [database, teamName])

	const validateEmail = email => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!email) {
			setEmailError('Email is required')
			return false
		}
		if (!emailRegex.test(email)) {
			setEmailError('Please enter a valid email')
			return false
		}
		setEmailError('')
		return true
	}

	const checkExistingInvites = async email => {
		const invitesRef = ref(database, `teams/${teamName}/invites`)
		const snapshot = await get(invitesRef)
		const invites = snapshot.val()

		if (invites) {
			for (const invite of Object.values(invites)) {
				if (invite.email.toLowerCase() === email.toLowerCase()) {
					return true
				}
			}
		}
		return false
	}

	function generateRandomString(length) {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
		let result = ''
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * characters.length))
		}
		return result
	}

	const sendWelcomeEmail = async (email, inviteCode) => {
		try {
			const response = await fetch('/.netlify/functions/sendEmail', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					subject: 'Invite to the Team!',
					message: `Link to invite https://hakaton24.netlify.app/invite?name=${teamName}&key=${inviteCode}`,
				}),
			})

			const data = await response.json()
			if (response.ok) {
				console.log('Email sent successfully:', data.message)
			} else {
				console.error('Error sending email:', data.error)
			}
		} catch (error) {
			console.error('Error:', error)
		}
	}

	async function submit() {
		try {
			setIsLoading(true)

			if (!validateEmail(email)) {
				setIsLoading(false)
				return
			}

			const inviteExists = await checkExistingInvites(email)
			if (inviteExists) {
				setEmailError('An invite has already been sent to this email')
				setIsLoading(false)
				return
			}

			const inviteCode = generateRandomString(24)
			const inviteRef = ref(database, `teams/${teamName}/invites/${inviteCode}`)

			const inviteData = {
				inviteCode,
				role,
				from: user?.displayName || 'Unknown',
				email: email.toLowerCase(),
				access: role === 'admin' ? 'all' : access,
				createdAt: new Date().toISOString(),
			}

			await set(inviteRef, inviteData)
			await sendWelcomeEmail(email, inviteCode)

			setEmail('')
			setAccess([])
			setRole('view')
			setEmailError('')

			alert('Invitation sent successfully!')
		} catch (error) {
			console.error('Error creating invite:', error)
			setEmailError('Failed to send invite. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const toggleProject = projectId => {
		setAccess(prevAccess => {
			if (prevAccess.includes(projectId)) {
				return prevAccess.filter(id => id !== projectId)
			} else {
				return [...prevAccess, projectId]
			}
		})
	}

	const handleEmailChange = e => {
		const newEmail = e.target.value
		setEmail(newEmail)
		if (emailError) {
			setEmailError('')
		}
	}

	return (
		<div className='invite-on-team'>
			<h2 className='text-center text-3xl my-10'>Invite on Team</h2>

			<div className='mb-4'>
				<span className='block mb-2'>Enter email</span>
				<input
					className={`w-full p-2 border rounded ${
						emailError ? 'border-red-500' : ''
					} invite-input`}
					placeholder='Email'
					value={email}
					onChange={handleEmailChange}
				/>
				{emailError && (
					<p className='text-red-500 text-sm mt-1'>{emailError}</p>
				)}
			</div>

			<div className='mb-4'>
				<p className='mb-2'>Select role</p>
				<div className='flex gap-4'>
					{['view', 'edit', 'admin'].map(roleOption => (
						<div key={roleOption} className='radio'>
							<label className='flex items-center gap-2'>
								<input
									type='radio'
									value={roleOption}
									checked={role === roleOption}
									onChange={() => setRole(roleOption)}
								/>
								{roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
							</label>
						</div>
					))}
				</div>
			</div>

			{role !== 'admin' && (
				<div className='mb-4'>
					<p className='mb-2'>Select access</p>
					<div className='space-y-2'>
						{projects.map(project => (
							<div key={project.id} className='border rounded p-2'>
								<label className='flex items-center gap-2'>
									<input
										type='checkbox'
										checked={access.includes(project.id)}
										onChange={() => toggleProject(project.id)}
									/>
									{project.name}
								</label>
							</div>
						))}
					</div>
				</div>
			)}

			<button
				onClick={submit}
				className='w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
				disabled={
					!email || (role !== 'admin' && access.length === 0) || isLoading
				}
			>
				{isLoading ? 'Sending...' : 'Invite to join the team'}
			</button>
		</div>
	)
}

export default InviteOnTeam
