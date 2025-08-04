# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

### 1.1 Firebase 콘솔 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. Google 계정으로 로그인

### 1.2 새 프로젝트 생성
1. **"프로젝트 추가"** 클릭
2. 프로젝트 이름: `MyVibeApp` (또는 원하는 이름)
3. **"프로젝트 만들기"** 클릭

## 2. Firestore 데이터베이스 설정

### 2.1 Firestore 생성
1. 왼쪽 메뉴에서 **"Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 클릭
3. **"테스트 모드에서 시작"** 선택 (개발용)
4. 위치: `asia-northeast3 (서울)` 선택
5. **"완료"** 클릭

### 2.2 보안 규칙 설정
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if true; // 개발용 - 프로덕션에서는 인증 필요
    }
  }
}
```

## 3. 웹 앱 설정

### 3.1 웹 앱 등록
1. 프로젝트 개요에서 **"웹"** 아이콘 클릭
2. 앱 닉네임: `MyVibeApp Web`
3. **"앱 등록"** 클릭

### 3.2 설정 정보 복사
Firebase SDK 설정 정보를 복사:
```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## 4. 코드 설정

### 4.1 firebase.js 파일 업데이트
`firebase.js` 파일의 `firebaseConfig` 객체를 실제 설정으로 교체:

```javascript
const firebaseConfig = {
  apiKey: "실제-API-키",
  authDomain: "실제-프로젝트-ID.firebaseapp.com",
  projectId: "실제-프로젝트-ID",
  storageBucket: "실제-프로젝트-ID.appspot.com",
  messagingSenderId: "실제-메시징-센더-ID",
  appId: "실제-앱-ID"
};
```

## 5. 필요한 패키지 설치

이미 설치된 패키지들:
```bash
npm install firebase @react-native-firebase/app @react-native-firebase/firestore
```

## 6. 테스트

### 6.1 앱 실행
```bash
npx expo start
```

### 6.2 동기화 테스트
1. **웹 브라우저**에서 할일 추가
2. **모바일 Expo Go**에서 즉시 반영 확인
3. **모바일**에서 할일 삭제
4. **웹 브라우저**에서 즉시 반영 확인

## 7. Firestore 데이터 구조

### 7.1 컬렉션: `tasks`
```javascript
{
  id: "자동생성된-ID",
  text: "할일 내용",
  isCompleted: false,
  isDeleted: false,
  createdAt: Timestamp,
  completedAt: Timestamp | null,
  deletedAt: Timestamp | null,
  updatedAt: Timestamp
}
```

## 8. 오프라인 지원

Firestore는 기본적으로 오프라인 지원을 제공합니다:
- 네트워크 연결이 없어도 로컬에서 작동
- 네트워크 복구 시 자동 동기화
- 충돌 해결 자동 처리

## 9. 보안 고려사항

### 9.1 프로덕션 환경
- Firebase Authentication 추가
- Firestore 보안 규칙 강화
- API 키 보호

### 9.2 현재 설정 (개발용)
- 모든 사용자가 읽기/쓰기 가능
- 인증 없이 접근 가능
- 개발 및 테스트 목적으로만 사용

## 10. 문제 해결

### 10.1 연결 오류
- Firebase 설정 정보 확인
- 네트워크 연결 확인
- Firestore 규칙 확인

### 10.2 동기화 문제
- 실시간 리스너 상태 확인
- 콘솔 로그 확인
- 앱 재시작

### 10.3 성능 최적화
- 필요한 데이터만 쿼리
- 페이지네이션 구현
- 인덱스 설정 