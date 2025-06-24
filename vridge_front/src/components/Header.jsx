import cx from 'classnames'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import './Header.scss'

export default function Header({
  // 초기값 지정
  leftItems = [],
  rightItems = [],
  children,
  props,
}) {
  const navigate = useNavigate()

  const left = makeHtml(leftItems, navigate)
  const right = makeHtml(rightItems, navigate)

  return (
    <div className="Header">
      <div>{left}</div>
      <div className="profile">{right}</div>
    </div>
  )
}

// type에 따라서 헤더의 html을 만들어주는 함수
function makeHtml(items = [], navigate) {
  return items.map((item, i) => {
    if (item.type === 'img') {
      const button = (
        <div key={i} className={item.className}>
          <img
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/CmsHome')}
            alt={`img_${i}`}
            src={item.src}
          />
        </div>
      )
      return button
    } else if (item.type === 'string') {
      const element = (
        <div key={i} className={item.className}>
          {item.text}
        </div>
      )
      return element
    }
  })
}
