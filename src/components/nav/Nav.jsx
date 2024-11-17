import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Nav() {
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
		<div className='nav'>
			<Link to='/' className='nav-title'>
				Workflow Wizard
			</Link>
			{user ? <span>{user.displayName}</span> : <Link to='/auth'>login</Link>}
		</div>
	)
}

export default Nav
