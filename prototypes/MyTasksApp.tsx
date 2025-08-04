import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { firestoreHelpers } from '../firebase';

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

interface MyTasksAppProps {
  onBack: () => void;
}

const MyTasksApp: React.FC<MyTasksAppProps> = ({ onBack }) => {
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
      <TouchableOpacity
        style={[styles.restoreButton, { backgroundColor: theme.primary }]}
        onPress={() => restoreTask(item.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.restoreButtonText}>복원</Text>
      </TouchableOpacity>
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
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

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
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  restoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButtonText: {
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
});

export default MyTasksApp; 