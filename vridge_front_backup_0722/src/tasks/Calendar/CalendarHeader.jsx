import React, { useState, useEffect } from 'react'
export default function CalendarHeader({
  totalDate,
  year,
  month,
  setMonth,
  setYear,
  week_index,
  set_week_index,
  type,
  changeDate,
  day,
  setDay,
}) {
  const [btn_type, set_btn_type] = useState('')
  useEffect(() => {
    const result = changeDate(type)
    if (btn_type === 'minus') {
      set_week_index(result.length - 1)
      setDay(result.length - 1)
    } else if (btn_type === 'add') {
      set_week_index(0)
      setDay(0)
    }
  }, [month, year])
  const current_month = month + 1
  function MinusMonth() {
    let pre_month = month - 1
    let pre_year = year
    if (pre_month < 0) {
      --pre_year
      pre_month = 11
    }
    setMonth(pre_month)
    if (pre_year != year) {
      setYear(pre_year)
    }
  }

  function PlusMonth() {
    let next_month = month + 1
    let next_year = year
    if (next_month > 11) {
      ++next_year
      next_month = 0
    }
    setMonth(next_month)
    if (next_year != year) {
      setYear(next_year)
    }
  }

  function MinusWeek() {
    if (week_index === 0) {
      MinusMonth()
    } else {
      set_week_index(week_index - 1)
    }
  }

  function PlusWeek() {
    if (week_index === totalDate.length - 1) {
      PlusMonth()
    } else {
      set_week_index(week_index + 1)
    }
  }

  function PlusDay() {
    if (day === totalDate.length - 1) {
      PlusMonth()
    } else {
      setDay(day + 1)
    }
  }

  function MinusDay() {
    if (day === 0) {
      MinusMonth()
    } else {
      setDay(day - 1)
    }
  }
  return (
    <div className="date flex space_between align_center">
      {year}.{current_month < 10 ? `0${current_month}` : current_month}
      <div className="move">
        <span
          onClick={() => {
            set_btn_type('minus')
            if (type === '월') {
              MinusMonth()
            } else if (type === '주') {
              MinusWeek()
            } else {
              MinusDay()
            }
          }}
          className="prev"
        ></span>
        <span
          onClick={() => {
            set_btn_type('add')
            if (type === '월') {
              PlusMonth()
            } else if (type === '주') {
              PlusWeek()
            } else {
              PlusDay()
            }
          }}
          className="next"
        ></span>
      </div>
    </div>
    //   {DAY.map((elm, idx) => {
    //       return <Day key={idx}>{elm}</Day>
    //     })}
  )
}
React.memo(CalendarHeader)
