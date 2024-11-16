import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { get, getDatabase, onValue, ref, set, update } from 'firebase/database'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Draggable } from 'react-smooth-dnd'

function CreateTask({ date }) {
	const [user, setUser] = useState(null)
	const [taskName, setTaskName] = useState('')
	const [userTasks, setUserTasks] = useState([])
	const auth = getAuth()
	const database = getDatabase()
	const navigate = useNavigate()
	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')
	const projectName = urlParams.get('projectname')

	useEffect(() => {
		onAuthStateChanged(auth, currentUser => {
			if (currentUser) {
				setUser(currentUser)
				fetchUserTasks(currentUser.uid)
			} else {
				navigate('/login')
			}
		})
	}, [auth, navigate])

	const fetchUserTasks = () => {
		const tasksRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${date}`
		)

		onValue(
			tasksRef,
			snapshot => {
				if (snapshot.exists()) {
					// Сортируем задачи по полю order
					const tasks = Object.entries(snapshot.val() || {})
						.map(([key, value]) => ({ id: key, ...value }))
						.sort((a, b) => a.order - b.order)
					setUserTasks(tasks)
				} else {
					setUserTasks([])
				}
			},
			error => {
				console.error('Error fetching user tasks:', error.code, error.message)
			}
		)
	}

	const handleCreateTask = async () => {
		const trimmedName = taskName.trim()

		if (trimmedName === '') {
			console.log('Task name cannot be empty')
			return
		}

		const forbiddenChars = /[^a-zA-Z0-9_]/
		if (forbiddenChars.test(trimmedName)) {
			console.log('Task name contains invalid characters')
			return
		}

		const taskRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${date}/${trimmedName}`
		)
		try {
			const snapshot = await get(taskRef)
			if (snapshot.exists()) {
				console.log('Task name already exists')
				return
			}
			await set(taskRef, {
				status: 'active',
			})
			setTaskName('')
		} catch (error) {
			console.error('Error creating team:', error.code, error.message)
		}
	}

	const handleDrop = ({ removedIndex, addedIndex }) => {
		if (removedIndex !== null && addedIndex !== null) {
			const updatedTasks = [...userTasks]
			const [movedTask] = updatedTasks.splice(removedIndex, 1)
			updatedTasks.splice(addedIndex, 0, movedTask)

			// Обновляем `order` в локальном состоянии
			setUserTasks(updatedTasks)

			// Обновляем `order` в базе данных
			const tasksRef = ref(
				database,
				`teams/${teamName}/projects/${projectName}/tasks/${date}`
			)

			const updates = {}
			updatedTasks.forEach((task, index) => {
				updates[`${task.id}/order`] = index
			})

			update(tasksRef, updates).catch(err =>
				console.error('Error updating task order:', err)
			)
		}
	}

	return (
		<div>
			{userTasks.length > 0 ? (
				<div>
					<h3>Team Project Task</h3>
					<Container onDrop={handleDrop}>
						{userTasks.map(task => (
							<Draggable key={task.id}>
								<div>
									<h5>{task.id}</h5>
								</div>
							</Draggable>
						))}
					</Container>
				</div>
			) : (
				<h3>In project not have tasks</h3>
			)}
			<input
				type='text'
				placeholder='Enter tasks name'
				value={taskName}
				onChange={e => setTaskName(e.target.value)}
			/>
			<button type='submit' onClick={handleCreateTask}>
				Create Task
			</button>
		</div>
	)
}

CreateTask.propTypes = {
	date: PropTypes.string.isRequired,
}

export default CreateTask
