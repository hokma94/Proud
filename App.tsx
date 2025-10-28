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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

// Note 편집 컴포넌트
const NoteEditor = ({ note, onBack, onSave, onDelete }: { 
  note: any, 
  onBack: () => void, 
  onSave: (noteId: string, content: string) => void,
  onDelete: (noteId: string) => void
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = colors[isDark ? 'dark' : 'light'];
  
  const [content, setContent] = useState(note?.content || '');
  // 새 Note인지 기존 Note인지에 따라 기본 모드 설정
  const [isEditing, setIsEditing] = useState(!note?.content || note.content.trim() === '');

  // 뒤로가기 처리 - 내용이 비어있으면 Note 삭제
  const handleBack = () => {
    const trimmedContent = content.trim();
    // 새 Note이고 내용이 비어있거나, 기존 Note에서 내용을 모두 지운 경우
    if ((!note?.content || note.content.trim() === '') && trimmedContent === '') {
      // 빈 Note 삭제
      onDelete(note.id);
    }
    onBack();
  };

  // 내용 변경 시 자동 저장
  const handleContentChange = (text: string) => {
    setContent(text);
    // 디바운스된 자동 저장
    setTimeout(() => onSave(note.id, text), 1000);
  };

  // 첫 번째 줄을 타이틀로 추출
  const getTitle = (text: string) => {
    const lines = text.split('\n');
    const firstLine = lines.find(line => line.trim().length > 0);
    return firstLine ? firstLine.replace(/^#+\s*/, '').trim() : '제목 없음';
  };

  return (
    <LinearGradient
      colors={[theme.primary, theme.secondary]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="transparent"
          translucent
        />
        
        {/* 상단 제목 */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={[styles.backButtonText, { color: '#ffffff' }]}>← 뒤로</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: '#ffffff' }]}>
              {getTitle(content)}
            </Text>
            <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              {note ? '편집 중' : '새 Note'}
            </Text>
          </View>
        </View>

        {/* 편집/보기 모드 토글 버튼 */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isEditing && { backgroundColor: theme.primary }
            ]}
            onPress={() => setIsEditing(true)}
          >
            <Text style={[
              styles.toggleButtonText,
              { color: isEditing ? '#ffffff' : theme.textSecondary }
            ]}>
              편집
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !isEditing && { backgroundColor: theme.primary }
            ]}
            onPress={() => setIsEditing(false)}
          >
            <Text style={[
              styles.toggleButtonText,
              { color: !isEditing ? '#ffffff' : theme.textSecondary }
            ]}>
              보기
            </Text>
          </TouchableOpacity>
        </View>

        {/* Markdown 에디터/뷰어 */}
        <View style={[styles.editorContainer, { backgroundColor: theme.surface }]}>
          {isEditing ? (
            <TextInput
              style={[
                styles.markdownInput,
                {
                  color: theme.text,
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                }
              ]}
              placeholder="여기에 Markdown 형식으로 문서를 작성하세요...&#10;&#10;# 첫 번째 줄이 Note의 제목이 됩니다"
              placeholderTextColor={theme.textSecondary}
              value={content}
              onChangeText={handleContentChange}
              multiline
              textAlignVertical="top"
            />
          ) : (
            <ScrollView style={styles.markdownViewer}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // 제목 스타일
                  h1: ({children}) => <Text style={[styles.markdownH1, {color: theme.text}]}>{children}</Text>,
                  h2: ({children}) => <Text style={[styles.markdownH2, {color: theme.text}]}>{children}</Text>,
                  h3: ({children}) => <Text style={[styles.markdownH3, {color: theme.text}]}>{children}</Text>,
                  // 단락 스타일
                  p: ({children}) => <Text style={[styles.markdownP, {color: theme.text}]}>{children}</Text>,
                  // 목록 스타일
                  li: ({children}) => <Text style={[styles.markdownLi, {color: theme.text}]}>{children}</Text>,
                  // 코드 스타일
                  code: ({children}) => <Text style={[styles.markdownCode, {color: theme.text, backgroundColor: theme.inputBg}]}>{children}</Text>,
                  // 인용구 스타일
                  blockquote: ({children}) => <Text style={[styles.markdownBlockquote, {color: theme.textSecondary, borderLeftColor: theme.primary}]}>{children}</Text>,
                  // 표 스타일
                  table: ({children}) => <View style={[styles.markdownTable, {borderColor: theme.border}]}>{children}</View>,
                  thead: ({children}) => <View style={styles.markdownThead}>{children}</View>,
                  tbody: ({children}) => <View style={styles.markdownTbody}>{children}</View>,
                  tr: ({children}) => <View style={[styles.markdownTr, {borderBottomColor: theme.border}]}>{children}</View>,
                  th: ({children}) => <Text style={[styles.markdownTh, {color: theme.text, borderColor: theme.border}]}>{children}</Text>,
                  td: ({children}) => <Text style={[styles.markdownTd, {color: theme.text, borderColor: theme.border}]}>{children}</Text>,
                }}
              >
                {content || '# 문서가 비어있습니다\n\n편집 모드에서 문서를 작성해보세요.'}
              </ReactMarkdown>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

