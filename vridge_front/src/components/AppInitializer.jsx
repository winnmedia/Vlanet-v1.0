import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateProjectStore } from '../redux/project';
import { ProjectList } from '../api/project';
import { GetUserInfo } from '../api/auth';
import { checkSession } from '../util/util';

export default function AppInitializer({ children }) {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const session = checkSession();

      if (!session) {

        setIsInitialized(true);
        return;
      }

      try {

        // 1. 사용자 정보 로드
        try {
          const userResponse = await GetUserInfo();
          if (userResponse?.data?.result) {
            dispatch(updateProjectStore({
              user: userResponse.data.result.email,
              profileImage: userResponse.data.result.profile_image || null
            }));

          }
        } catch (error) {}

        // 2. 프로젝트 리스트 로드
        try {
          const projectResponse = await ProjectList();
          if (projectResponse?.data?.result) {
            dispatch(updateProjectStore({
              project_list: projectResponse.data.result
            }));

          }
        } catch (error) {}

      } catch (error) {} finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [dispatch]);

  // 초기화 완료 전까지는 children을 렌더링
  return children;
}