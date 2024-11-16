import CreateTask from './CreateTask'

function TasksBoard() {
	return (
		<div>
			<h3>Tasks Board</h3>
			<div className='flex'>
				<div>
					<h2>Today</h2>
					<CreateTask date='Today' />
				</div>
				<div>
					<h2>Tomorrow</h2>
					<CreateTask date='Tomorrow' />
				</div>
				<div>
					<h2>On this week</h2>
					<CreateTask date='On this week' />
				</div>
				<div>
					<h2>On next weeek</h2>
					<CreateTask date='On next week' />
				</div>
				<div>
					<h2>Later</h2>
					<CreateTask date='Later' />
				</div>
			</div>
		</div>
	)
}

export default TasksBoard
