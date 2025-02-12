import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { get, getDatabase, ref, set } from 'firebase/database'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function CreateProject() {
	const [user, setUser] = useState(null)
	const [projectName, setProjectName] = useState('')
	const navigate = useNavigate()
	const auth = getAuth()
	const database = getDatabase()
	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, currentUser => {
			if (currentUser) {
				setUser(currentUser)
			} else {
				navigate('/auth')
			}
		})

		return () => unsubscribe()
	}, [auth, navigate])

	const handleCreateProject = async () => {
		const trimmedName = projectName.trim()

		if (trimmedName === '') {
			console.log('Project name cannot be empty')
			return
		}

		const forbiddenChars = /[^a-zA-Z0-9_]/
		if (forbiddenChars.test(trimmedName)) {
			console.log('Project name contains invalid characters')
			return
		}

		const projectRef = ref(
			database,
			`teams/${teamName}/projects/${trimmedName}`
		)
		try {
			const snapshot = await get(projectRef)
			if (snapshot.exists()) {
				console.log('Project name already exists')
				return
			}
			await set(
				ref(
					database,
					`teams/${teamName}/projects/${trimmedName}/users/${user.uid}`
				),
				{
					userName: user.displayName,
				}
			)

			navigate(`/team/project?teamname=${teamName}&projectname=${trimmedName}`)
		} catch (error) {
			console.error('Error creating project:', error.code, error.message)
		}
	}

	return (
		<div>
			<input
				type='text'
				placeholder='Enter project name'
				value={projectName}
				className='create-project-input'
				onChange={e => setProjectName(e.target.value)}
			/>
			<button type='submit' onClick={handleCreateProject} className='mt-4'>
				Create Project
			</button>
		</div>
	)
}

export default CreateProject
