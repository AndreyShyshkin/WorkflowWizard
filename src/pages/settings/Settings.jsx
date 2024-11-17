import {
	getAuth,
	onAuthStateChanged,
	sendPasswordResetEmail,
	updateEmail,
	updateProfile,
} from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import noPhoto from '../../assets/noPhoto.png'

function Settings() {
	const [user, setUser] = useState(null)
	const [newName, setNewName] = useState('')
	const [newEmail, setNewEmail] = useState('')
	const [newAvatar, setNewAvatar] = useState('')
	const navigate = useNavigate()
	const auth = getAuth()

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, user => {
			if (user) {
				setUser(user)
			} else {
				setUser(null)
				navigate('/auth')
			}
		})

		return () => {
			unsubscribe()
		}
	}, [auth])

	const handleUpdateName = async () => {
		if (!newName.trim()) return alert('Name cannot be empty.')
		try {
			await updateProfile(auth.currentUser, { displayName: newName })
			alert('Name updated successfully!')
		} catch (error) {
			alert('Error updating name: ' + error.message)
		}
	}

	const handleUpdateEmail = async () => {
		if (!newEmail.trim()) return alert('Email cannot be empty.')
		try {
			await updateEmail(auth.currentUser, newEmail)
			alert('Email updated successfully!')

			// Отправляем письмо для подтверждения
			await auth.currentUser.sendEmailVerification()
			alert(`Verification email sent to ${newEmail}. Please verify your email.`)
		} catch (error) {
			alert('Error updating email: ' + error.message)
		}
	}

	const handleUpdateAvatar = async () => {
		if (!newAvatar.trim()) return alert('Avatar URL cannot be empty.')
		try {
			await updateProfile(auth.currentUser, { photoURL: newAvatar })
			alert('Avatar updated successfully!')
		} catch (error) {
			alert('Error updating avatar: ' + error.message)
		}
	}

	const handlePasswordReset = async () => {
		if (!user || !user.email) {
			return alert('No email is associated with this account.')
		}
		try {
			await sendPasswordResetEmail(auth, user.email)
			alert(`Password reset email sent to ${user.email}!`)
		} catch (error) {
			alert('Error sending password reset email: ' + error.message)
		}
	}

	return (
		<div>
			<h1>Settings</h1>
			{user ? (
				<div>
					<img
						src={user.photoURL || noPhoto}
						alt='User Avatar'
						onError={e => (e.target.style.display = 'none')}
					/>
					<input
						type='text'
						placeholder='New avatar URL'
						value={newAvatar}
						onChange={e => setNewAvatar(e.target.value)}
					/>
					<button onClick={handleUpdateAvatar}>Change Avatar</button>
				</div>
			) : (
				<p>Loading avatar...</p>
			)}
			{user ? (
				<>
					<p>User name: {user.displayName}</p>
					<input
						type='text'
						placeholder='New name'
						value={newName}
						onChange={e => setNewName(e.target.value)}
					/>
					<button onClick={handleUpdateName}>Change Name</button>

					<p>Email: {user.email}</p>
					<input
						type='email'
						placeholder='New email'
						value={newEmail}
						onChange={e => setNewEmail(e.target.value)}
					/>
					<button onClick={handleUpdateEmail}>Change Email</button>

					<p>Reset your password:</p>
					<button onClick={handlePasswordReset}>
						Send Password Reset Email
					</button>

					<button onClick={() => auth.signOut()}>Logout</button>
				</>
			) : (
				<p>User is not logged in</p>
			)}
		</div>
	)
}

export default Settings
