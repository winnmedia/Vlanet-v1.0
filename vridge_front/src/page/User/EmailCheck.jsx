
import PageTemplate from '../../components/PageTemplate'
import dynamic from 'next/dynamic';;
import queryString from 'query-string';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from '../../util/nextNavigation';
import { checkSession, refetchProject } from '../../util/util';
import { useDispatch } from 'react-redux';

;
import { AcceptInvite } from '../../api/project';
import { Button } from '../../components/unified/Button'
const logo = dynamic(() => import('../../images/Common/logo.svg'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;

export default function EmailCheck() {
  const { navigate } = useRouter();
  const dispatch = useDispatch();
  const [param] = useSearchParams();
  const { uid, token } = queryString.parse(param.toString());
  const [result, SetResult] = useState('');

  useEffect(() => {

    if (checkSession()) {
      if (uid && token) {

        AcceptInvite(uid, token).
        then((res) => {

          SetResult('success');
        }).
        catch((err) => {

          

          SetResult('fail');
        });
      }
    } else {

      navigate(`/login?uid=${uid}&token=${token}`);
    }
  }, []);

  return (
    <PageTemplate auth={true} noLogin={true}>
      <div className="Auth_Form bg">
        <div className="form_wrap">
          <div className="emailcheck">
            <div className="logo">
              <img src={logo.src || logo} alt="image" loading="lazy" />
            </div>
            {/* 인증o */}
            {result === 'success' ?
            <>
                <div className="ment">
                  안녕하세요, <br />
                  <span className="en">vlanet</span>를 함께 사용하도록
                  초대받으셨습니다.
                </div>
                <UnifiedButton
                variant="primary"
                size="lg"
                onClick={() => {
                  refetchProject(dispatch, navigate);
                  navigate('/cmshome');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    refetchProject(dispatch, navigate);
                    navigate('/cmshome');
                  }
                }}
                className="submit"
                fullWidth>

                  시작하기
                </UnifiedButton>
              </> :
            result === 'fail' ?
            // 인증 x
            <div className="ment">
                죄송합니다,
                <br />
                계정 이메일과 초대받은 이메일이
                <br />
                <span className="un">일치하지 않습니다.</span>
              </div> :

            <div className="ment">이메일 확인중...</div>
            }
          </div>
        </div>
      </div>
    </PageTemplate>);

}