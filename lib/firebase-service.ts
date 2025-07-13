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
    const docRef = await addDoc(collection(db, 'projects'), {
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
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
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
    const projectRef = doc(db, 'projects', projectId)
    await updateDoc(projectRef, projectData)
    return true
  } catch (error) {
    console.error('更新專案失敗:', error)
    throw error
  }
}

export const deleteProject = async (projectId: string) => {
  try {
    await deleteDoc(doc(db, 'projects', projectId))
    return true
  } catch (error) {
    console.error('刪除專案失敗:', error)
    throw error
  }
}

// ================== 個人記錄相關操作 ==================

export const createPersonalRecord = async (recordData: Omit<PersonalRecord, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'personalRecords'), {
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
    let q = query(collection(db, 'personalRecords'), orderBy('createdAt', 'desc'))
    
    if (projectId) {
      q = query(
        collection(db, 'personalRecords'), 
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      )
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
    await deleteDoc(doc(db, 'personalRecords', recordId))
    return true
  } catch (error) {
    console.error('刪除個人記錄失敗:', error)
    throw error
  }
}

// ================== 統整記錄相關操作 ==================

export const createCoordinatorRecord = async (recordData: Omit<CoordinatorRecord, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'coordinatorRecords'), {
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
    let q = query(collection(db, 'coordinatorRecords'), orderBy('createdAt', 'desc'))
    
    if (projectId) {
      q = query(
        collection(db, 'coordinatorRecords'), 
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      )
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
    await deleteDoc(doc(db, 'coordinatorRecords', recordId))
    return true
  } catch (error) {
    console.error('刪除統整記錄失敗:', error)
    throw error
  }
}

// ================== 照片上傳相關操作 ==================
// 已移除 Firebase Storage 相關功能
// 照片上傳現在使用 NAS 或 Google Drive

// ================== 即時監聽功能 ==================

export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (querySnapshot) => {
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project))
    callback(projects)
  })
}

export const subscribeToPersonalRecords = (callback: (records: PersonalRecord[]) => void, projectId?: string) => {
  let q = query(collection(db, 'personalRecords'), orderBy('createdAt', 'desc'))
  
  if (projectId) {
    q = query(
      collection(db, 'personalRecords'), 
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    )
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PersonalRecord))
    callback(records)
  })
}

export const subscribeToCoordinatorRecords = (callback: (records: CoordinatorRecord[]) => void, projectId?: string) => {
  let q = query(collection(db, 'coordinatorRecords'), orderBy('createdAt', 'desc'))
  
  if (projectId) {
    q = query(
      collection(db, 'coordinatorRecords'), 
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    )
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CoordinatorRecord))
    callback(records)
  })
} 