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
      id: 'gryb-online',
      title: '그림약방 온라인 프로그램',
      description: '그림약방 온라인 프로그램',
      icon: '🎨',
      color: '#10b981',
      url: 'https://gryb-online.vercel.app',
    },
    {
      id: 'proud100',
      title: 'Proud100 브랜드 가이드',
      description: 'Proud100 브랜드 가이드',
      icon: '📖',
      color: '#8b5cf6',
      url: 'https://proud-bi.netlify.app',
    },
    {
      id: 'draw-play',
      title: 'Draw & Play',
      description: '드로잉과 미니게임 중심의 데일리 미션형 인지강화 앱 프로토타입',
      icon: '🎨',
      color: '#10b981',
    },
    {
      id: 'grim-store',
      title: 'Grim Store',
      description: '시니어 그림을 사고 팔 수 있는 앱 프로토타입',
      icon: '🛒',
      color: '#ef4444',
    },
    {
      id: '3d-gallery',
      title: '3D Gallery',
      description: '3D 갤러리 및 전시 공간',
      icon: '🏛️',
      color: '#f59e0b',
    },
    {
      id: 'business-research',
      title: 'Business Research',
      description: '시니어 사업 리서치 자료',
      icon: '📊',
      color: '#06b6d4',
    },
    {
      id: 'todo',
      title: 'To Do',
      description: '할일 관리 앱',
      icon: '📝',
      color: '#667eea',
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
          <Text style={[commonStyles.title, { color: '#ffffff' }]}>Work Hub</Text>
          <Text style={[commonStyles.subtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            프라우드 사업본부에서 진행 중인 업무를 확인해 보세요
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
                if (prototype.url) {
                  Linking.openURL(prototype.url);
                } else if (prototype.id === '3d-gallery') {
                  Linking.openURL('https://ph-poc-3dgallery.netlify.app/');
                } else if (prototype.id === 'grim-store') {
                  Linking.openURL('https://proud-prototype1.netlify.app/');
                } else if (prototype.id === 'draw-play') {
                  Linking.openURL('https://proud-prototype2.netlify.app/');
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
                  backgroundColor: (prototype.id === 'todo' || prototype.id === 'business-research' || prototype.id === '3d-gallery' || prototype.id === 'grim-store' || prototype.id === 'draw-play' || prototype.id === 'proud100' || prototype.id === 'gryb-online') 
                    ? '#fbbf24' // 노란색 (실행 가능)
                    : '#9ca3af' // 회색 (준비 중)
                }
              ]}>
                <Text style={styles.prototypeStatusText}>
                  {prototype.id === 'todo' || prototype.id === 'business-research' || prototype.id === '3d-gallery' || prototype.id === 'grim-store' || prototype.id === 'draw-play' || prototype.id === 'proud100' || prototype.id === 'gryb-online' ? '실행 가능' : '준비 중'}
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