import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { firestoreHelpers } from './firebase';
import { Linking } from 'react-native';
import PrototypeSelector from './prototypes/PrototypeSelector';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// TypeScript 인터페이스 정의
interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  deletedAt?: Date;
  isDeleted: boolean;
  updatedAt: Date;
  fadeAnim?: Animated.Value;
  slideAnim?: Animated.Value;
}

// 색상 팔레트
const colors = {
  light: {
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    danger: '#ef4444',
    inputBg: '#f1f5f9',
    shadow: '#000000',
    deleted: '#f59e0b',
  },
  dark: {
    primary: '#8b5cf6',
    secondary: '#a855f7',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    success: '#22c55e',
    danger: '#f87171',
    inputBg: '#334155',
    shadow: '#000000',
    deleted: '#fbbf24',
  },
};

// 날짜 포맷 함수
const formatDate = (date: Date) => {
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 프로토타입 선택 화면은 외부 파일에서 import

// My Tasks 앱 컴포넌트
const MyTasksApp = ({ onBack }: { onBack: () => void }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = colors[isDark ? 'dark' : 'light'];
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Firestore 실시간 리스너 설정
  useEffect(() => {
    console.log('Firestore 실시간 리스너 설정 중...');
    
    const unsubscribe = firestoreHelpers.subscribeToTasks((firestoreTasks: Task[]) => {
      console.log('Firestore에서 데이터 수신:', firestoreTasks.length, '개');
      
      // 애니메이션 값 추가
      const tasksWithAnim = firestoreTasks.map((task: Task) => ({
        ...task,
        fadeAnim: new Animated.Value(1),
        slideAnim: new Animated.Value(0),
      }));
      
      setTasks(tasksWithAnim);
      setIsLoading(false);
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => {
      console.log('Firestore 리스너 해제');
      unsubscribe();
    };
  }, []);

  // 활성 할일과 삭제된 할일 분리
  const activeTasks = tasks.filter(task => !task.isDeleted);
  const deletedTasks = tasks.filter(task => task.isDeleted);

  // 새 할일 추가 함수
  const addTask = async () => {
    if (inputText.trim().length === 0) {
      Alert.alert('알림', '할일을 입력해주세요!');
      return;
    }

    try {
      const taskData = {
        text: inputText.trim(),
        isCompleted: false,
        isDeleted: false,
      };

      await firestoreHelpers.addTask(taskData);
      setInputText('');
      console.log('할일 추가 완료');
    } catch (error) {
      console.error('할일 추가 실패:', error);
      Alert.alert('오류', '할일 추가에 실패했습니다.');
    }
  };

  // 할일 완료/미완료 토글 함수
  const toggleTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const updates = {
        isCompleted: !task.completed,
        completedAt: !task.completed ? new Date() : null,
      };

      await firestoreHelpers.updateTask(id, updates);
      console.log('할일 상태 변경 완료');
    } catch (error) {
      console.error('할일 상태 변경 실패:', error);
      Alert.alert('오류', '할일 상태 변경에 실패했습니다.');
    }
  };

  // 할일 삭제 함수
  const deleteTask = async (id: string) => {
    console.log('삭제 버튼 클릭됨, ID:', id);
    
    try {
      await firestoreHelpers.deleteTask(id);
      console.log('할일 삭제 완료');
    } catch (error) {
      console.error('할일 삭제 실패:', error);
      Alert.alert('오류', '할일 삭제에 실패했습니다.');
    }
  };

  // 삭제된 할일 복원 함수
  const restoreTask = async (id: string) => {
    try {
      await firestoreHelpers.restoreTask(id);
      console.log('할일 복원 완료');
    } catch (error) {
      console.error('할일 복원 실패:', error);
      Alert.alert('오류', '할일 복원에 실패했습니다.');
    }
  };

  // 개별 할일 영구삭제 함수
  const permanentlyDeleteTask = useCallback(async (id: string) => {
    console.log('영구삭제 함수 호출됨, ID:', id);
    Alert.alert(
      '영구삭제 확인',
      '이 할일을 영구적으로 삭제하시겠습니까? 복원할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            console.log('영구삭제 확인됨, ID:', id);
            try {
              // 테스트: 영구삭제 대신 소프트 삭제로 변경
              console.log('테스트: 영구삭제 대신 소프트 삭제로 변경');
              await firestoreHelpers.updateTask(id, {
                isDeleted: true,
                deletedAt: new Date(),
                updatedAt: new Date(),
              });
              console.log('할일 소프트 삭제 완료 (테스트), ID:', id);
              Alert.alert('테스트 완료', '소프트 삭제로 변경되었습니다. (영구삭제 테스트)');
            } catch (error) {
              console.error('할일 삭제 실패, ID:', id, 'Error:', error);
              Alert.alert('오류', '할일 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  }, []);

  // 모든 삭제된 할일 영구삭제 함수
  const permanentlyDeleteAllDeletedTasks = async () => {
    console.log('전체 영구삭제 함수 호출됨, 삭제된 할일 개수:', deletedTasks.length);
    
    if (deletedTasks.length === 0) {
      Alert.alert('알림', '삭제된 할일이 없습니다.');
      return;
    }

    Alert.alert(
      '전체 영구삭제 확인',
      `삭제된 할일 ${deletedTasks.length}개를 모두 영구적으로 삭제하시겠습니까?\n복원할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 삭제',
          style: 'destructive',
          onPress: async () => {
            console.log('전체 영구삭제 확인됨, 삭제된 할일 개수:', deletedTasks.length);
            try {
              // 테스트: 전체 영구삭제 대신 개별 업데이트로 변경
              console.log('테스트: 전체 영구삭제 대신 개별 업데이트로 변경');
              const updatePromises = deletedTasks.map(task => 
                firestoreHelpers.updateTask(task.id, {
                  isDeleted: true,
                  deletedAt: new Date(),
                  updatedAt: new Date(),
                })
              );
              await Promise.all(updatePromises);
              console.log('모든 삭제된 할일 소프트 삭제 완료 (테스트)');
              Alert.alert('테스트 완료', '모든 할일이 소프트 삭제로 변경되었습니다. (영구삭제 테스트)');
            } catch (error) {
              console.error('전체 삭제 실패:', error);
              Alert.alert('오류', '전체 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 할일 항목 렌더링 함수
  const renderTask = ({ item }: { item: Task }) => {
    const opacity = item.fadeAnim || new Animated.Value(1);
    const translateX = item.slideAnim || new Animated.Value(0);

    return (
      <Animated.View
        style={[
          styles.taskItem,
          {
            opacity,
            transform: [{ translateX }],
            backgroundColor: theme.surface,
            borderColor: theme.border,
            shadowColor: theme.shadow,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.taskContent}
          onPress={() => toggleTask(item.id)}
          activeOpacity={0.7}
        >
          <Animated.View 
            style={[
              styles.checkbox,
              {
                borderColor: theme.border,
                backgroundColor: item.completed ? theme.success : 'transparent',
              },
              item.completed && styles.checked,
            ]}
          >
            {item.completed && (
              <Text style={[styles.checkmark, { color: '#ffffff' }]}>
                ✓
              </Text>
            )}
          </Animated.View>
          <View style={styles.taskTextContainer}>
            <Text
              style={[
                styles.taskText,
                { color: theme.text },
                item.completed && [styles.completedTaskText, { color: theme.textSecondary }],
              ]}
            >
              {item.text}
            </Text>
            <Text style={[styles.taskTime, { color: theme.textSecondary }]}>
              생성: {formatDate(item.createdAt)}
            </Text>
            {item.completedAt && (
              <Text style={[styles.taskTime, { color: theme.success }]}>
                완료: {formatDate(item.completedAt)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.danger }]}
          onPress={() => deleteTask(item.id)}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // 삭제된 할일 항목 렌더링 함수
  const renderDeletedTask = ({ item }: { item: Task }) => (
    <View
      style={[
        styles.taskItem,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          opacity: 0.7,
        },
      ]}
    >
      <View style={styles.taskContent}>
        <View 
          style={[
            styles.checkbox,
            {
              borderColor: theme.border,
              backgroundColor: item.completed ? theme.success : 'transparent',
            },
          ]}
        >
          {item.completed && (
            <Text style={[styles.checkmark, { color: '#ffffff' }]}>
              ✓
            </Text>
          )}
        </View>
        <View style={styles.taskTextContainer}>
          <Text
            style={[
              styles.taskText,
              { color: theme.textSecondary },
              item.completed && styles.completedTaskText,
            ]}
          >
            {item.text}
          </Text>
          <Text style={[styles.taskTime, { color: theme.textSecondary }]}>
            생성: {formatDate(item.createdAt)}
          </Text>
          {item.completedAt && (
            <Text style={[styles.taskTime, { color: theme.success }]}>
              완료: {formatDate(item.completedAt)}
            </Text>
          )}
          {item.deletedAt && (
            <Text style={[styles.taskTime, { color: theme.deleted }]}>
              삭제: {formatDate(item.deletedAt)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.deletedTaskButtons}>
        <TouchableOpacity
          style={[styles.restoreButton, { backgroundColor: theme.primary }]}
          onPress={() => restoreTask(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.restoreButtonText}>복원</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.permanentlyDeleteButton, { backgroundColor: theme.danger }]}
          onPress={() => {
            console.log('영구삭제 버튼 클릭됨, ID:', item.id);
            permanentlyDeleteTask(item.id);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.permanentlyDeleteButtonText}>영구삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: '#ffffff' }]}>
              데이터 로딩 중...
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.primary, theme.secondary]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent
        />
        
        {/* 상단 제목 */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={[styles.backButtonText, { color: '#ffffff' }]}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: '#ffffff' }]}>My Tasks</Text>
          <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            {activeTasks.length}개의 할일
          </Text>
        </View>

        {/* 입력 영역 */}
        <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="새 할일을 입력하세요..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            style={styles.addButton}
          >
            <TouchableOpacity 
              style={styles.addButtonTouchable} 
              onPress={addTask} 
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>추가</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* 탭 버튼 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              !showDeleted && { backgroundColor: theme.surface },
            ]}
            onPress={() => setShowDeleted(false)}
          >
            <Text style={[
              styles.tabButtonText,
              { color: !showDeleted ? theme.text : theme.textSecondary }
            ]}>
              활성 ({activeTasks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              showDeleted && { backgroundColor: theme.surface },
            ]}
            onPress={() => setShowDeleted(true)}
          >
            <Text style={[
              styles.tabButtonText,
              { color: showDeleted ? theme.text : theme.textSecondary }
            ]}>
              삭제됨 ({deletedTasks.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 할일 목록 */}
        {!showDeleted ? (
          <FlatList
            data={activeTasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  할일이 없습니다.
                </Text>
                <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
                  새 할일을 추가해보세요!
                </Text>
              </View>
            }
          />
        ) : (
          <>
            {deletedTasks.length > 0 && (
              <View style={styles.permanentlyDeleteAllContainer}>
                <TouchableOpacity
                  style={[styles.permanentlyDeleteAllButton, { backgroundColor: theme.danger }]}
                  onPress={() => {
                    console.log('전체 영구삭제 버튼 클릭됨, 삭제된 할일 개수:', deletedTasks.length);
                    permanentlyDeleteAllDeletedTasks();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.permanentlyDeleteAllButtonText}>
                    모든 삭제된 할일 영구삭제 ({deletedTasks.length}개)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <FlatList
              data={deletedTasks}
              renderItem={renderDeletedTask}
              keyExtractor={(item) => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    삭제된 할일이 없습니다.
                  </Text>
                </View>
              }
            />
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

// 메인 앱 컴포넌트
export default function App() {
  const [currentPrototype, setCurrentPrototype] = useState<string | null>(null);

  const handleSelectPrototype = (prototypeId: string) => {
    setCurrentPrototype(prototypeId);
  };

  const handleBackToSelector = () => {
    setCurrentPrototype(null);
  };

  // 프로토타입별 컴포넌트 렌더링
  const renderPrototype = () => {
    switch (currentPrototype) {
      case 'todo':
        return <MyTasksApp onBack={handleBackToSelector} />;
      case '3d-gallery':
        Linking.openURL('https://ph-poc-3dgallery.netlify.app/');
        return <PrototypeSelector onSelectPrototype={handleSelectPrototype} />;
      case 'arts-culture':
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>Arts&Culture - 준비 중입니다!</Text>
            <TouchableOpacity style={styles.backToSelectorButton} onPress={handleBackToSelector}>
              <Text style={styles.backToSelectorButtonText}>프로토타입 선택으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        );
      case 'feed-view':
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>Feed View - 준비 중입니다!</Text>
            <TouchableOpacity style={styles.backToSelectorButton} onPress={handleBackToSelector}>
              <Text style={styles.backToSelectorButtonText}>프로토타입 선택으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        );
      case 'grim-store':
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>Grim Store - 준비 중입니다!</Text>
            <TouchableOpacity style={styles.backToSelectorButton} onPress={handleBackToSelector}>
              <Text style={styles.backToSelectorButtonText}>프로토타입 선택으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        );
      case 'mini-games':
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>Mini Games - 준비 중입니다!</Text>
            <TouchableOpacity style={styles.backToSelectorButton} onPress={handleBackToSelector}>
              <Text style={styles.backToSelectorButtonText}>프로토타입 선택으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        );
      case 'event-1':
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>Event #1 - 준비 중입니다!</Text>
            <TouchableOpacity style={styles.backToSelectorButton} onPress={handleBackToSelector}>
              <Text style={styles.backToSelectorButtonText}>프로토타입 선택으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return <PrototypeSelector onSelectPrototype={handleSelectPrototype} />;
    }
  };

  return renderPrototype();
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 30,
  },
  backToSelectorButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToSelectorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonTouchable: {
    paddingHorizontal: 24,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
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
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 16,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    borderColor: 'transparent',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 12,
    marginBottom: 2,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletedTaskButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  restoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  permanentlyDeleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permanentlyDeleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
  },
  permanentlyDeleteAllContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  permanentlyDeleteAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permanentlyDeleteAllButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
