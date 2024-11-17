import {
	GoogleAuthProvider,
	createUserWithEmailAndPassword,
	getAuth,
	onAuthStateChanged,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	updateProfile,
} from 'firebase/auth'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const auth = getAuth()
const provider = new GoogleAuthProvider()

function Auth() {
	const [isRegistrationSelected, setIsRegistrationSelected] = useState(true)
	const [resetEmail, setResetEmail] = useState('') // Для хранения email для сброса
	const [user, setUser] = useState(null)
	const navigate = useNavigate()

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, user => {
			if (user) {
				setUser(user)
				navigate('/createteam')
			} else {
				setUser(null)
			}
		})

		return () => {
			unsubscribe()
		}
	}, [auth, navigate])

	const handleRadioChange = e => {
		setIsRegistrationSelected(e.target.value === 'registration')
	}

	const usernameData = useRef()
	const loginData = useRef()
	const passwordData = useRef()
	const passwordCheck = useRef()

	const registerUser = () => {
		if (passwordData.current.value !== passwordCheck.current.value) {
			return
		}
		let username = usernameData.current.value
		let email = loginData.current.value
		let password = passwordData.current.value
		createUserWithEmailAndPassword(auth, email, password)
			.then(function () {
				return (
					updateProfile(auth.currentUser, {
						displayName: username,
					}) && navigate('/createteam')
				)
			})
			.catch(error => {
				console.error('Error during registration:', error.message)
			})
	}

	const loginUser = () => {
		let email = loginData.current.value
		let password = passwordData.current.value
		signInWithEmailAndPassword(auth, email, password)
			.then(function () {
				navigate('/createteam')
			})
			.catch(error => {
				console.error('Error during login:', error.message)
			})
	}

	const forgetPassword = () => {
		if (!resetEmail) {
			alert('Please enter your email to reset your password.')
			return
		}
		sendPasswordResetEmail(auth, resetEmail)
			.then(() => {
				alert('Password reset email sent. Please check your inbox.')
			})
			.catch(error => {
				console.error('Error during password reset:', error.message)
			})
	}

	return (
		<div id='login'>
			<h1 className='text-4xl mb-8'>Sign In</h1>
			<div>
				<div style={{ display: isRegistrationSelected ? 'flex' : 'none' }}>
					<span className='mr-4'>Username</span>
					<input
						type='text'
						ref={usernameData}
						placeholder='Enter your username'
						className='input-auth'
					/>
				</div>
				<div>
					<span className='mr-4'>Email</span>

					<input
						type='email'
						placeholder='Enter your email'
						ref={loginData}
						className='input-auth'
					/>
				</div>
				<div>
					<span className='mr-4'>Password</span>
					<input
						type='password'
						placeholder='Enter your password'
						ref={passwordData}
						className='input-auth'
					/>
				</div>
				<div style={{ display: isRegistrationSelected ? 'flex' : 'none' }}>
					<span className='mr-4'>Confirm Password</span>
					<input
						type='password'
						ref={passwordCheck}
						className='input-auth'
						placeholder='Confirm your password'
					/>
				</div>

				<button
					onClick={registerUser}
					style={{ display: isRegistrationSelected ? 'flex' : 'none' }}
					className='button-auth mt-2'
				>
					Register
				</button>
				<button
					onClick={loginUser}
					className='button-auth mt-2'
					style={{ display: isRegistrationSelected ? 'none' : 'flex' }}
				>
					Login
				</button>
				<div className='flex my-4'>
					<div className='mr-4'>
						<input
							type='radio'
							name='sing'
							value='registration'
							checked={isRegistrationSelected}
							onChange={handleRadioChange}
							className='input-auth'
						/>
						<label htmlFor='registration'>Registration</label>
					</div>
					<div>
						<input
							type='radio'
							name='sing'
							value='login'
							checked={!isRegistrationSelected}
							onChange={handleRadioChange}
							className='input-auth'
						/>
						<label htmlFor='login'>Login</label>
					</div>
				</div>
			</div>
			<button
				onClick={() => signInWithPopup(auth, provider)}
				className='button-auth'
			>
				Sign in with Google
			</button>
			<div className='mt-4'>
				<h2>Forgot Password?</h2>
				<input
					type='email'
					placeholder='Enter your email'
					value={resetEmail}
					className='input-auth'
					onChange={e => setResetEmail(e.target.value)}
				/>
				<button onClick={forgetPassword}>Reset Password</button>
			</div>
		</div>
	)
}

export default Auth
