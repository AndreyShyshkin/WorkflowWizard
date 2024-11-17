import { getDatabase, onValue, ref } from 'firebase/database'
import { useEffect, useState } from 'react'

function Statistics() {
	const [tasksByCategory, setTasksByCategory] = useState({})
	const database = getDatabase()
	const urlParams = new URLSearchParams(window.location.search)
	const teamName = urlParams.get('teamname')
	const projectName = urlParams.get('projectname')

	useEffect(() => {
		const tasksRef = ref(
			database,
			`teams/${teamName}/projects/${projectName}/tasks`
		)
		onValue(tasksRef, snapshot => {
			if (snapshot.exists()) {
				const tasksData = {}
				snapshot.forEach(categorySnapshot => {
					const category = categorySnapshot.key
					tasksData[category] = []
					categorySnapshot.forEach(taskSnapshot => {
						tasksData[category].push({
							...taskSnapshot.val(),
							id: taskSnapshot.key,
						})
					})
				})
				setTasksByCategory(tasksData)
			}
		})
	}, [database, teamName, projectName])

	const totalTasksCount = Object.values(tasksByCategory).flat().length || 0
	const overdueCount = tasksByCategory['Overdue']?.length || 0
	const todayCount = tasksByCategory['Today']?.length || 0
	const tomorrowCount = tasksByCategory['Tomorrow']?.length || 0
	const onThisWeekCount = tasksByCategory['On this week']?.length || 0

	return (
		<div>
			<h3 className='text-3xl mb-4'>Statistics</h3>
			<div className='flex'>
				<div className='h-20 w-36 border-2 rounded-md flex mr-6'>
					<div className='m-auto'>
						<p className='text-center'>Total tasks</p>
						<p className='text-center'>{totalTasksCount}</p>
					</div>
				</div>
				<div className='h-20 w-36 border-2 rounded-md flex mr-6'>
					<div className='m-auto'>
						<p className='text-center'>Overdue</p>
						<p className='text-center'>{overdueCount}</p>
					</div>
				</div>
				<div className='h-20 w-36 border-2 rounded-md flex mr-6'>
					<div className='m-auto'>
						<p className='text-center'>Today</p>
						<p className='text-center'>{todayCount}</p>
					</div>
				</div>
				<div className='h-20 w-36 border-2 rounded-md flex mr-6'>
					<div className='m-auto'>
						<p className='text-center'>On this week</p>
						<p className='text-center'>
							{todayCount + tomorrowCount + onThisWeekCount}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Statistics
