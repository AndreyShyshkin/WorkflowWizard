import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
	getDatabase,
	onValue,
	push,
	ref,
	remove,
	set,
	update,
} from 'firebase/database'
import {
	GripVertical,
	ListTodo,
	Plus,
	Table as TableIcon,
	Trash2,
	X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container, Draggable } from 'react-smooth-dnd'
import Timer from '../../components/Timer'

function Task() {
	const database = getDatabase()
	const auth = getAuth()
	const navigate = useNavigate()
	const [user, setUser] = useState(null)
	const [sections, setSections] = useState([])
	const [newTaskText, setNewTaskText] = useState('')
	const [showInput, setShowInput] = useState(null)
	const [tableSize, setTableSize] = useState({ rows: 3, cols: 3 })
	const [isDragging, setIsDragging] = useState(false)
	const [isDraggingTodo, setIsDraggingTodo] = useState(false)

	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')
	const projectName = urlParams.get('projectname')
	const taskName = urlParams.get('taskname')
	const deadline = urlParams.get('deadline')
	const priority = urlParams.get('priority')

	const fetchSections = () => {
		const sectionsRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections`
		)
		onValue(sectionsRef, snapshot => {
			if (!isDragging && !isDraggingTodo) {
				if (snapshot.exists()) {
					const sectionsData = snapshot.val()
					const sectionsArray = Object.entries(sectionsData)
						.map(([id, section]) => ({
							id,
							...section,
						}))
						.sort((a, b) => (a.order || 0) - (b.order || 0))
					setSections(sectionsArray)
				} else {
					setSections([])
				}
			}
		})
	}

	const handleTextChange = (sectionId, newText) => {
		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)
		update(sectionRef, { content: newText })
	}

	const handleTableCellChange = (sectionId, rowIndex, colIndex, value) => {
		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)

		const section = sections.find(s => s.id === sectionId)
		const newTableData = [...section.tableData]
		newTableData[rowIndex][colIndex] = value

		update(sectionRef, { tableData: newTableData })
	}

	const onDrop = ({ removedIndex, addedIndex }) => {
		if (removedIndex === addedIndex || removedIndex < 0 || addedIndex < 0) {
			return
		}

		const newSections = [...sections]
		const [removed] = newSections.splice(removedIndex, 1)
		newSections.splice(addedIndex, 0, removed)

		const updatedSections = newSections.map((section, index) => ({
			...section,
			order: index,
		}))

		setSections(updatedSections)

		const sectionsRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections`
		)

		set(
			sectionsRef,
			updatedSections.reduce((acc, section) => {
				acc[section.id] = {
					type: section.type,
					content: section.content,
					todos: section.todos || {},
					tableData: section.tableData || [],
					order: section.order,
				}
				return acc
			}, {})
		).catch(error => {
			console.error('Error updating Firebase:', error)
			setSections(sections)
		})
	}

	const handleDeleteSection = sectionId => {
		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)
		remove(sectionRef)
	}

	const handleAddTodo = sectionId => {
		if (!newTaskText.trim()) {
			setShowInput(null)
			return
		}

		const section = sections.find(s => s.id === sectionId)
		const todos = section.todos || {}

		const maxOrder = Object.values(todos).reduce(
			(max, todo) => Math.max(max, todo.order || 0),
			0
		)

		const updatedTodos = {
			...todos,
			[Date.now()]: {
				text: newTaskText,
				completed: false,
				order: maxOrder + 1,
			},
		}

		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)

		update(sectionRef, { todos: updatedTodos })
		setNewTaskText('')
		setShowInput(null)
	}

	const handleAddSection = (type = 'text') => {
		const sectionsRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections`
		)

		const maxOrder = sections.reduce(
			(max, section) => Math.max(max, section.order || 0),
			-1
		)

		let newSection = {
			type,
			content: '',
			order: maxOrder + 1,
		}

		if (type === 'table') {
			newSection.tableData = Array(tableSize.rows)
				.fill(null)
				.map(() => Array(tableSize.cols).fill(''))
		}

		if (type === 'todo') {
			newSection.todos = {}
		}

		push(sectionsRef, newSection)
	}

	const handleTodoToggle = (sectionId, todoId, currentCompleted) => {
		const section = sections.find(s => s.id === sectionId)
		const updatedTodos = { ...section.todos }
		updatedTodos[todoId] = {
			...updatedTodos[todoId],
			completed: !currentCompleted,
		}

		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)
		update(sectionRef, { todos: updatedTodos })
	}

	const handleDeleteTodo = (sectionId, todoId) => {
		const section = sections.find(s => s.id === sectionId)
		const updatedTodos = { ...section.todos }
		delete updatedTodos[todoId]

		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)
		update(sectionRef, { todos: updatedTodos })
	}

	useEffect(() => {
		onAuthStateChanged(auth, currentUser => {
			if (currentUser) {
				setUser(currentUser)
				fetchSections()
			} else {
				navigate('/login')
			}
		})
	}, [auth, navigate])

	const TableSection = ({ section }) => {
		const [editingCell, setEditingCell] = useState(null)

		const handleFocus = (rowIndex, colIndex) => {
			setEditingCell({ rowIndex, colIndex })
		}

		const handleBlur = () => {
			setEditingCell(null)
		}

		return (
			<div className='relative overflow-x-auto'>
				<div className='flex mb-2'>
					{section.tableData[0].map((_, colIndex) => (
						<button
							key={colIndex}
							onClick={() => deleteColumn(section.id, colIndex)}
							className='text-red-500 hover:text-red-700 p-1 mx-1'
							title='Delete column'
						>
							<X className='h-4 w-4' />
						</button>
					))}
					<button
						onClick={() => addColumn(section.id)}
						className='text-blue-500 hover:text-blue-700 p-1 mx-1'
						title='Add column'
					>
						<Plus className='h-4 w-4' />
					</button>
				</div>

				<div className='flex'>
					<div className='flex flex-col mr-2'>
						{section.tableData.map((_, rowIndex) => (
							<button
								key={rowIndex}
								onClick={() => deleteRow(section.id, rowIndex)}
								className='text-red-500 hover:text-red-700 p-1 my-1'
								title='Delete row'
							>
								<X className='h-4 w-4' />
							</button>
						))}
						<button
							onClick={() => addRow(section.id)}
							className='text-blue-500 hover:text-blue-700 p-1 my-1'
							title='Add row'
						>
							<Plus className='h-4 w-4' />
						</button>
					</div>

					<table className='border-collapse border border-gray-300'>
						<tbody>
							{section.tableData.map((row, rowIndex) => (
								<tr key={rowIndex}>
									{row.map((cell, colIndex) => (
										<td
											key={colIndex}
											className='border border-gray-300 p-2 min-w-[100px]'
										>
											<input
												type='text'
												value={
													editingCell?.rowIndex === rowIndex &&
													editingCell?.colIndex === colIndex
														? editingCell.value || cell
														: cell
												}
												onFocus={() => handleFocus(rowIndex, colIndex)}
												onBlur={() => {
													handleTableCellChange(
														section.id,
														rowIndex,
														colIndex,
														editingCell?.value || cell
													)
													handleBlur()
												}}
												onChange={e =>
													setEditingCell(prev => ({
														...prev,
														value: e.target.value,
													}))
												}
												className='w-full outline-none input-table'
											/>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		)
	}

	const addRow = sectionId => {
		const section = sections.find(s => s.id === sectionId)
		const newTableData = [
			...section.tableData,
			Array(section.tableData[0].length).fill(''),
		]

		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)

		update(sectionRef, { tableData: newTableData })
	}

	const deleteRow = (sectionId, rowIndex) => {
		const section = sections.find(s => s.id === sectionId)
		const newTableData = section.tableData.filter(
			(_, index) => index !== rowIndex
		)

		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)

		update(sectionRef, { tableData: newTableData })
	}

	const addColumn = sectionId => {
		const section = sections.find(s => s.id === sectionId)
		const newTableData = section.tableData.map(row => [...row, ''])

		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)

		update(sectionRef, { tableData: newTableData })
	}

	const deleteColumn = (sectionId, colIndex) => {
		const section = sections.find(s => s.id === sectionId)
		const newTableData = section.tableData.map(row =>
			row.filter((_, index) => index !== colIndex)
		)

		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)

		update(sectionRef, { tableData: newTableData })
	}

	const TodoSection = ({ section }) => {
		const handleTodoDrop = ({ removedIndex, addedIndex }) => {
			setIsDraggingTodo(true)

			const todosArray = Object.entries(section.todos || {}).sort(
				(a, b) => (a[1].order || 0) - (b[1].order || 0)
			)

			if (removedIndex === addedIndex || removedIndex < 0 || addedIndex < 0) {
				setIsDraggingTodo(false)
				return
			}

			const [movedTodo] = todosArray.splice(removedIndex, 1)
			todosArray.splice(addedIndex, 0, movedTodo)

			const updatedTodos = {}
			todosArray.forEach(([id, todo], index) => {
				updatedTodos[id] = {
					...todo,
					order: index,
				}
			})

			const sectionRef = ref(
				database,
				`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${section.id}`
			)

			update(sectionRef, { todos: updatedTodos })
				.then(() => {
					setIsDraggingTodo(false)
				})
				.catch(error => {
					console.error('Error updating Firebase:', error)
					setIsDraggingTodo(false)
				})
		}

		const sortedTodos = Object.entries(section.todos || {}).sort(
			(a, b) => (a[1].order || 0) - (b[1].order || 0)
		)

		return (
			<div>
				<Container onDrop={handleTodoDrop}>
					{sortedTodos.map(([todoId, todo]) => (
						<Draggable key={todoId}>
							<div className='flex items-center gap-2 mb-2'>
								<input
									type='checkbox'
									checked={todo.completed}
									onChange={() =>
										handleTodoToggle(section.id, todoId, todo.completed)
									}
									className='form-checkbox'
								/>
								<span className={todo.completed ? 'line-through' : ''}>
									{todo.text}
								</span>
								<button
									onClick={() => handleDeleteTodo(section.id, todoId)}
									className='p-1 hover:bg-red-50 rounded'
								>
									<Trash2 className='h-4 w-4 text-red-500' />
								</button>
								<div className='cursor-move'>
									<GripVertical className='h-5 w-5 text-gray-400' />
								</div>
							</div>
						</Draggable>
					))}
				</Container>

				{showInput === section.id ? (
					<div className='flex gap-2 mt-2'>
						<input
							type='text'
							value={newTaskText}
							onChange={e => setNewTaskText(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									handleAddTodo(section.id)
								}
							}}
							className='border rounded px-2 py-1'
							placeholder='New todo item'
							autoFocus
						/>
						<button
							onClick={() => handleAddTodo(section.id)}
							className='bg-blue-500 text-white px-3 py-1 rounded'
						>
							Add
						</button>
					</div>
				) : (
					<button
						onClick={() => setShowInput(section.id)}
						className='text-blue-500 hover:text-blue-700'
					>
						+ Add Todo
					</button>
				)}
			</div>
		)
	}

	return (
		<div className='flex'>
			<div className='w-full p-4'>
				<Link
					to={`/team/project?teamname=${teamName}&projectname=${projectName}`}
					className='text-gray-500'
				>
					Go back
				</Link>
				<h1 className='text-2xl font-bold mb-4'>Task: {taskName}</h1>
				<p className='mb-2'>Deadline: {deadline}</p>
				<p className='mb-6'>Priority: {priority}</p>

				<Container onDrop={onDrop}>
					{sections.map(section => (
						<Draggable key={section.id}>
							<div className='mb-6 rounded-lg shadow p-4 pl-0'>
								<div className='flex items-center justify-between mb-2'>
									<div className='cursor-move'>
										<GripVertical className='h-5 w-5 text-gray-400' />
									</div>
									<button
										onClick={() => handleDeleteSection(section.id)}
										className='text-red-500 hover:text-red-700'
									>
										<Trash2 className='h-5 w-5' />
									</button>
								</div>

								{section.type === 'text' && (
									<textarea
										className='w-full p-2 border rounded min-h-[100px]'
										value={section.content}
										onChange={e => handleTextChange(section.id, e.target.value)}
										placeholder='Enter your text here...'
									/>
								)}

								{section.type === 'table' && <TableSection section={section} />}

								{section.type === 'todo' && <TodoSection section={section} />}
							</div>
						</Draggable>
					))}
				</Container>

				{sections.length === 0 ? (
					<div className='text-left py-8'>
						<p className='text-gray-500 mb-4'>
							No sections yet. Create your first section:
						</p>
						<div className='flex gap-2 justify-left'>
							<button
								onClick={() => handleAddSection('text')}
								className='bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 flex items-center gap-1'
							>
								<Plus className='h-4 w-4' />
								Text Block
							</button>
							<button
								onClick={() => handleAddSection('todo')}
								className='bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 flex items-center gap-1'
							>
								<ListTodo className='h-4 w-4' />
								Todo List
							</button>
							<button
								onClick={() => handleAddSection('table')}
								className='bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 flex items-center gap-1'
							>
								<TableIcon className='h-4 w-4' />
								Table
							</button>
						</div>
					</div>
				) : (
					<div className='flex gap-2 mb-4'>
						<button
							onClick={() => handleAddSection('text')}
							className='bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 flex items-center gap-1'
						>
							<Plus className='h-4 w-4' />
							Text Block
						</button>
						<button
							onClick={() => handleAddSection('todo')}
							className='bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 flex items-center gap-1'
						>
							<ListTodo className='h-4 w-4' />
							Todo List
						</button>
						<button
							onClick={() => handleAddSection('table')}
							className='bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 flex items-center gap-1'
						>
							<TableIcon className='h-4 w-4' />
							Table
						</button>
					</div>
				)}
			</div>
			<Timer />
		</div>
	)
}

export default Task
