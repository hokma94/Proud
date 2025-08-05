# EAS Build - 앱스토어 배포 가이드

## 📱 앱스토어 배포 방법

### 1. EAS CLI 설치
```bash
npm install -g @expo/eas-cli
```

### 2. EAS 로그인
```bash
eas login
```

### 3. EAS 설정
```bash
eas build:configure
```

### 4. iOS 앱스토어 빌드
```bash
eas build --platform ios
```

### 5. Android Play Store 빌드
```bash
eas build --platform android
```

### 6. 앱스토어 제출
```bash
eas submit --platform ios
eas submit --platform android
```

## 📋 필요 사항

- Apple Developer 계정 (iOS)
- Google Play Console 계정 (Android)
- 앱 아이콘, 스플래시 스크린 등 에셋 준비

## 🔗 참고 자료

- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [앱스토어 제출 가이드](https://docs.expo.dev/submit/introduction/) 