// Business Research 앱 컴포넌트 (Note 목록)
const BusinessResearchApp = ({ onBack }: { onBack: () => void }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = colors[isDark ? 'dark' : 'light'];
  
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentNote, setCurrentNote] = useState<any>(null);

  // Firebase에서 Note 목록 불러오기 및 기존 데이터 정리
  useEffect(() => {
    const initializeApp = async () => {
      // 기존 테스트 데이터 정리
      await firestoreHelpers.cleanupOldData();
      // Note 목록 불러오기
      await loadNotes();
    };
    
    initializeApp();
  }, []);

  // Note 목록 불러오기
  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const notesList = await firestoreHelpers.getNotes('business-notes');
      setNotes(notesList);
      setIsLoading(false);
    } catch (error) {
      console.error('Note 목록 불러오기 실패:', error);
      setIsLoading(false);
    }
  };

  // 새 Note 생성
  const createNewNote = async () => {
    try {
      const newNote = {
        title: '새 Note',
        content: '', // 빈 내용으로 시작
      };
      const noteId = await firestoreHelpers.createNote('business-notes', newNote);
      const createdNote = { id: noteId, ...newNote, createdAt: new Date(), updatedAt: new Date() };
      setCurrentNote(createdNote);
    } catch (error) {
      console.error('Note 생성 실패:', error);
      if (Platform.OS === 'web') {
        window.alert('Note 생성에 실패했습니다.');
      } else {
        Alert.alert('오류', 'Note 생성에 실패했습니다.');
      }
    }
  };

  // Note 저장
  const saveNote = async (noteId: string, content: string) => {
    try {
      const title = content.split('\n').find(line => line.trim().length > 0)?.replace(/^#+\s*/, '').trim() || '제목 없음';
      await firestoreHelpers.updateNote('business-notes', noteId, { content, title });
      // 목록 새로고침
      loadNotes();
    } catch (error) {
      console.error('Note 저장 실패:', error);
    }
  };

  // Note 삭제
  const deleteNote = async (noteId: string) => {
    // 웹 환경에서는 window.confirm 사용, 모바일에서는 Alert.alert 사용
    const isConfirmed = Platform.OS === 'web' 
      ? window.confirm('이 Note를 삭제하시겠습니까?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Note 삭제',
            '이 Note를 삭제하시겠습니까?',
            [
              { text: '취소', style: 'cancel', onPress: () => resolve(false) },
              { text: '삭제', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (isConfirmed) {
      try {
        await firestoreHelpers.deleteNote('business-notes', noteId);
        loadNotes();
      } catch (error) {
        console.error('Note 삭제 실패:', error);
        if (Platform.OS === 'web') {
          window.alert('Note 삭제에 실패했습니다.');
        } else {
          Alert.alert('오류', 'Note 삭제에 실패했습니다.');
        }
      }
    }
  };

  // Note 편집 화면으로 이동
  const openNote = (note: any) => {
    setCurrentNote(note);
  };

  // Note 목록으로 돌아가기
  const backToList = () => {
    setCurrentNote(null);
  };

  // Note 편집 화면이 열려있으면 NoteEditor 표시
  if (currentNote) {
    return (
      <NoteEditor
        note={currentNote}
        onBack={backToList}
        onSave={saveNote}
        onDelete={deleteNote}
      />
    );
  }

  // Note 목록 화면
  return (
    <LinearGradient
      colors={[theme.primary, theme.secondary]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
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
          <Text style={[styles.title, { color: '#ffffff' }]}>시니어 사업</Text>
          <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            사업 리서치 Note 관리
          </Text>
        </View>

        {/* 새 Note 생성 버튼 */}
        <TouchableOpacity
          style={[styles.createNoteButton, { backgroundColor: theme.surface }]}
          onPress={createNewNote}
          activeOpacity={0.8}
        >
          <Text style={[styles.createNoteButtonText, { color: theme.primary }]}>
            + 새 Note 생성
          </Text>
        </TouchableOpacity>

        {/* Note 목록 */}
        <View style={styles.notesContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Note 목록을 불러오는 중...
              </Text>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                아직 Note가 없습니다.
              </Text>
              <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
                새 Note를 생성해보세요!
              </Text>
            </View>
          ) : (
            <FlatList
              data={notes}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.noteItem, { backgroundColor: theme.surface }]}
                  onPress={() => openNote(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.noteHeader}>
                    <Text style={[styles.noteTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteNoteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteNote(item.id);
                      }}
                    >
                      <Text style={[styles.deleteNoteButtonText, { color: theme.danger }]}>
                        삭제
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.notePreview, { color: theme.textSecondary }]} numberOfLines={2}>
                    {item.content.replace(/^#+\s*/, '').trim() || '내용이 없습니다'}
                  </Text>
                  <Text style={[styles.noteTime, { color: theme.textSecondary }]}>
                    {formatDate(item.updatedAt)}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              style={styles.notesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

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
    
    // 웹 환경에서는 바로 실행 (확인 대화상자 우회)
    if (typeof window !== 'undefined') {
      console.log('영구삭제 확인됨, ID:', id);
      try {
        await firestoreHelpers.permanentlyDeleteTask(id);
        console.log('할일 영구삭제 완료, ID:', id);
        console.log('✅ 할일이 영구삭제되었습니다.');
      } catch (error) {
        console.error('할일 영구삭제 실패, ID:', id, 'Error:', error);
        console.log('❌ 할일 영구삭제에 실패했습니다.');
      }
    } else {
      // 모바일 환경에서는 Alert.alert 사용
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
                await firestoreHelpers.permanentlyDeleteTask(id);
                console.log('할일 영구삭제 완료, ID:', id);
              } catch (error) {
                console.error('할일 영구삭제 실패, ID:', id, 'Error:', error);
                Alert.alert('오류', '할일 영구삭제에 실패했습니다.');
              }
            },
          },
        ]
      );
    }
  }, [firestoreHelpers]);

  // 모든 삭제된 할일 영구삭제 함수
  const permanentlyDeleteAllDeletedTasks = useCallback(async () => {
    console.log('전체 영구삭제 함수 호출됨, 삭제된 할일 개수:', deletedTasks.length);
    
    if (deletedTasks.length === 0) {
      if (typeof window !== 'undefined') {
        window.alert('삭제된 할일이 없습니다.');
      } else {
        Alert.alert('알림', '삭제된 할일이 없습니다.');
      }
      return;
    }

    // 웹 환경에서는 바로 실행 (확인 대화상자 우회)
    if (typeof window !== 'undefined') {
      console.log('전체 영구삭제 확인됨, 삭제된 할일 개수:', deletedTasks.length);
      try {
        await firestoreHelpers.permanentlyDeleteAllDeletedTasks();
        console.log('모든 삭제된 할일 영구삭제 완료');
        console.log('✅ 모든 삭제된 할일이 영구삭제되었습니다.');
      } catch (error) {
        console.error('전체 영구삭제 실패:', error);
        console.log('❌ 전체 영구삭제에 실패했습니다.');
      }
    } else {
      // 모바일 환경에서는 Alert.alert 사용
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
                await firestoreHelpers.permanentlyDeleteAllDeletedTasks();
                console.log('모든 삭제된 할일 영구삭제 완료');
                Alert.alert('완료', '모든 삭제된 할일이 영구삭제되었습니다.');
              } catch (error) {
                console.error('전체 영구삭제 실패:', error);
                Alert.alert('오류', '전체 영구삭제에 실패했습니다.');
              }
            },
          },
        ]
      );
    }
  }, [deletedTasks.length, firestoreHelpers]);

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
  const renderDeletedTask = useCallback(({ item }: { item: Task }) => (
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
  ), [theme, restoreTask, permanentlyDeleteTask]);

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
          <Text style={[styles.title, { color: '#ffffff' }]}>To Do</Text>
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
              진행 중 ({activeTasks.length})
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
              완료 ({deletedTasks.length})
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
      case 'business-research':
        return <BusinessResearchApp onBack={handleBackToSelector} />;
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
      case 'grim-store':
        Linking.openURL('https://proud-prototype1.netlify.app/');
        return <PrototypeSelector onSelectPrototype={handleSelectPrototype} />;
      case 'draw-play':
        Linking.openURL('https://proud-prototype2.netlify.app/');
        return <PrototypeSelector onSelectPrototype={handleSelectPrototype} />;
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
    paddingTop: 40, // 모바일에서 상단 마진 축소 (60 → 40)
    paddingBottom: 20, // 하단 마진도 축소 (30 → 20)
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28, // 모바일에서 적절한 크기로 조정
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    flexWrap: 'wrap', // 여러 줄로 표시 가능
    maxWidth: '100%', // 컨테이너 너비에 맞춤
  },
  subtitle: {
    fontSize: 14, // 모바일에서 적절한 크기로 조정
    fontWeight: '500',
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginLeft: 50, // 좌우 여백 축소 (60 → 50)
    marginRight: 50, // 좌우 여백 축소 (60 → 50)
    minHeight: 60, // 최소 높이 축소 (80 → 60) - 상단 마진 축소에 맞춤
    justifyContent: 'center', // 세로 중앙 정렬
  },
  backButton: {
    position: 'absolute',
    top: 40, // 뒤로 버튼을 위로 올림 (60 → 40)
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
  contentContainer: {
    flex: 1,
    margin: 20,
    padding: 20,
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
  contentText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  contentSubText: {
    fontSize: 14,
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 300, // 모바일에서 최소 높이 보장
  },
  markdownInput: {
    flex: 1,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 260, // 모바일에서 최소 높이 보장
  },
  markdownViewer: {
    flex: 1,
    padding: 20,
    minHeight: 260, // 모바일에서 최소 높이 보장
  },
  createNoteButton: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  createNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notesContainer: {
    flex: 1,
    marginTop: 20,
  },
  notesList: {
    paddingHorizontal: 20,
  },
  noteItem: {
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
    height: 120, // Note 목록 아이템 높이 통일
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  deleteNoteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteNoteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notePreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    height: 40, // 2줄 고정 높이 (20px × 2)
    overflow: 'hidden',
  },
  noteTime: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Markdown 렌더링 스타일
  markdownH1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  markdownH2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  markdownH3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  markdownP: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  markdownLi: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  markdownCode: {
    fontSize: 14,
    fontFamily: 'monospace',
    padding: 4,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  markdownBlockquote: {
    fontSize: 16,
    fontStyle: 'italic',
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginVertical: 8,
    marginLeft: 8,
  },
  // 표 스타일
  markdownTable: {
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  markdownThead: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  markdownTbody: {
    backgroundColor: 'transparent',
  },
  markdownTr: {
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  markdownTh: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: 'bold',
    borderRightWidth: 1,
    textAlign: 'center',
  },
  markdownTd: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    borderRightWidth: 1,
    textAlign: 'center',
  },

});
