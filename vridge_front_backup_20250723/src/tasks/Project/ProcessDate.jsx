import { useState, useEffect, useRef, forwardRef } from 'react'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ko } from 'date-fns/esm/locale'

export default function ProcessDate({ process, set_process }) {
  const DateChange = (index, key, value) => {
    const updatedinputs = [...process]
    updatedinputs[index] = { ...updatedinputs[index], [key]: value }

    // 시작 날짜가 변경되는 경우에만 종료 날짜 업데이트
    if (key === 'startDate' && !updatedinputs[index].endDate) {
      updatedinputs[index] = {
        ...updatedinputs[index],
        startDate: value,
        // endDate: value,
      }
    }

    set_process(updatedinputs)
  }
  // { value,style, onClick }
  const ExampleCustomInput = forwardRef((props, ref) => (
    <button
      className={
        props.value ? 'example-custom-input' : 'example-custom-input off'
      }
      onClick={props.onClick}
      ref={ref}
    >
      {props.value}
    </button>
  ))
  return (
    <ul className="dataprocess">
      {process.map((range, index) => (
        <li key={index}>
          <div className="type">{range.text}</div>
          <div className="select start">
            <DatePicker
              locale={ko}
              placeholderText="시작 날짜"
              selected={range.startDate ? new Date(range.startDate) : null}
              onChange={(date) => DateChange(index, 'startDate', date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={10}
              dateFormat="yyyy-MM-dd HH:mm"
              customInput={<ExampleCustomInput />}
              // filterDate={filterPastDates} // 오늘 이전의 날짜 및 오늘 날짜 필터링
            />
          </div>
          <div className="select end">
            <DatePicker
              onInputClick={(e) => console.log(e)}
              locale={ko}
              placeholderText="종료 날짜"
              filterDate={(date) => {
                const startDate = new Date(process[index].startDate).setHours(
                  0,
                  0,
                  0,
                  0,
                )
                const currentDate = new Date(date)
                return startDate <= currentDate
              }}
              filterTime={(time) =>
                new Date(process[index].startDate) < new Date(time)
              }
              selected={range.endDate ? new Date(range.endDate) : null}
              onChange={(date) => DateChange(index, 'endDate', date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={10}
              dateFormat="yyyy-MM-dd HH:mm"
              disabled={!range.startDate} // 시작 날짜가 선택되지 않은 경우에는 종료 날짜를 비활성화
              customInput={<ExampleCustomInput />}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
