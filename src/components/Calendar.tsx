'use client'

import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'

interface CalendarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  entriesWithContent: string[] // 내용이 있는 날짜들 (YYYY-MM-DD 형식)
}

export default function Calendar({ selectedDate, onDateSelect, entriesWithContent }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  const renderDays = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium py-2 ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const formattedDate = format(day, 'yyyy-MM-dd')
        const hasContent = entriesWithContent.includes(formattedDate)
        const isSelected = isSameDay(day, selectedDate)
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isToday = isSameDay(day, new Date())
        const dayOfWeek = day.getDay()

        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateSelect(cloneDay)}
            className={`
              relative p-2 text-center cursor-pointer transition-all rounded-lg
              ${!isCurrentMonth ? 'text-gray-300' : ''}
              ${isCurrentMonth && dayOfWeek === 0 ? 'text-red-500' : ''}
              ${isCurrentMonth && dayOfWeek === 6 ? 'text-blue-500' : ''}
              ${isSelected ? 'bg-indigo-500 text-white' : 'hover:bg-gray-100'}
              ${isToday && !isSelected ? 'ring-2 ring-indigo-300' : ''}
            `}
          >
            <span className="text-sm">{format(day, 'd')}</span>
            {hasContent && (
              <div
                className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  isSelected ? 'bg-white' : 'bg-indigo-500'
                }`}
              />
            )}
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      )
      days = []
    }

    return <div className="space-y-1">{rows}</div>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  )
}
