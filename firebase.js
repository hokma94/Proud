import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCgM0lAWdRhpf88oTRdvwuEMAsoKUtJBOo",
  authDomain: "myvibeapp-5603a.firebaseapp.com",
  projectId: "myvibeapp-5603a",
  storageBucket: "myvibeapp-5603a.firebasestorage.app",
  messagingSenderId: "829185288957",
  appId: "1:829185288957:web:5c00767c305cdf104eac94",
  measurementId: "G-GF4HBJE86Q"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 초기화
export const db = getFirestore(app);

// Firestore 컬렉션 참조
export const tasksCollection = collection(db, 'tasks');

// Firestore 헬퍼 함수들
export const firestoreHelpers = {
  // 할일 추가
  addTask: async (taskData) => {
    try {
      const docRef = await addDoc(tasksCollection, {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('할일 추가 실패:', error);
      throw error;
    }
  },

  // 할일 업데이트
  updateTask: async (taskId, updates) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('할일 업데이트 실패:', error);
      throw error;
    }
  },

  // 할일 삭제 (소프트 삭제)
  deleteTask: async (taskId) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('할일 삭제 실패:', error);
      throw error;
    }
  },

  // 할일 복원
  restoreTask: async (taskId) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        isDeleted: false,
        deletedAt: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('할일 복원 실패:', error);
      throw error;
    }
  },

  // 할일 영구삭제
  permanentlyDeleteTask: async (taskId) => {
    console.log('firebase.js: 영구삭제 시작, taskId:', taskId);
    try {
      const taskRef = doc(db, 'tasks', taskId);
      console.log('firebase.js: 문서 참조 생성됨:', taskRef);
      await deleteDoc(taskRef);
      console.log('firebase.js: 영구삭제 완료, taskId:', taskId);
    } catch (error) {
      console.error('firebase.js: 할일 영구삭제 실패, taskId:', taskId, 'Error:', error);
      throw error;
    }
  },

  // 모든 삭제된 할일 영구삭제
  permanentlyDeleteAllDeletedTasks: async () => {
    try {
      const q = query(tasksCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const deletePromises = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isDeleted) {
          deletePromises.push(deleteDoc(doc.ref));
        }
      });
      
      await Promise.all(deletePromises);
      console.log('모든 삭제된 할일 영구삭제 완료');
    } catch (error) {
      console.error('삭제된 할일 영구삭제 실패:', error);
      throw error;
    }
  },

  // 실시간 리스너 설정
  subscribeToTasks: (callback) => {
    const q = query(tasksCollection, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const tasks = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          text: data.text,
          completed: data.isCompleted || false,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          completedAt: data.completedAt?.toDate?.() || null,
          deletedAt: data.deletedAt?.toDate?.() || null,
          isDeleted: data.isDeleted || false,
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });
      callback(tasks);
    }, (error) => {
      console.error('실시간 리스너 오류:', error);
    });
  },
};

export default app; 