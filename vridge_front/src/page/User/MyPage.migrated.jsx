import React, { useEffect, useState, useRef , Suspense } from 'react'
import dynamic from 'next/dynamic';;
import { UnifiedInput } from '../../components/unified/UnifiedInput';

import { UnifiedButton } from '../../components/unified/UnifiedButton';

import { useRouter } from 'next/router';
import PageTemplate from '../../components/PageTemplate';
import { checkSession } from '../../util/util';
import { getMyPageInfo, uploadProfileImage, updateProfile } from '../../api/user';
import { useSelector, useDispatch } from 'react-redux';
import { updateProjectStore } from '../../redux/project';
;
import { GetMyInvitations, AcceptInvitation, DeclineInvitation } from '../../api/invitation';
import { GetFriends, GetFriendRequests, RespondToFriendRequest, SearchFriends, SendFriendRequest, DeleteFriend, BlockFriend } from '../../api/friends';
import moment from 'moment';
import 'moment/locale/ko';
;
;
export default function MyPage() {
  const router = useRouter();
  const navigate = router.push;
  const dispatch = useDispatch();
  const user = useSelector(state => state.ProjectStore.user);
  const nickname = useSelector(state => state.ProjectStore.nickname);
  const storedProfileImage = useSelector(state => state.ProjectStore.profileImage);
  const [loading, setLoading] = useState(true);
  const [myPageData, setMyPageData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    bio: '',
    phone: '',
    company: '',
    position: ''
  });
  const [imagePreview, setImagePreview] = useState(() => {
    // localStorage에서 프로필 이미지 불러오기
    const savedImage = typeof window !== 'undefined' ? localStorage.getItem('profileImage') : null;
    return savedImage || storedProfileImage || null;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const fileInputRef = useRef(null);
  const [invitations, setInvitations] = useState({
    sent: [],
    received: [],
    recent_accepted: []
  });
  const [invitationLoading, setInvitationLoading] = useState(false);

  // 친구 관련 상태
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friendLoading, setFriendLoading] = useState(false);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  useEffect(() => {
    const session = checkSession();
    if (!session) {
      navigate('/login', {
        replace: true
      });
    } else {
      fetchMyPageData();
    }
  }, [navigate]);

  // 페이지 이탈 시 경고 (업로드되지 않은 이미지가 있을 때)
  useEffect(() => {
    const handleBeforeUnload = e => {
      if (profileImage && !isUploading) {
        e.preventDefault();
        e.returnValue = '업로드되지 않은 프로필 이미지가 있습니다. 페이지를 떠나시겠습니까?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [profileImage, isUploading]);

  // 초대 목록 로드
  const loadInvitations = async () => {
    try {
      setInvitationLoading(true);
      const response = await GetMyInvitations();
      setInvitations(response.data);
    } catch (error) {} finally {
      setInvitationLoading(false);
    }
  };

  // 초대 수락 처리
  const handleAcceptInvitation = async invitationId => {
    try {
      await AcceptInvitation(invitationId);
      loadInvitations(); // 목록 새로고침
      alert('초대를 수락했습니다.');
    } catch (error) {
      alert('초대 수락에 실패했습니다.');
    }
  };

  // 초대 거절 처리
  const handleDeclineInvitation = async invitationId => {
    try {
      await DeclineInvitation(invitationId);
      loadInvitations(); // 목록 새로고침
      alert('초대를 거절했습니다.');
    } catch (error) {
      alert('초대 거절에 실패했습니다.');
    }
  };

  // 친구 관련 함수들 - 임시 비활성화 (데이터베이스 테이블 문제)
  const loadFriends = async () => {
    setFriendLoading(true);
    try {
      // 친구 기능 임시 비활성화
      setFriends([]);
    } catch (error) {} finally {
      setFriendLoading(false);
    }
  };
  const loadFriendRequests = async () => {
    try {
      // 친구 기능 임시 비활성화
      setFriendRequests([]);
    } catch (error) {}
  };
  const handleFriendSearch = async () => {
    if (!friendSearchQuery.trim()) return;
    setFriendLoading(true);
    try {
      const response = await SearchFriends(friendSearchQuery.trim());
      setFriendSearchResults(response.data.users || []);
      setShowFriendSearch(true);
    } catch (error) {
      alert('친구 검색 중 오류가 발생했습니다.');
    } finally {
      setFriendLoading(false);
    }
  };
  const handleSendFriendRequest = async friendEmail => {
    try {
      await SendFriendRequest(friendEmail);
      alert('친구 요청을 보냈습니다.');
      handleFriendSearch(); // 검색 결과 새로고침
    } catch (error) {
      alert(error.response?.data?.message || '친구 요청 중 오류가 발생했습니다.');
    }
  };
  const handleFriendRequestResponse = async (friendshipId, action) => {
    try {
      await RespondToFriendRequest(friendshipId, action);
      alert(action === 'accept' ? '친구 요청을 수락했습니다.' : '친구 요청을 거절했습니다.');
      loadFriendRequests();
      if (action === 'accept') {
        loadFriends();
      }
    } catch (error) {
      alert('친구 요청 처리 중 오류가 발생했습니다.');
    }
  };

  // 친구 삭제
  const handleDeleteFriend = async friendEmail => {
    if (!window.confirm('정말로 친구를 삭제하시겠습니까?')) {
      return;
    }
    try {
      await DeleteFriend(friendEmail);
      alert('친구가 삭제되었습니다.');
      loadFriends(); // 목록 새로고침
    } catch (error) {
      alert(error.response?.data?.message || '친구 삭제 중 오류가 발생했습니다.');
    }
  };

  // 친구 차단
  const handleBlockFriend = async friendEmail => {
    if (!window.confirm('정말로 이 사용자를 차단하시겠습니까?')) {
      return;
    }
    try {
      await BlockFriend(friendEmail);
      alert('사용자를 차단했습니다.');
      loadFriends(); // 목록 새로고침
    } catch (error) {
      alert(error.response?.data?.message || '사용자 차단 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadInvitations();
    loadFriends();
    loadFriendRequests();
  }, []);
  const fetchMyPageData = async () => {
    try {
      const response = await getMyPageInfo();
      // MyPage API response received
      if (response.data && response.data.status === 'success') {
        setMyPageData(response.data.data);
        setProfileForm({
          nickname: response.data.data.profile.nickname || '',
          bio: response.data.data.profile.bio || '',
          phone: response.data.data.profile.phone || '',
          company: response.data.data.profile.company || '',
          position: response.data.data.profile.position || ''
        });
        if (response.data.data.profile.profile_image) {
          const imageUrl = response.data.data.profile.profile_image;
          // 백엔드 URL이 상대 경로인 경우 처리
          let fullImageUrl;
          if (imageUrl.startsWith('/')) {
            fullImageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app'}${imageUrl}`;
          } else {
            fullImageUrl = imageUrl;
          }
          setImagePreview(fullImageUrl);
          // Redux store와 localStorage에 프로필 이미지 저장
          dispatch(updateProjectStore({
            profileImage: fullImageUrl
          }));
          typeof window !== 'undefined' && localStorage.setItem('profileImage', fullImageUrl);
        }
        setLoading(false); // 성공 시에도 로딩 종료
      } else {
        setLoading(false);
      }
    } catch (error) {
      // 에러가 발생해도 기본 데이터로 표시
      setMyPageData({
        profile: {
          email: user || '',
          nickname: nickname || '',
          login_method: 'email',
          date_joined: new Date().toISOString().split('T')[0],
          bio: '',
          phone: '',
          company: '',
          position: '',
          profile_image: null
        },
        projects: {
          owned: {
            total: 0,
            recent: []
          },
          member: {
            total: 0,
            as_manager: 0,
            as_member: 0,
            recent: []
          },
          recent_activity: []
        },
        stats: {
          total_projects: 0,
          active_projects: 0,
          completed_projects: 0,
          total_collaborators: 0
        },
        recent_memos: []
      });
      setLoading(false);
    }
  };
  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file);
    }
  };
  const processImageFile = file => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB를 초과할 수 없습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };
  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };
  const handleCroppedImage = croppedBlob => {
    // 파일명에 타임스탬프 추가하여 유니크하게 만들기
    const timestamp = Date.now();
    const croppedFile = new File([croppedBlob], `profile_${timestamp}.jpg`, {
      type: 'image/jpeg'
    });
    setProfileImage(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      // Redux store와 localStorage에 미리보기 이미지 저장
      dispatch(updateProjectStore({
        profileImage: reader.result
      }));
      typeof window !== 'undefined' && localStorage.setItem('profileImage', reader.result);
    };
    reader.readAsDataURL(croppedBlob);
    setShowCropper(false);
    setTempImageSrc(null);
  };
  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageSrc(null);
  };
  const handleImageUpload = async () => {
    if (!profileImage) {
      alert('업로드할 이미지를 선택해주세요.');
      return;
    }
    if (isUploading) {
      alert('이미지 업로드 중입니다. 잠시 기다려주세요.');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('profile_image', profileImage);

    // Uploading profile image

    try {
      const response = await uploadProfileImage(formData);
      // Upload response received

      if (response.data && response.data.status === 'success') {
        alert('프로필 이미지가 업로드되었습니다.');
        setProfileImage(null);

        // 업로드된 이미지 URL 즉시 반영
        if (response.data.profile_image_url) {
          const imageUrl = response.data.profile_image_url;
          let fullImageUrl;

          // URL 처리
          if (imageUrl.startsWith('http')) {
            fullImageUrl = imageUrl;
          } else if (imageUrl.startsWith('/')) {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app';
            fullImageUrl = `${baseUrl}${imageUrl}`;
          } else {
            fullImageUrl = imageUrl;
          }

          // Setting preview image
          setImagePreview(fullImageUrl);

          // Redux store와 localStorage에 프로필 이미지 저장
          dispatch(updateProjectStore({
            profileImage: fullImageUrl
          }));
          typeof window !== 'undefined' && localStorage.setItem('profileImage', fullImageUrl);
        }

        // 마이페이지 데이터 새로고침을 지연시켜 이미지 업로드가 완전히 반영되도록 함
        setTimeout(() => {
          fetchMyPageData();
        }, 1000);
      } else {
        // 응답은 받았지만 성공이 아닌 경우
        const errorMsg = response.data?.message || '이미지 업로드에 실패했습니다.';
        alert(errorMsg);
      }
    } catch (error) {
      // 에러 메시지 처리
      let errorMessage = '이미지 업로드 실패: ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.status === 413) {
        errorMessage += '파일 크기가 너무 큽니다. 5MB 이하의 이미지를 선택해주세요.';
      } else if (error.response?.status === 401) {
        errorMessage += '인증이 만료되었습니다. 다시 로그인해주세요.';
        // 로그인 페이지로 리다이렉트
        setTimeout(() => navigate('/login'), 1500);
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += '알 수 없는 오류가 발생했습니다.';
      }
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };
  const handleProfileUpdate = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const response = await updateProfile(profileForm);
      if (response.data && response.data.status === 'success') {
        alert('프로필이 업데이트되었습니다.');
        setIsEditing(false);
        fetchMyPageData();
      }
    } catch (error) {
      alert('프로필 업데이트 실패: ' + (error.response?.data?.message || error.message || '알 수 없는 오류'));
    } finally {
      setIsSaving(false);
    }
  };
  const handleInputChange = e => {
    const {
      name,
      value
    } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const getProjectStatus = status => {
    const statusMap = {
      'planned': '계획됨',
      'in_progress': '진행중',
      'completed': '완료됨'
    };
    return statusMap[status] || status;
  };
  const getProjectStatusClass = status => {
    const classMap = {
      'planned': 'status-planned',
      'in_progress': 'status-progress',
      'completed': 'status-completed'
    };
    return classMap[status] || '';
  };
  if (loading) {
    return <PageTemplate>
        <main className="mypage-container" role="main">
          <div className="loading">
            <div className="loading-spinner"></div>
            <span className="loading-text">마이페이지 불러오는 중...</span>
          </div>
        </main>
      </PageTemplate>;
  }

  // myPageData가 없어도 기본 UI는 표시

  return <PageTemplate>
      {showCropper && tempImageSrc && <ImageCropper imageSrc={tempImageSrc} onCropComplete={handleCroppedImage} onCancel={handleCropCancel} />}
      <main className="mypage-container" role="main">
        <div className="mypage">
          <div className="mypage-header">
            <h1>마이페이지</h1>
            <div className="header-info">
              <span className="welcome-text">{myPageData?.profile?.nickname || nickname || '사용자'}님, 환영합니다</span>
            </div>
          </div>

          <div className="mypage-tabs">
            <UnifiedButton className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')} type="button" aria-label="클릭">
              프로필
            </UnifiedButton>
            <UnifiedButton className={activeTab === 'projects' ? 'active' : ''} onClick={() => setActiveTab('projects')} type="button" aria-label="클릭">
              프로젝트
            </UnifiedButton>
            <UnifiedButton className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')} type="button" aria-label="클릭">
              활동 내역
            </UnifiedButton>
            <UnifiedButton className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')} type="button" aria-label="클릭">
              통계
            </UnifiedButton>
            <UnifiedButton className={activeTab === 'friends' ? 'active' : ''} onClick={() => setActiveTab('friends')} type="button" aria-label="클릭">
              친구
              {friendRequests.length > 0 && <span className="badge">{friendRequests.length}</span>}
            </UnifiedButton>
          </div>

          <div className="mypage-content">
            {activeTab === 'profile' && <div className="profile-section">
                <div className="profile-header">
                  <h2>프로필 정보</h2>
                  {!isEditing && <Button variant="secondary" aria-label="Click"> setIsEditing(true)}>
                      수정
                    </Button>}
                </div>

                <div className="profile-image-section">
                  <div className="profile-image-wrapper">
                    <div className="profile-image-container">
                      <UserAvatar profileImage={imagePreview} name={myPageData?.profile?.nickname || nickname || 'U'} size={150} showBorder={true} className="profile-avatar-main" />
                      {isEditing && <div className="image-overlay">
                          <svg className="camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <span>사진 변경</span>
                        </div>}
                    </div>
                    <div className="profile-info-summary">
                      <h3>{myPageData?.profile?.nickname || nickname || '사용자'}</h3>
                      <p>{myPageData?.profile?.email || user}</p>
                      {myPageData?.profile?.company && <p className="company-info">
                          {myPageData.profile.company}
                          {myPageData.profile.position && ` · ${myPageData.profile.position}`}
                        </p>}
                    </div>
                  </div>
                  {isEditing && <div className="image-upload">
                      <div className={`upload-area ${isDragging ? 'drag-over' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p>클릭하거나 이미지를 드래그하여 업로드</p>
                        <p className="upload-hint">JPG, PNG, GIF (최대 5MB)</p>
                      </div>
                      <UnifiedInput ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{
                  display: 'none'
                }} / aria-label="file input">
                      {profileImage && <div className="upload-actions">
                          <Button onClick={handleImageUpload} disabled aria-label="Click">
                            {isUploading ? <>
                                <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                  <path d="M12 2a10 10 0 0 1 0 20" strokeLinecap="round" />
                                </svg>
                                업로드 중...
                              </> : '이미지 업로드'}
                          </Button>
                          <UnifiedButton onClick={() => {
                    setProfileImage(null);
                    // localStorage에서 이미지 복원 또는 DB 이미지 사용
                    const savedImage = typeof window !== 'undefined' ? localStorage.getItem('profileImage') : null;
                    const dbImage = myPageData?.profile?.profile_image ? myPageData.profile.profile_image.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app'}}${myPageData.profile.profile_image}` : myPageData.profile.profile_image : null;
                    setImagePreview(savedImage || dbImage || null);
                  }} className="cancel-upload-btn">
                            취소
                          </UnifiedButton>
                        </div>}
                    </div>}
                </div>

                <div className="profile-info">
                  <div className="info-row">
                    <label>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      이메일
                    </label>
                    <div className="info-value">{myPageData?.profile?.email || user || '-'}</div>
                  </div>

                  <div className="info-row">
                    <label>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      닉네임
                    </label>
                    {isEditing ? <UnifiedInput type="text" name="nickname" value={profileForm.nickname} onChange={handleInputChange} placeholder="닉네임" / aria-label="닉네임"> : <div className="info-value">{myPageData?.profile?.nickname || nickname || '-'}</div>}
                  </div>

                  <div className="info-row">
                    <label>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      자기소개
                    </label>
                    {isEditing ? <textarea name="bio" value={profileForm.bio} onChange={handleInputChange} placeholder="자기소개를 입력해주세요" rows="3" /> : <div className="info-value">{myPageData?.profile?.bio || '-'}</div>}
                  </div>

                  <div className="info-row">
                    <label>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      전화번호
                    </label>
                    {isEditing ? <UnifiedInput type="tel" name="phone" value={profileForm.phone} onChange={handleInputChange} placeholder="전화번호" / aria-label="전화번호"> : <div className="info-value">{myPageData?.profile?.phone || '-'}</div>}
                  </div>

                  <div className="info-row">
                    <label>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18" />
                        <path d="M5 21V7l8-4v18" />
                        <path d="M19 21V11l-6-3" />
                        <rect x="9" y="9" width="4" height="4" />
                        <rect x="9" y="14" width="4" height="4" />
                      </svg>
                      회사/소속
                    </label>
                    {isEditing ? <UnifiedInput type="text" name="company" value={profileForm.company} onChange={handleInputChange} placeholder="회사/소속" / aria-label="회사/소속"> : <div className="info-value">{myPageData?.profile?.company || '-'}</div>}
                  </div>

                  <div className="info-row">
                    <label>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      직책
                    </label>
                    {isEditing ? <UnifiedInput type="text" name="position" value={profileForm.position} onChange={handleInputChange} placeholder="직책" / aria-label="직책"> : <div className="info-value">{myPageData?.profile?.position || '-'}</div>}
                  </div>

                  <div className="info-row">
                    <label>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      로그인 방식
                    </label>
                    <div className="info-value">{myPageData?.profile?.login_method || 'email'}</div>
                  </div>

                  <div className="info-row">
                    <label>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      가입일
                    </label>
                    <div className="info-value">{myPageData?.profile?.date_joined || '-'}</div>
                  </div>

                  {isEditing && <div className="profile-actions">
                      <Button onClick={handleProfileUpdate} disabled aria-label="Click">
                        {isSaving ? '저장 중...' : '저장'}
                      </Button>
                      <UnifiedButton onClick={() => {
                  setIsEditing(false);
                  setProfileForm({
                    nickname: myPageData?.profile?.nickname || '',
                    bio: myPageData?.profile?.bio || '',
                    phone: myPageData?.profile?.phone || '',
                    company: myPageData?.profile?.company || '',
                    position: myPageData?.profile?.position || ''
                  }});
                }} className="cancel-btn">
                        취소
                      </UnifiedButton>
                    </div>}
                </div>
              </div>}

            {activeTab === 'projects' && <div className="projects-section">
                <div className="project-group">
                  <h3>내가 소유한 프로젝트 ({myPageData?.projects?.owned?.total || 0}개)</h3>
                  <div className="project-list">
                    {(myPageData?.projects?.owned?.recent || []).map(project => <div key={project.id} className="project-item">
                        <div className="project-details">
                          <div className="project-name">{project.name}</div>
                          <div className="project-meta">
                            <span className="meta-item created-date">
                              생성일: {new Date(project.created).toLocaleDateString('ko-KR')}
                            </span>
                            <span className={`project-status ${getProjectStatusClass(project.status)}`}>
                              {getProjectStatus(project.status)}
                            </span>
                          </div>
                        </div>
                        <Button variant="secondary" aria-label="Click"> navigate(`/ProjectView/${project.id}`)}
                        >
                          보기
                        </Button>
                      </div>)}
                  </div>
                </div>

                <div className="project-group">
                  <h3>참여 중인 프로젝트 ({myPageData?.projects?.member?.total || 0}개)</h3>
                  <div className="sub-stats">
                    <span>관리자: {myPageData?.projects?.member?.as_manager || 0}개</span>
                    <span>멤버: {myPageData?.projects?.member?.as_member || 0}개</span>
                  </div>
                  <div className="project-list">
                    {(myPageData?.projects?.member?.recent || []).map(project => <div key={project.id} className="project-item">
                        <div className="project-details">
                          <div className="project-name">{project.name}</div>
                          <div className="project-meta">
                            <span className="role">{project.role === 'manager' ? '관리자' : '멤버'}</span>
                            <span className="meta-item joined-date">
                              참여일: {new Date(project.joined).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                        <Button variant="secondary" aria-label="Click"> navigate(`/ProjectView/${project.id}`)}
                        >
                          보기
                        </Button>
                      </div>)}
                  </div>
                </div>
              </div>}

            {activeTab === 'activity' && <div className="activity-section">
                <h2>최근 활동</h2>
                <div className="activity-list">
                  {(myPageData?.projects?.recent_activity || []).map((activity, index) => <div key={index} className="activity-item">
                      <div className="activity-name">
                        {activity.name}
                        {activity.is_owner && <span className="owner-badge">소유자</span>}
                      </div>
                      <div className="activity-time">
                        마지막 업데이트: {activity.updated}
                      </div>
                    </div>)}
                </div>

                <h3>최근 메모</h3>
                <div className="memo-list">
                  {(myPageData?.recent_memos || []).map(memo => <div key={memo.id} className="memo-item">
                      <div className="memo-content">{memo.content}</div>
                      <div className="memo-date">{memo.created}</div>
                    </div>)}
                </div>
              </div>}

            {activeTab === 'stats' && <div className="stats-section">
                <h2>통계</h2>
                <div className="stats-grid">
                  <UnifiedCard variant="default">
                    <div className="stat-label">전체 프로젝트</div>
                    <div className="stat-value">{myPageData?.stats?.total_projects || 0}</div>
                  </UnifiedCard>
                  <UnifiedCard variant="default">
                    <div className="stat-label">진행 중인 프로젝트</div>
                    <div className="stat-value">{myPageData?.stats?.active_projects || 0}</div>
                  </UnifiedCard>
                  <UnifiedCard variant="default">
                    <div className="stat-label">완료된 프로젝트</div>
                    <div className="stat-value">{myPageData?.stats?.completed_projects || 0}</div>
                  </UnifiedCard>
                  <UnifiedCard variant="default">
                    <div className="stat-label">협업자 수</div>
                    <div className="stat-value">{myPageData?.stats?.total_collaborators || 0}</div>
                  </UnifiedCard>
                </div>
              </div>}

            {activeTab === 'friends' && <div className="friends-section">
                <div className="friends-header">
                  <h2>친구 관리</h2>
                  <div className="friend-search">
                    <UnifiedCard variant="default">
                      <UnifiedInput type="text" placeholder="이메일 또는 닉네임으로 검색" value={friendSearchQuery} onChange={e = aria-label="이메일 또는 닉네임으로 검색" /> setFriendSearchQuery(e.target.value)} onKeyPress={e => {
                    if (e.key === 'Enter') {
                      handleFriendSearch();
                    }
                  }} />
                      <Button onClick={handleFriendSearch} disabled={friendLoading} aria-label="Click">
                        {friendLoading ? '검색 중...' : '검색'}
                      </Button>
                    </UnifiedCard>
                  </div>
                </div>

                {/* 받은 친구 요청 */}
                {friendRequests.length > 0 && <div className="friend-requests-section">
                    <h3>받은 친구 요청 ({friendRequests.length})</h3>
                    <div className="friend-requests">
                      {friendRequests.map(request => <div key={request.id} className="friend-request-item">
                          <div className="friend-info">
                            <UserAvatar profileImage={request.requester.profile_image} name={request.requester.nickname} size={40} showBorder={false} className="friend-avatar" />
                            <div className="friend-details">
                              <div className="friend-name">{request.requester.nickname}</div>
                              <div className="friend-email">{request.requester.email}</div>
                              {request.requester.company && <div className="friend-company">{request.requester.company}</div>}
                            </div>
                          </div>
                          <div className="friend-actions">
                            <UnifiedButton onClick={() => handleFriendRequestResponse(request.id, 'accept')} type="button" aria-label="클릭" className="accept-btn">
                              수락
                            </UnifiedButton>
                            <UnifiedButton onClick={() => handleFriendRequestResponse(request.id, 'decline')} type="button" aria-label="클릭" className="decline-btn">
                              거절
                            </UnifiedButton>
                          </div>
                        </div>)}
                    </div>
                  </div>}

                {/* 검색 결과 */}
                {showFriendSearch && <div className="friend-search-results">
                    <h3>검색 결과</h3>
                    {friendSearchResults.length === 0 ? <p>검색 결과가 없습니다.</p> : <div className="search-results">
                        {friendSearchResults.map(user => <div key={user.id} className="search-result-item">
                            <div className="friend-info">
                              <UserAvatar profileImage={user.profile_image} name={user.nickname} size={40} showBorder={false} className="friend-avatar" />
                              <div className="friend-details">
                                <div className="friend-name">{user.nickname}</div>
                                <div className="friend-email">{user.email}</div>
                                {user.company && <div className="friend-company">{user.company}</div>}
                              </div>
                            </div>
                            <div className="friend-actions">
                              {user.friendship_status === 'none' && <UnifiedButton onClick={() => handleSendFriendRequest(user.email)} type="button" aria-label="클릭" className="add-friend-btn">
                                  친구 추가
                                </UnifiedButton>}
                              {user.friendship_status === 'pending' && <span className="status-pending">요청됨</span>}
                              {user.friendship_status === 'accepted' && <span className="status-friend">친구</span>}
                            </div>
                          </div>)}
                      </div>}
                  </div>}

                {/* 친구 목록 */}
                <div className="friends-list-section">
                  <h3>내 친구 ({friends.length})</h3>
                  {friendLoading ? <p>로딩 중...</p> : friends.length === 0 ? <p>아직 친구가 없습니다. 위에서 친구를 검색해보세요!</p> : <div className="friends-list">
                      {friends.map(friendship => <div key={friendship.id} className="friend-item">
                          <div className="friend-info">
                            <UserAvatar profileImage={friendship.friend.profile_image} name={friendship.friend.nickname} size={40} showBorder={false} className="friend-avatar" />
                            <div className="friend-details">
                              <div className="friend-name">{friendship.friend.nickname}</div>
                              <div className="friend-email">{friendship.friend.email}</div>
                              {friendship.friend.company && <div className="friend-company">{friendship.friend.company}</div>}
                              <div className="friend-since">
                                친구 된 날: {moment(friendship.since).format('YYYY.MM.DD')}
                              </div>
                            </div>
                          </div>
                          <div className="friend-actions">
                            <Button variant="secondary" disabled title="준비 중" aria-label="Click">메시지</Button>
                            <Button variant="secondary" disabled title="준비 중" aria-label="Click">프로젝트 초대</Button>
                            <Button variant="danger" aria-label="Click"> handleDeleteFriend(friendship.friend.email)}
                              style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginLeft: '5px',
                        transition: 'all 0.2s ease'
                      }}
                              onMouseEnter={e => {
                        e.target.style.backgroundColor = '#c82333';
                      }}
                              onMouseLeave={e => {
                        e.target.style.backgroundColor = '#dc3545';
                      }}
                            >
                              삭제
                            </Button>
                            <Button variant="danger" aria-label="Click"> handleBlockFriend(friendship.friend.email)}
                              style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginLeft: '5px',
                        transition: 'all 0.2s ease'
                      }}
                              onMouseEnter={e => {
                        e.target.style.backgroundColor = '#5a6268';
                      }}
                              onMouseLeave={e => {
                        e.target.style.backgroundColor = '#6c757d';
                      }}
                            >
                              차단
                            </Button>
                          </div>
                        </div>)}
                    </div>}
                </div>
              </div>}
          </div>
        </div>
      </main>
    </PageTemplate>;
}
import { Button } from '../../components/unified/Button'
const UnifiedCard = dynamic(() => import('../../components/unified/UnifiedCard'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const UserAvatar = dynamic(() => import('../../components/UserAvatar'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
const ImageCropper = dynamic(() => import('../../components/ImageCropper'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;