import CreateTask from './CreateTask'

function TasksBoard() {
	return (
		<div>
			<h3 className='text-3xl'>Tasks Board</h3>
			<div className='flex'>
				<div>
					<CreateTask date='Overdue' />
				</div>
				<div>
					<CreateTask date='Today' />
				</div>
				<div>
					<CreateTask date='Tomorrow' />
				</div>
				<div>
					<CreateTask date='On this week' />
				</div>
				<div>
					<CreateTask date='On next week' />
				</div>
				<div>
					<CreateTask date='Later' />
				</div>
			</div>
		</div>
	)
}

export default TasksBoard
