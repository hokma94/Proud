import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  useColorScheme,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, commonStyles } from './common/styles';

interface PrototypeSelectorProps {
  onSelectPrototype: (prototype: string) => void;
}

const PrototypeSelector: React.FC<PrototypeSelectorProps> = ({ onSelectPrototype }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = colors[isDark ? 'dark' : 'light'];

  const prototypes = [
    {
      id: 'todo',
      title: 'My Tasks',
      description: '할일 관리 앱 (Firebase 실시간 동기화)',
      icon: '📝',
      color: '#667eea',
    },
    {
      id: 'arts-culture',
      title: 'Arts&Culture',
      description: '예술과 문화를 탐험하는 앱 (준비 중)',
      icon: '🎨',
      color: '#10b981',
    },
    {
      id: '3d-gallery',
      title: '3D Gallery',
      description: '3D 갤러리 및 전시 공간 (실행 가능)',
      icon: '🏛️',
      color: '#f59e0b',
    },
    {
      id: 'feed-view',
      title: 'Feed View',
      description: '소셜 피드 및 콘텐츠 뷰어 (준비 중)',
      icon: '📱',
      color: '#ef4444',
    },
    {
      id: 'grim-store',
      title: 'Grim Store',
      description: '다크 테마 쇼핑몰 (준비 중)',
      icon: '🛒',
      color: '#8b5cf6',
    },
    {
      id: 'mini-games',
      title: 'Mini Games',
      description: '미니 게임 컬렉션 (준비 중)',
      icon: '🎮',
      color: '#06b6d4',
    },
    {
      id: 'event-1',
      title: 'Event #1',
      description: '특별 이벤트 및 프로모션 (준비 중)',
      icon: '🎉',
      color: '#ec4899',
    },
  ];

  return (
    <LinearGradient
      colors={[theme.primary, theme.secondary]}
      style={commonStyles.gradientContainer}
    >
      <SafeAreaView style={commonStyles.container}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent
        />
        
        {/* 상단 제목 */}
        <View style={[commonStyles.header, { backgroundColor: 'transparent' }]}>
          <Text style={[commonStyles.title, { color: '#ffffff' }]}>Prototype Hub</Text>
          <Text style={[commonStyles.subtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            다양한 프로토타입을 테스트해보세요
          </Text>
        </View>

        {/* 프로토타입 목록 */}
        <ScrollView style={styles.prototypeList} showsVerticalScrollIndicator={false}>
          {prototypes.map((prototype) => (
            <TouchableOpacity
              key={prototype.id}
              style={[
                styles.prototypeCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                },
              ]}
              onPress={() => {
                if (prototype.id === '3d-gallery') {
                  Linking.openURL('https://ph-poc-3dgallery.netlify.app/');
                } else {
                  onSelectPrototype(prototype.id);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.prototypeHeader}>
                <Text style={styles.prototypeIcon}>{prototype.icon}</Text>
                <View style={styles.prototypeInfo}>
                  <Text style={[styles.prototypeTitle, { color: theme.text }]}>
                    {prototype.title}
                  </Text>
                  <Text style={[styles.prototypeDescription, { color: theme.textSecondary }]}>
                    {prototype.description}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.prototypeStatus, 
                { 
                  backgroundColor: (prototype.id === 'todo' || prototype.id === '3d-gallery') 
                    ? '#fbbf24' // 노란색 (실행 가능)
                    : '#9ca3af' // 회색 (준비 중)
                }
              ]}>
                <Text style={styles.prototypeStatusText}>
                  {prototype.id === 'todo' || prototype.id === '3d-gallery' ? '실행 가능' : '준비 중'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  prototypeList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  prototypeCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  prototypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prototypeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  prototypeInfo: {
    flex: 1,
  },
  prototypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prototypeDescription: {
    fontSize: 14,
  },
  prototypeStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  prototypeStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PrototypeSelector; 