// 存儲適配器 - 專用於 Google Drive 上傳與管理
// 移除 Firebase 和本地存儲選項，專注於 Google Drive 雲端存儲

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

  // 照片上傳 - 只使用 Google Drive
  uploadPhoto: async (
    file: File, 
    path: string,
    options?: {
      projectName?: string
      recordType?: 'personal' | 'coordinator'
      userName?: string
      date?: string
      photoType?: 'departure' | 'return' | 'site'
      category?: string
      onProgress?: (progress: number) => void // 新增：上傳進度回調
    }
  ): Promise<string> => {
    // 檢查 Google Drive 配置
    const googleDriveInfo = getGoogleDriveInfo()
    if (!googleDriveInfo.configured) {
      throw new Error('Google Drive 未配置，請確認環境變數 NEXT_PUBLIC_GOOGLE_CLIENT_ID 已設定')
    }

    if (!options?.projectName) {
      throw new Error('專案名稱為必填項，無法上傳照片')
    }

    try {
      console.log('🔄 開始上傳照片到 Google Drive...')
      
      // 顯示上傳進度
      if (options.onProgress) {
        options.onProgress(10) // 開始上傳
      }

      const photoUrl = await uploadPhotoToGoogleDrive(file, options.projectName, options.recordType || 'personal', {
        userName: options.userName,
        date: options.date,
        photoType: options.photoType,
        category: options.category,
        onProgress: options.onProgress // 傳遞進度回調
      })

      console.log('✅ 照片上傳成功到 Google Drive')
      return photoUrl

    } catch (error) {
      console.error('❌ Google Drive 上傳失敗:', error)
      throw new Error(`Google Drive 上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  },

  // 檢查狀態
  isCloudMode: () => getGoogleDriveInfo().configured,
  
  getStorageInfo: () => {
    const googleDriveInfo = getGoogleDriveInfo()
    if (googleDriveInfo.configured) {
      return {
        mode: 'google-drive',
        description: '專用 Google Drive 雲端存儲 - 照片自動上傳並智能分類組織'
      }
    }
    return {
      mode: 'not-configured',
      description: '需要配置 Google Drive OAuth2 Client ID'
    }
  }
}

// 導出類型
export type { Project, PersonalRecord, CoordinatorRecord } 