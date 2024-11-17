import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

function Welcome() {
	const [user, setUser] = useState(null)
	const auth = getAuth()

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, user => {
			if (user) {
				setUser(user)
			} else {
				setUser(null)
			}
		})

		return () => {
			unsubscribe()
		}
	}, [auth])

	return (
		<div className='flex h-max justify-between'>
			<div className='mt-64 align-middle'>
				<h1 className='text-6xl'>Workflow Wizard</h1>
				{user ? (
					<span className='text-xl mt-4'>
						You are logged in as {user.displayName},
						<Link to='/createteam'> enter the project</Link>
					</span>
				) : (
					<span className='text-xl mt-4'>
						To work in the program log in to your account:
						<Link to='/auth'> Login</Link>
					</span>
				)}
			</div>
			<img src={logo} alt='' />
		</div>
	)
}

export default Welcome
