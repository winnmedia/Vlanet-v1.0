import { useNavigate } from 'react-router-dom'
import './LoginIntro.scss'
import w_logo from 'images/Common/w_logo02.svg'

export default function LoginIntro() {
  const navigate = useNavigate()
  return (
    <div className="LoginIntro">
      <div className="intro_wrap">
        <h1 className="logo">
          <img onClick={() => navigate('/')} src={w_logo} />
        </h1>
        <div className="slogun">
          당신의 창의력에
          <br />
          날개를 달아 줄<br />
          <span>콘텐츠 제작 협업툴</span>
        </div>
        <div className="etc flex space_between align_center">
          <ul>
            <li>
              Connect
              <br /> with each other
            </li>
            <li>
              Easy
              <br /> Feedback
            </li>
            <li>
              Study
              <br /> Together
            </li>
          </ul>
          <div>
          vlanet to
            <br /> connection
          </div>
        </div>
      </div>
    </div>
  )
}
