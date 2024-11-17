import React, { useEffect, useState } from 'react'

const Timer = () => {
	const [time, setTime] = useState(0)
	const [inputTime, setInputTime] = useState('')
	const [isRunning, setIsRunning] = useState(false)

	const presetTimes = [300, 600, 900]

	useEffect(() => {
		if (!isRunning || time <= 0) return

		const interval = setInterval(() => {
			setTime(prev => prev - 1)
		}, 1000)

		return () => clearInterval(interval)
	}, [isRunning, time])

	const formatTime = seconds => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	const handleStart = () => setIsRunning(true)
	const handleStop = () => setIsRunning(false)
	const handleReset = () => {
		setIsRunning(false)
		setTime(0)
	}
	const handleAddTime = () => setTime(prev => prev + 600)

	const handlePresetTime = seconds => {
		setTime(seconds)
		setIsRunning(false)
	}

	const handleCustomTime = () => {
		const parsedTime = parseInt(inputTime, 10)
		if (!isNaN(parsedTime) && parsedTime > 0) {
			setTime(parsedTime * 60)
			setIsRunning(false)
			setInputTime('')
		}
	}

	return (
		<div className='timer p-4 border-2 right-0 top-0 h-full shadow-lg'>
			<h2 className='text-lg font-bold mb-4'>Timer</h2>
			<div className='time-display text-4xl font-mono text-center mb-4'>
				{formatTime(time)}
			</div>
			<div className='presets flex gap-2 mb-4'>
				{presetTimes.map(preset => (
					<button
						key={preset}
						onClick={() => handlePresetTime(preset)}
						className='bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200'
					>
						{preset / 60} min
					</button>
				))}
			</div>
			<div className='custom-time flex gap-2 mb-4'>
				<input
					type='text'
					value={inputTime}
					onChange={e => setInputTime(e.target.value)}
					placeholder='Enter time (min)'
					className='border rounded px-2 py-1 w-full'
				/>
				<button
					onClick={handleCustomTime}
					className='bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200'
				>
					Set
				</button>
			</div>
			<div className='controls flex gap-2'>
				<button
					onClick={handleStart}
					className='bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600'
					disabled={isRunning || time <= 0}
				>
					Start
				</button>
				<button
					onClick={handleStop}
					className='bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600'
					disabled={!isRunning}
				>
					Stop
				</button>
				<button
					onClick={handleReset}
					className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600'
				>
					Reset
				</button>
				<button
					onClick={handleAddTime}
					className='bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600'
				>
					+10 min
				</button>
			</div>
		</div>
	)
}

export default Timer
