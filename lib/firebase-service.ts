import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'

// 檢查 Firestore 是否可用
const checkFirestore = () => {
  if (!db) {
    throw new Error('Firebase 未初始化，請檢查 Firebase 配置')
  }
  return db
}

// 數據類型定義
export interface Project {
  id?: string
  name: string
  description: string
  location: string
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'completed'
  director: string
  budget: string
  notes: string
  createdAt?: any
}

export interface PersonalRecord {
  id?: string
  name: string
  date: string
  mileage: string
  startLocation: string
  endLocation: string
  departurePhotoUrl?: string
  returnPhotoUrl?: string
  notes: string
  projectId: string
  projectName: string
  createdAt?: any
}

export interface CoordinatorRecord {
  id?: string
  date: string
  coordinatorName: string
  location: string
  electricityUsage: string
  electricityStartReading: string
  electricityEndReading: string
  waterWeight: string
  waterBottleCount: string
  foodWasteWeight: string
  mealCount: string
  recycleWeight: string
  recycleTypes: string[]
  photoUrls?: string[]
  notes: string
  projectId: string
  projectName: string
  createdAt?: any
}

// ================== 專案相關操作 ==================

export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
  try {
    const firestore = checkFirestore()
    const docRef = await addDoc(collection(firestore, 'projects'), {
      ...projectData,
      createdAt: Timestamp.now()
    })
    return { id: docRef.id, ...projectData }
  } catch (error) {
    console.error('創建專案失敗:', error)
    throw error
  }
}

export const getProjects = async (): Promise<Project[]> => {
  try {
    const firestore = checkFirestore()
    const q = query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project))
  } catch (error) {
    console.error('獲取專案列表失敗:', error)
    return []
  }
}

export const updateProject = async (projectId: string, projectData: Partial<Project>) => {
  try {
    const firestore = checkFirestore()
    const projectRef = doc(firestore, 'projects', projectId)
    await updateDoc(projectRef, projectData)
    return true
  } catch (error) {
    console.error('更新專案失敗:', error)
    throw error
  }
}

export const deleteProject = async (projectId: string) => {
  try {
    const firestore = checkFirestore()
    const projectRef = doc(firestore, 'projects', projectId)
    await deleteDoc(projectRef)
    return true
  } catch (error) {
    console.error('刪除專案失敗:', error)
    throw error
  }
}

// ================== 個人記錄相關操作 ==================

export const createPersonalRecord = async (recordData: Omit<PersonalRecord, 'id' | 'createdAt'>) => {
  try {
    const firestore = checkFirestore()
    const docRef = await addDoc(collection(firestore, 'personalRecords'), {
      ...recordData,
      createdAt: Timestamp.now()
    })
    return { id: docRef.id, ...recordData }
  } catch (error) {
    console.error('創建個人記錄失敗:', error)
    throw error
  }
}

export const getPersonalRecords = async (projectId?: string): Promise<PersonalRecord[]> => {
  try {
    const firestore = checkFirestore()
    let q
    if (projectId) {
      q = query(
        collection(firestore, 'personalRecords'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      )
    } else {
      q = query(collection(firestore, 'personalRecords'), orderBy('createdAt', 'desc'))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PersonalRecord))
  } catch (error) {
    console.error('獲取個人記錄失敗:', error)
    return []
  }
}

export const deletePersonalRecord = async (recordId: string) => {
  try {
    const firestore = checkFirestore()
    const recordRef = doc(firestore, 'personalRecords', recordId)
    await deleteDoc(recordRef)
    return true
  } catch (error) {
    console.error('刪除個人記錄失敗:', error)
    throw error
  }
}

// ================== 統整記錄相關操作 ==================

export const createCoordinatorRecord = async (recordData: Omit<CoordinatorRecord, 'id' | 'createdAt'>) => {
  try {
    const firestore = checkFirestore()
    const docRef = await addDoc(collection(firestore, 'coordinatorRecords'), {
      ...recordData,
      createdAt: Timestamp.now()
    })
    return { id: docRef.id, ...recordData }
  } catch (error) {
    console.error('創建統整記錄失敗:', error)
    throw error
  }
}

export const getCoordinatorRecords = async (projectId?: string): Promise<CoordinatorRecord[]> => {
  try {
    const firestore = checkFirestore()
    let q
    if (projectId) {
      q = query(
        collection(firestore, 'coordinatorRecords'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      )
    } else {
      q = query(collection(firestore, 'coordinatorRecords'), orderBy('createdAt', 'desc'))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CoordinatorRecord))
  } catch (error) {
    console.error('獲取統整記錄失敗:', error)
    return []
  }
}

export const deleteCoordinatorRecord = async (recordId: string) => {
  try {
    const firestore = checkFirestore()
    const recordRef = doc(firestore, 'coordinatorRecords', recordId)
    await deleteDoc(recordRef)
    return true
  } catch (error) {
    console.error('刪除統整記錄失敗:', error)
    throw error
  }
}

// ================== 實時監聽功能 ==================

export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
  try {
    const firestore = checkFirestore()
    const q = query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (querySnapshot) => {
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project))
      callback(projects)
    })
  } catch (error) {
    console.error('監聽專案失敗:', error)
    callback([])
    return () => {}
  }
}

export const subscribeToPersonalRecords = (callback: (records: PersonalRecord[]) => void, projectId?: string) => {
  try {
    const firestore = checkFirestore()
    let q
    if (projectId) {
      q = query(
        collection(firestore, 'personalRecords'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      )
    } else {
      q = query(collection(firestore, 'personalRecords'), orderBy('createdAt', 'desc'))
    }
    
    return onSnapshot(q, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PersonalRecord))
      callback(records)
    })
  } catch (error) {
    console.error('監聽個人記錄失敗:', error)
    callback([])
    return () => {}
  }
}

export const subscribeToCoordinatorRecords = (callback: (records: CoordinatorRecord[]) => void, projectId?: string) => {
  try {
    const firestore = checkFirestore()
    let q
    if (projectId) {
      q = query(
        collection(firestore, 'coordinatorRecords'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      )
    } else {
      q = query(collection(firestore, 'coordinatorRecords'), orderBy('createdAt', 'desc'))
    }
    
    return onSnapshot(q, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CoordinatorRecord))
      callback(records)
    })
  } catch (error) {
    console.error('監聽統整記錄失敗:', error)
    callback([])
    return () => {}
  }
} 