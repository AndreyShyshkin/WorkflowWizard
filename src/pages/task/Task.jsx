import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
	getDatabase,
	onValue,
	push,
	ref,
	remove,
	update,
} from 'firebase/database'
import { GripVertical, Plus, Table as TableIcon, Trash2, X } from 'lucide-react'
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
			if (snapshot.exists()) {
				const sectionsData = snapshot.val()
				setSections(
					Object.entries(sectionsData).map(([id, section]) => ({
						id,
						...section,
					}))
				)
			} else {
				const initialSection = {
					type: 'text',
					content: '',
					todos: [],
				}
				push(sectionsRef, initialSection)
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

	// Table management functions
	const addRow = (sectionId, atIndex) => {
		const section = sections.find(s => s.id === sectionId)
		const newTableData = [...section.tableData]
		const newRow = Array(newTableData[0].length).fill('')
		newTableData.splice(atIndex + 1, 0, newRow)

		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)
		update(sectionRef, { tableData: newTableData })
	}

	const deleteRow = (sectionId, rowIndex) => {
		const section = sections.find(s => s.id === sectionId)
		const newTableData = [...section.tableData]
		if (newTableData.length > 1) {
			newTableData.splice(rowIndex, 1)

			const sectionRef = ref(
				database,
				`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
			)
			update(sectionRef, { tableData: newTableData })
		}
	}

	const addColumn = (sectionId, atIndex) => {
		const section = sections.find(s => s.id === sectionId)
		const newTableData = section.tableData.map(row => {
			const newRow = [...row]
			newRow.splice(atIndex + 1, 0, '')
			return newRow
		})

		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)
		update(sectionRef, { tableData: newTableData })
	}

	const deleteColumn = (sectionId, colIndex) => {
		const section = sections.find(s => s.id === sectionId)
		if (section.tableData[0].length > 1) {
			const newTableData = section.tableData.map(row => {
				const newRow = [...row]
				newRow.splice(colIndex, 1)
				return newRow
			})

			const sectionRef = ref(
				database,
				`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
			)
			update(sectionRef, { tableData: newTableData })
		}
	}

	const handleAddTodo = sectionId => {
		if (!newTaskText.trim()) {
			setShowInput(null)
			return
		}

		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}/todos`
		)

		const newTodo = {
			text: newTaskText,
			completed: false,
		}

		push(sectionRef, newTodo)
		setNewTaskText('')
		setShowInput(null)
	}

	const handleAddSection = (currentIndex, type = 'text') => {
		const sectionsRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections`
		)

		let newSection = {
			type,
			content: '',
			todos: [],
		}

		if (type === 'table') {
			newSection.tableData = Array(tableSize.rows)
				.fill(null)
				.map(() => Array(tableSize.cols).fill(''))
		}

		push(sectionsRef, newSection)
	}

	const handleTodoToggle = (sectionId, todoId, currentCompleted) => {
		const todoRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}/todos/${todoId}`
		)
		update(todoRef, { completed: !currentCompleted })
	}

	const handleDeleteTodo = (sectionId, todoId) => {
		const todoRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}/todos/${todoId}`
		)
		remove(todoRef)
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

	const updateSectionTable = (sectionId, newTableData) => {
		const sectionRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks/${deadline}/${taskName}/sections/${sectionId}`
		)
		update(sectionRef, { tableData: newTableData })
	}

	const TableSection = ({ section }) => (
		<div className='relative overflow-x-auto group'>
			{/* Заголовок таблицы для перетаскивания столбцов */}
			<div className='flex mb-2'>
				<Container
					orientation='horizontal'
					dragHandleSelector='.drag-handle'
					onDrop={({ removedIndex, addedIndex }) => {
						if (removedIndex !== null && addedIndex !== null) {
							const newTableData = section.tableData.map(row => {
								const newRow = [...row]
								const [movedCell] = newRow.splice(removedIndex, 1)
								newRow.splice(addedIndex, 0, movedCell)
								return newRow
							})
							updateSectionTable(section.id, newTableData)
						}
					}}
				>
					{section.tableData[0].map((_, colIndex) => (
						<Draggable key={colIndex}>
							<div className='relative flex items-center'>
								<button
									onClick={() => deleteColumn(section.id, colIndex)}
									className='absolute top-0 left-0 text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition'
									title='Delete column'
								>
									<X className='h-4 w-4' />
								</button>
								<GripVertical className='drag-handle cursor-grab text-gray-500 ml-2' />
							</div>
						</Draggable>
					))}
				</Container>
			</div>

			{/* Содержимое таблицы для перетаскивания строк */}
			<Container
				dragHandleSelector='.drag-handle'
				onDrop={({ removedIndex, addedIndex }) => {
					if (removedIndex !== null && addedIndex !== null) {
						const newTableData = [...section.tableData]
						const [movedRow] = newTableData.splice(removedIndex, 1)
						newTableData.splice(addedIndex, 0, movedRow)
						updateSectionTable(section.id, newTableData)
					}
				}}
			>
				{section.tableData.map((row, rowIndex) => (
					<Draggable key={rowIndex}>
						<div className='flex items-center'>
							<button
								onClick={() => deleteRow(section.id, rowIndex)}
								className='text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition'
								title='Delete row'
							>
								<X className='h-4 w-4' />
							</button>
							<GripVertical className='drag-handle cursor-grab text-gray-500 ml-2' />
							<table className='w-full border-collapse border border-gray-300 ml-2'>
								<tbody>
									<tr>
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
										<td className='border-0 p-2'>
											<button
												onClick={() => addColumn(section.id, row.length - 1)}
												className='text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition'
												title='Add column'
											>
												<Plus className='h-4 w-4' />
											</button>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</Draggable>
				))}
			</Container>

			{/* Кнопка для добавления строки */}
			<button
				onClick={() => addRow(section.id, section.tableData.length - 1)}
				className='text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition'
				title='Add row'
			>
				<Plus className='h-4 w-4' />
			</button>
		</div>
	)

	return (
		<div className='max-w-2xl mx-auto p-4'>
			<h1 className='text-2xl font-bold mb-4'>Task: {taskName}</h1>
			<p className='mb-6'>Deadline: {deadline}</p>

			{sections.map((section, index) => (
				<div key={section.id} className='mb-6'>
					{section.type === 'text' && (
						<textarea
							className='w-full p-2 border rounded min-h-[100px]'
							value={section.content}
							onChange={e => handleTextChange(section.id, e.target.value)}
							placeholder='Enter your text here...'
						/>
					)}

					{section.type === 'table' && <TableSection section={section} />}

					{section.todos &&
						Object.entries(section.todos).map(([todoId, todo]) => (
							<div key={todoId} className='flex items-center gap-2 ml-4 mb-2'>
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

					<div className='flex gap-2 mt-2'>
						{showInput === section.id ? (
							<div className='flex gap-2'>
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
							<div className='flex gap-2'>
								<button
									onClick={() => setShowInput(section.id)}
									className='text-blue-500 hover:text-blue-700'
								>
									+ Add Todo
								</button>
								<button
									onClick={() => handleAddSection(index, 'text')}
									className='text-green-500 hover:text-green-700'
								>
									+ Add Text Block
								</button>
								<button
									onClick={() => handleAddSection(index, 'table')}
									className='text-purple-500 hover:text-purple-700 flex items-center gap-1'
								>
									<TableIcon className='w-4 h-4' />
									Add Table
								</button>
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	)
}

export default Task
