import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import 'css/Cms/Cms.scss'

/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import { OnlineListAPI } from 'api/online'

export default function Elearning() {
  const navigate = useNavigate()
  const [online, set_online] = useState([])

  useEffect(() => {
    OnlineListAPI()
      .then((res) => {
        set_online(res.data.result)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        <main>
          <div className="title">Contents</div>
          <div className="content elearning">
            <ul className="oc">
              {online.map((video, index) => (
                <li key={index}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={video.link}
                    title="YouTube video player"
                    frameBorder={0}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}
