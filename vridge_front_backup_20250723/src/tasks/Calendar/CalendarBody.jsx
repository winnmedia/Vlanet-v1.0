import React, { useState, useEffect, useMemo } from 'react'

import moment from 'moment'
import 'moment/locale/ko'
import { CalendarDate } from './CalendarDate'

export default function CalendarBody({
  totalDate,
  month,
  year,
  type,
  week_index,
  day,
  current_project,
  project_list,
  user_memos,
  is_admin,
  refetch,
}) {
  return (
    <div className={type === '일' ? 'caldendar_box day' : 'caldendar_box'}>
      {type === '월' &&
        totalDate.map(
          (week, index) =>
            Array.isArray(week) && (
              <CalendarDate
                key={index}
                index={index}
                week={week}
                month={month}
                year={year}
                type={type}
                current_project={current_project}
                project_list={project_list}
                user_memos={user_memos}
                is_admin={is_admin}
                refetch={refetch}
              />
            ),
        )}
      {type === '주' && Array.isArray(totalDate[week_index]) && (
        <CalendarDate
          index={0}
          week={totalDate[week_index]}
          month={month}
          year={year}
          type={type}
          current_project={current_project}
          project_list={project_list}
          user_memos={user_memos}
          is_admin={is_admin}
          refetch={refetch}
        />
      )}
      {type === '일' && totalDate[day] && (
        <CalendarDate
          index={0}
          month={month}
          year={year}
          type={type}
          day={totalDate[day]}
          current_project={current_project}
          project_list={project_list}
          user_memos={user_memos}
          is_admin={is_admin}
          refetch={refetch}
        />
      )}
      {/* <div className="td"> */}
      {/* <div className="week">
          <div>1</div>
          <div>2</div>
          <div>3</div>
          <div>4</div>
          <div>5</div>
          <div>6</div>
          <div>7</div>
        </div>
        <div className="week">
          <div>8</div>
          <div>
            9<span className="first start"></span>
          </div>
          <div>
            10<span className="first"></span>
            <span className="second start"></span>
          </div>
          <div>
            11<span className="first"></span>
            <span className="second"></span>
          </div>
          <div>
            12<span className="first"></span>
            <span className="second"></span>
          </div>
          <div>
            13<span className="first end"></span>
            <span className="second end"></span>
            <span className="third start end"></span>
            <span className="fourth start end"></span>
            <span className="fifth start end"></span>
            <span className="sixth start end"></span>
          </div>
          <div>14</div>
        </div>
        <div className="week">
          <div>15</div>
          <div>16</div>
          <div>17</div>
          <div>18</div>
          <div>19</div>
          <div>20</div>
          <div>21</div>
        </div>
        <div className="week">
          <div>22</div>
          <div>23</div>
          <div>24</div>
          <div>24</div>
          <div>25</div>
          <div>26</div>
          <div>27</div>
        </div>
        <div className="week">
          <div>28</div>
          <div>29</div>
          <div>30</div>
          <div>31</div>
          <div></div>
          <div></div>
          <div></div>
        </div> */}
      {/* </div> */}
    </div>
  )
}

React.memo(CalendarBody)
