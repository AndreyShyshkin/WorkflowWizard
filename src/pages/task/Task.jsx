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
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Draggable } from 'react-smooth-dnd'

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

	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')
	const projectName = urlParams.get('projectname')
	const taskName = urlParams.get('taskname')
	const deadline = urlParams.get('deadline')

	const fetchSections = () => {
		const sectionsRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections`
		)
		onValue(sectionsRef, snapshot => {
			if (!isDragging) {
				if (snapshot.exists()) {
					const sectionsData = snapshot.val()
					setSections(
						Object.entries(sectionsData).map(([id, section]) => ({
							id,
							...section,
						}))
					)
				} else {
					// Просто установим пустой массив, если секций нет
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
		setIsDragging(true)

		// Локально обновляем состояние
		const newSections = [...sections]
		const [removed] = newSections.splice(removedIndex, 1)
		newSections.splice(addedIndex, 0, removed)
		setSections(newSections)

		// Обновляем Firebase
		const sectionsRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections`
		)
		const sectionsObject = {}
		newSections.forEach(section => {
			sectionsObject[section.id] = {
				type: section.type,
				content: section.content,
				todos: section.todos || {},
				tableData: section.tableData,
			}
		})

		set(sectionsRef, sectionsObject)
			.then(() => setIsDragging(false))
			.catch(() => {
				// Восстановление предыдущего состояния при ошибке
				setSections([...sections])
				setIsDragging(false)
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
		const updatedTodos = {
			...todos,
			[Date.now()]: {
				text: newTaskText,
				completed: false,
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

		let newSection = {
			type,
			content: '',
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

	const TableSection = ({ section }) => (
		<div className='relative overflow-x-auto'>
			{/* Column control buttons */}
			<div className='flex mb-2'>
				{section.tableData[0].map((_, colIndex) => (
					<div key={colIndex} className='flex-1 flex justify-center'>
						<button
							onClick={() => deleteColumn(section.id, colIndex)}
							className='text-red-500 hover:text-red-700 p-1'
							title='Delete column'
						>
							<X className='h-4 w-4' />
						</button>
					</div>
				))}
			</div>

			<div className='flex'>
				{/* Row control buttons */}
				<div className='flex flex-col justify-center mr-2'>
					{section.tableData.map((_, rowIndex) => (
						<div key={rowIndex} className='flex items-center my-1'>
							<button
								onClick={() => deleteRow(section.id, rowIndex)}
								className='text-red-500 hover:text-red-700 p-1'
								title='Delete row'
							>
								<X className='h-4 w-4' />
							</button>
						</div>
					))}
				</div>

				{/* Table content */}
				<table className='min-w-full border-collapse border border-gray-300'>
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
											value={cell}
											onChange={e =>
												handleTableCellChange(
													section.id,
													rowIndex,
													colIndex,
													e.target.value
												)
											}
											className='w-full outline-none'
										/>
									</td>
								))}
								{/* Add column button at the end of each row */}
								<td className='border-0 p-2'>
									<button
										onClick={() => addColumn(section.id, row.length - 1)}
										className='text-blue-500 hover:text-blue-700'
										title='Add column'
									>
										<Plus className='h-4 w-4' />
									</button>
								</td>
							</tr>
						))}
						{/* Add row button at the bottom */}
						<tr>
							<td
								colSpan={section.tableData[0].length + 1}
								className='border-0 p-2'
							>
								<button
									onClick={() =>
										addRow(section.id, section.tableData.length - 1)
									}
									className='text-blue-500 hover:text-blue-700'
									title='Add row'
								>
									<Plus className='h-4 w-4' />
								</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	)

	const TodoSection = ({ section }) => (
		<div>
			{section.todos &&
				Object.entries(section.todos).map(([todoId, todo]) => (
					<div key={todoId} className='flex items-center gap-2 mb-2'>
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
					</div>
				))}

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

	return (
		<div className='max-w-2xl mx-auto p-4'>
			<h1 className='text-2xl font-bold mb-4'>Task: {taskName}</h1>
			<p className='mb-6'>Deadline: {deadline}</p>

			<Container onDrop={onDrop}>
				{sections.map(section => (
					<Draggable key={section.id}>
						<div className='mb-6 rounded-lg shadow p-4'>
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
				// Показываем сообщение и кнопки, если нет секций
				<div className='text-center py-8'>
					<p className='text-gray-500 mb-4'>
						No sections yet. Create your first section:
					</p>
					<div className='flex gap-2 justify-center'>
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
				// Показываем обычные кнопки добавления, если есть секции
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
	)
}

export default Task
