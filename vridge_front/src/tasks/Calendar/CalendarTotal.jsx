import React from 'react'
export default function CalendarTotal({
  project_list,
  this_month_project,
  next_month_project,
}) {
  return (
    <div className="part mt100">
      <ul className="schedule">
        <li>
          전체 <br />
          프로젝트 <span>{project_list.length}</span>
        </li>
        <li>
          이번 달 <br />
          프로젝트 <span>{this_month_project.length}</span>
        </li>
        <li>
          다음 달 <br />
          프로젝트 <span>{next_month_project.length}</span>
        </li>
      </ul>
    </div>
  )
}
React.memo(CalendarTotal)
