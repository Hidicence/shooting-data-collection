// 存儲適配器 - 自動檢測並使用 Firebase 或本地存儲的無縫切換

import { 
  createProject as createProjectFirebase,
  getProjects as getProjectsFirebase,
  updateProject as updateProjectFirebase,
  deleteProject as deleteProjectFirebase,
  createPersonalRecord as createPersonalRecordFirebase,
  getPersonalRecords as getPersonalRecordsFirebase,
  deletePersonalRecord as deletePersonalRecordFirebase,
  createCoordinatorRecord as createCoordinatorRecordFirebase,
  getCoordinatorRecords as getCoordinatorRecordsFirebase,
  deleteCoordinatorRecord as deleteCoordinatorRecordFirebase,
  uploadPhoto,
  type Project,
  type PersonalRecord,
  type CoordinatorRecord
} from './firebase-service'
import { uploadPhotoToGoogleDrive, getGoogleDriveInfo } from './google-drive-service'

// 檢查是否配置了 Firebase
const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )
}

// ================== 本地存儲替代方案 ==================

const localStorageAdapter = {
  // 專案相關
  async createProject(projectData: Omit<Project, 'id' | 'createdAt'>) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]')
    const newProject = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    projects.push(newProject)
    localStorage.setItem('projects', JSON.stringify(projects))
    return newProject
  },

  async getProjects(): Promise<Project[]> {
    return JSON.parse(localStorage.getItem('projects') || '[]')
  },

  async updateProject(projectId: string, projectData: Partial<Project>) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]')
    const index = projects.findIndex((p: Project) => p.id === projectId)
    if (index !== -1) {
      projects[index] = { ...projects[index], ...projectData }
      localStorage.setItem('projects', JSON.stringify(projects))
    }
    return true
  },

  async deleteProject(projectId: string) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]')
    const filtered = projects.filter((p: Project) => p.id !== projectId)
    localStorage.setItem('projects', JSON.stringify(filtered))
    return true
  },

  // 個人記錄相關
  async createPersonalRecord(recordData: Omit<PersonalRecord, 'id' | 'createdAt'>) {
    const records = JSON.parse(localStorage.getItem('personalData') || '[]')
    const newRecord = {
      ...recordData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    records.push(newRecord)
    localStorage.setItem('personalData', JSON.stringify(records))
    return newRecord
  },

  async getPersonalRecords(projectId?: string): Promise<PersonalRecord[]> {
    const records = JSON.parse(localStorage.getItem('personalData') || '[]')
    if (projectId) {
      return records.filter((r: PersonalRecord) => r.projectId === projectId)
    }
    return records
  },

  async deletePersonalRecord(recordId: string) {
    const records = JSON.parse(localStorage.getItem('personalData') || '[]')
    const filtered = records.filter((r: PersonalRecord) => r.id !== recordId)
    localStorage.setItem('personalData', JSON.stringify(filtered))
    return true
  },

  // 統整記錄相關
  async createCoordinatorRecord(recordData: Omit<CoordinatorRecord, 'id' | 'createdAt'>) {
    const records = JSON.parse(localStorage.getItem('coordinatorData') || '[]')
    const newRecord = {
      ...recordData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    records.push(newRecord)
    localStorage.setItem('coordinatorData', JSON.stringify(records))
    return newRecord
  },

  async getCoordinatorRecords(projectId?: string): Promise<CoordinatorRecord[]> {
    const records = JSON.parse(localStorage.getItem('coordinatorData') || '[]')
    if (projectId) {
      return records.filter((r: CoordinatorRecord) => r.projectId === projectId)
    }
    return records
  },

  async deleteCoordinatorRecord(recordId: string) {
    const records = JSON.parse(localStorage.getItem('coordinatorData') || '[]')
    const filtered = records.filter((r: CoordinatorRecord) => r.id !== recordId)
    localStorage.setItem('coordinatorData', JSON.stringify(filtered))
    return true
  }
}

// ================== 統一接口 ==================

export const storageAdapter = {
  // 專案相關
  createProject: async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    if (isFirebaseConfigured()) {
      try {
        return await createProjectFirebase(projectData)
      } catch (error) {
        console.warn('Firebase 失敗，使用本地存儲:', error)
        return await localStorageAdapter.createProject(projectData)
      }
    }
    return await localStorageAdapter.createProject(projectData)
  },

  getProjects: async (): Promise<Project[]> => {
    if (isFirebaseConfigured()) {
      try {
        return await getProjectsFirebase()
      } catch (error) {
        console.warn('Firebase 失敗，使用本地存儲:', error)
        return await localStorageAdapter.getProjects()
      }
    }
    return await localStorageAdapter.getProjects()
  },

  updateProject: async (projectId: string, projectData: Partial<Project>) => {
    if (isFirebaseConfigured()) {
      try {
        return await updateProjectFirebase(projectId, projectData)
      } catch (error) {
        console.warn('Firebase 失敗，使用本地存儲:', error)
        return await localStorageAdapter.updateProject(projectId, projectData)
      }
    }
    return await localStorageAdapter.updateProject(projectId, projectData)
  },

  deleteProject: async (projectId: string) => {
    if (isFirebaseConfigured()) {
      try {
        return await deleteProjectFirebase(projectId)
      } catch (error) {
        console.warn('Firebase 失敗，使用本地存儲:', error)
        return await localStorageAdapter.deleteProject(projectId)
      }
    }
    return await localStorageAdapter.deleteProject(projectId)
  },

  // 個人記錄相關
  createPersonalRecord: async (recordData: Omit<PersonalRecord, 'id' | 'createdAt'>) => {
    if (isFirebaseConfigured()) {
      try {
        return await createPersonalRecordFirebase(recordData)
      } catch (error) {
        console.warn('Firebase 失敗，使用本地存儲:', error)
        return await localStorageAdapter.createPersonalRecord(recordData)
      }
    }
    return await localStorageAdapter.createPersonalRecord(recordData)
  },

  getPersonalRecords: async (projectId?: string): Promise<PersonalRecord[]> => {
    if (isFirebaseConfigured()) {
      try {
        return await getPersonalRecordsFirebase(projectId)
      } catch (error) {
        console.warn('Firebase 失敗，使用本地存儲:', error)
        return await localStorageAdapter.getPersonalRecords(projectId)
      }
    }
    return await localStorageAdapter.getPersonalRecords(projectId)
  },

  deletePersonalRecord: async (recordId: string) => {
    if (isFirebaseConfigured()) {
      try {
        return await deletePersonalRecordFirebase(recordId)
      } catch (error) {
        console.warn('Firebase 失敗，使用本地存儲:', error)
        return await localStorageAdapter.deletePersonalRecord(recordId)
      }
    }
    return await localStorageAdapter.deletePersonalRecord(recordId)
  },

  // 統整記錄相關
  createCoordinatorRecord: async (recordData: Omit<CoordinatorRecord, 'id' | 'createdAt'>) => {
    if (isFirebaseConfigured()) {
      try {
        return await createCoordinatorRecordFirebase(recordData)
      } catch (error) {
        console.warn('Firebase 失敗，使用本地存儲:', error)
        return await localStorageAdapter.createCoordinatorRecord(recordData)
      }
    }
    return await localStorageAdapter.createCoordinatorRecord(recordData)
  },

  getCoordinatorRecords: async (projectId?: string): Promise<CoordinatorRecord[]> => {
    if (isFirebaseConfigured()) {
      try {
        return await getCoordinatorRecordsFirebase(projectId)
      } catch (error) {
        console.warn('Firebase 失敗，使用本地存儲:', error)
        return await localStorageAdapter.getCoordinatorRecords(projectId)
      }
    }
    return await localStorageAdapter.getCoordinatorRecords(projectId)
  },

  deleteCoordinatorRecord: async (recordId: string) => {
    if (isFirebaseConfigured()) {
      try {
        return await deleteCoordinatorRecordFirebase(recordId)
      } catch (error) {
        console.warn('Firebase 失敗，使用本地存儲:', error)
        return await localStorageAdapter.deleteCoordinatorRecord(recordId)
      }
    }
    return await localStorageAdapter.deleteCoordinatorRecord(recordId)
  },

  // 照片上傳 - 智能選擇最佳上傳方式
  uploadPhoto: async (
    file: File, 
    path: string,
    options?: {
      projectName?: string
      recordType?: 'personal' | 'coordinator'
      userName?: string
      date?: string
      photoType?: 'departure' | 'return' | 'site'
    }
  ): Promise<string> => {
    // 優先使用 Google Drive
    if (getGoogleDriveInfo().configured && options?.projectName) {
      try {
        console.log('🔄 使用 Google Drive 上傳照片...')
        return await uploadPhotoToGoogleDrive(file, options.projectName, options.recordType || 'personal', {
          userName: options.userName,
          date: options.date,
          photoType: options.photoType
        })
      } catch (error) {
        console.warn('Google Drive 上傳失敗，嘗試 Firebase:', error)
      }
    }
    
    // 回退到 Firebase Storage
    if (isFirebaseConfigured()) {
      try {
        console.log('🔄 使用 Firebase Storage 上傳照片...')
        return await uploadPhoto(file, path)
      } catch (error) {
        console.warn('Firebase Storage 失敗，使用 Base64:', error)
      }
    }
    
    // 最後回退到 Base64 編碼
    console.log('🔄 使用 Base64 本地存儲照片...')
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  },

  // 檢查狀態
  isCloudMode: () => isFirebaseConfigured(),
  
  getStorageInfo: () => {
    if (isFirebaseConfigured()) {
      return {
        mode: 'cloud',
        description: '雲端同步模式 - 數據即時同步，照片存儲在 Google Cloud'
      }
    }
    return {
      mode: 'local',
      description: '本地存儲模式 - 數據存儲在瀏覽器中'
    }
  }
}

// 導出類型
export type { Project, PersonalRecord, CoordinatorRecord } 