'use client'

import { useState, useEffect, useCallback } from 'react'
import Calendar from './Calendar'
import DiaryEditor from './DiaryEditor'
import { supabase } from '@/lib/supabase'

export default function Diary() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [entriesWithContent, setEntriesWithContent] = useState<string[]>([])

  const loadEntriesWithContent = useCallback(async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('date')

      if (error) {
        console.error('Error loading entries:', error)
        return
      }

      if (data) {
        setEntriesWithContent(data.map((entry) => entry.date))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }, [])

  useEffect(() => {
    loadEntriesWithContent()
  }, [loadEntriesWithContent])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleSave = () => {
    loadEntriesWithContent()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Calendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          entriesWithContent={entriesWithContent}
        />
      </div>
      <div className="lg:col-span-2">
        <DiaryEditor selectedDate={selectedDate} onSave={handleSave} />
      </div>
    </div>
  )
}
