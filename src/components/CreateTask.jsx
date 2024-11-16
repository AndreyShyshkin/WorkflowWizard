import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
	getDatabase,
	onValue,
	ref,
	remove,
	set,
	update,
} from 'firebase/database'
import { GripVertical, Trash2 } from 'lucide-react'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Draggable } from 'react-smooth-dnd'

function CreateTask({ date }) {
	const [user, setUser] = useState(null)
	const [taskName, setTaskName] = useState('')
	const [userTasks, setUserTasks] = useState([])
	const [showPriority, setShowPriority] = useState(false)
	const [selectedPriority, setSelectedPriority] = useState('low')
	const auth = getAuth()
	const database = getDatabase()
	const navigate = useNavigate()
	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')
	const projectName = urlParams.get('projectname')

	const priorities = [
		{
			value: 'low',
			label: 'Low',
			color: 'bg-green-100 text-green-800',
		},
		{
			value: 'medium',
			label: 'Medium',
			color: 'bg-yellow-100 text-yellow-800',
		},
		{ value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
	]

	useEffect(() => {
		onAuthStateChanged(auth, currentUser => {
			if (currentUser) {
				setUser(currentUser)
				fetchUserTasks()
			} else {
				navigate('/login')
			}
		})
	}, [auth, navigate])

	useEffect(() => {
		if (taskName.trim() !== '') {
			setShowPriority(true)
		} else {
			setShowPriority(false)
			setSelectedPriority('low')
		}
	}, [taskName])

	const formatDate = dateString => {
		const date = new Date(dateString)
		const formattedDate = date
			.toLocaleString('en-GB', {
				hour: '2-digit',
				minute: '2-digit',
				day: '2-digit',
				month: 'short',
				year: '2-digit',
			})
			.replace(',', '')

		const parts = formattedDate.split(' ')
		return [parts[3], parts[0], parts[1], parts[2]].join(' ')
	}

	const fetchUserTasks = () => {
		const tasksRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${date}`
		)
		onValue(tasksRef, snapshot => {
			if (snapshot.exists()) {
				const tasks = Object.entries(snapshot.val() || {})
					.map(([key, value]) => ({
						id: key,
						...value,
					}))
					.sort((a, b) => (a.order || 0) - (b.order || 0))
				setUserTasks(tasks)
			} else {
				setUserTasks([])
			}
		})
	}

	const handleDeleteTask = async taskId => {
		try {
			const taskRef = ref(
				database,
				`teams/${teamName}/projects/${projectName}/tasks/${date}/${taskId}`
			)

			await remove(taskRef)

			const remainingTasks = userTasks.filter(task => task.id !== taskId)
			const updates = {}

			remainingTasks.forEach((task, index) => {
				updates[
					`teams/${teamName}/projects/${projectName}/tasks/${date}/${task.id}/order`
				] = index
			})

			if (Object.keys(updates).length > 0) {
				await update(ref(database), updates)
			}

			fetchUserTasks()
		} catch (error) {
			console.error('Error deleting task:', error)
		}
	}

	const handleCreateTask = async () => {
		if (taskName.trim() === '') return

		const newTaskOrder = userTasks.length
		const taskRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${date}/${taskName}`
		)

		const currentTimestamp = new Date().toISOString()

		try {
			await set(taskRef, {
				order: newTaskOrder,
				priority: selectedPriority,
				createdAt: currentTimestamp,
				createdBy: user.displayName || user.email || user.uid,
			})
			setTaskName('')
			setShowPriority(false)
			setSelectedPriority('low')
		} catch (error) {
			console.error('Error creating task:', error)
		}
	}

	const handleDrop = async ({ removedIndex, addedIndex, payload }) => {
		if (addedIndex === null) return

		const sourceCategory = payload.sourceCategory
		const targetCategory = date

		try {
			if (sourceCategory === targetCategory) {
				const updatedTasks = [...userTasks]
				const [movedTask] = updatedTasks.splice(removedIndex, 1)
				updatedTasks.splice(addedIndex, 0, movedTask)

				const batch = {}
				updatedTasks.forEach((task, index) => {
					batch[
						`teams/${teamName}/projects/${projectName}/tasks/${targetCategory}/${task.id}`
					] = {
						...task,
						order: index,
					}
				})

				await update(ref(database), batch)
			} else {
				const batch = {}

				batch[
					`teams/${teamName}/projects/${projectName}/tasks/${sourceCategory}/${payload.id}`
				] = null

				const targetTasks = [...userTasks]
				targetTasks.splice(addedIndex, 0, {
					id: payload.id,
					priority: payload.priority,
					createdAt: payload.createdAt,
					createdBy: payload.createdBy,
					order: addedIndex,
				})

				targetTasks.forEach((task, index) => {
					batch[
						`teams/${teamName}/projects/${projectName}/tasks/${targetCategory}/${task.id}`
					] = {
						priority: task.priority,
						createdAt: task.createdAt,
						createdBy: task.createdBy,
						order: index,
					}
				})

				await update(ref(database), batch)
			}

			fetchUserTasks()
		} catch (error) {
			console.error('Error handling drop:', error)
			fetchUserTasks()
		}
	}

	const getPriorityColor = priority => {
		switch (priority) {
			case 'high':
				return 'border-l-4 border-red-500'
			case 'medium':
				return 'border-l-4 border-yellow-500'
			case 'low':
				return 'border-l-4 border-green-500'
			default:
				return ''
		}
	}

	return (
		<div className='p-4 border rounded-lg'>
			<h3 className='mb-4'>{date}</h3>
			<Container
				groupName='tasks'
				onDrop={handleDrop}
				getChildPayload={index => ({
					...userTasks[index],
					sourceCategory: date,
				})}
				dragClass='task-ghost'
				dropClass='task-ghost-drop'
			>
				{userTasks.map(task => (
					<Draggable key={task.id}>
						<div
							className={`p-2 mb-2 border rounded shadow-sm ${getPriorityColor(
								task.priority
							)} relative group cursor-grab active:cursor-grabbing transition-colors`}
						>
							<div className='flex justify-between items-start'>
								{/* GripVertical в правом верхнем углу */}
								<div className='absolute right-2 top-2 opacity-0 group-hover:opacity-50'>
									<GripVertical className='h-5 w-5' />
								</div>
								{/* Информация о задаче */}
								<div className='flex-1 pr-10'>
									<h5 className='m-0 font-medium'>{task.id}</h5>
									<div className='text-xs text-gray-500'>
										{formatDate(task.createdAt)}
									</div>
									<div className='text-xs text-gray-500'>
										Created by: {task.createdBy}
									</div>
								</div>
							</div>
							{/* Кнопка удаления внизу */}
							<div className='absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
								<button
									onClick={e => {
										e.preventDefault()
										handleDeleteTask(task.id)
									}}
									className='p-1 hover:bg-red-50 rounded'
									title='Delete task'
								>
									<Trash2 className='h-4 w-4 text-red-500' />
								</button>
							</div>
						</div>
					</Draggable>
				))}
			</Container>
			<div className='mt-4 space-y-2'>
				<input
					type='text'
					className='p-2 border rounded w-full'
					placeholder='Enter task name'
					value={taskName}
					onChange={e => setTaskName(e.target.value)}
				/>

				{showPriority && (
					<div className='flex gap-2'>
						{priorities.map(priority => (
							<button
								key={priority.value}
								onClick={() => setSelectedPriority(priority.value)}
								className={`px-3 py-1 rounded-full text-sm ${priority.color} ${
									selectedPriority === priority.value
										? 'ring-2 ring-offset-2 ring-blue-500'
										: ''
								}`}
							>
								{priority.label}
							</button>
						))}
					</div>
				)}

				<button
					onClick={handleCreateTask}
					className='px-4 py-2 bg-blue-500 text-white rounded w-full'
					disabled={!taskName.trim()}
				>
					Create Task
				</button>
			</div>
		</div>
	)
}

CreateTask.propTypes = {
	date: PropTypes.string.isRequired,
}

export default CreateTask
