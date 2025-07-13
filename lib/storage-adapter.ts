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
  type Project,
  type PersonalRecord,
  type CoordinatorRecord
} from './firebase-service'

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  type UploadResult 
} from 'firebase/storage'
import { storage } from './firebase'

// 檢查是否配置了 Firebase
const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
    storage // 確保 storage 已初始化
  )
}

// Firebase Storage 照片上傳函數
const uploadPhotoToFirebaseStorage = async (
  file: File,
  path: string,
  options?: {
    projectName?: string
    recordType?: 'personal' | 'coordinator'
    userName?: string
    date?: string
    photoType?: 'departure' | 'return' | 'site'
    category?: string
  }
): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage 未初始化')
  }
  
  // 確保 storage 不為 null 的類型斷言
  const firebaseStorage = storage!

  try {
    // 生成有邏輯的檔案路徑和名稱
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
    const fileExtension = file.name.split('.').pop()
    
    let filePath = ''
    let fileName = ''
    
    if (options?.recordType === 'personal') {
      const photoTypeText = options.photoType === 'departure' ? '去程里程' 
                          : options.photoType === 'return' ? '回程里程' 
                          : '現場記錄'
      const userName = options.userName || '未知人員'
      const projectName = options.projectName || '未知專案'
      
      filePath = `photos/${projectName}/個人記錄/${userName}/${dateStr}`
      fileName = `${timeStr}_${userName}_${photoTypeText}.${fileExtension}`
    } else if (options?.recordType === 'coordinator') {
      const categoryText = options.category === 'electricity' ? '用電記錄'
                        : options.category === 'water' ? '飲水記錄'
                        : options.category === 'meal' ? '餐飲記錄'
                        : options.category === 'recycle' ? '回收記錄'
                        : '現場記錄'
      const projectName = options.projectName || '未知專案'
      
      filePath = `photos/${projectName}/統整員記錄/${dateStr}`
      fileName = `${timeStr}_${categoryText}_現場照片.${fileExtension}`
    } else {
      // 通用命名
      filePath = `photos/其他記錄/${dateStr}`
      fileName = `${timeStr}_拍攝記錄.${fileExtension}`
    }
    
    const fullPath = `${filePath}/${fileName}`
    
    console.log(`📷 正在上傳照片到 Firebase Storage: ${fullPath}`)
    
    // 創建 Storage 引用
    const storageRef = ref(firebaseStorage, fullPath)
    
    // 上傳檔案
    const snapshot = await uploadBytes(storageRef, file)
    
    // 獲取下載 URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    console.log(`✅ 照片上傳成功: ${fileName}`)
    return downloadURL
    
  } catch (error) {
    console.error('❌ Firebase Storage 上傳失敗:', error)
    throw error
  }
}

// 圖片壓縮函數（僅用於本地存儲時的回退）
const compressImage = async (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // 計算縮放比例
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // 繪製壓縮後的圖片
      ctx?.drawImage(img, 0, 0, width, height)
      
      // 轉換為 Base64
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedDataUrl)
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
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

  // 照片上傳 - 優先使用 Firebase Storage，回退到本地存儲
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
    }
  ): Promise<string> => {
    // 優先使用 Firebase Storage
    if (isFirebaseConfigured() && storage) {
      try {
        console.log('☁️ 使用 Firebase Storage 上傳照片...')
        return await uploadPhotoToFirebaseStorage(file, path, options)
      } catch (error) {
        console.warn('Firebase Storage 上傳失敗，回退到本地存儲:', error)
        // 回退到本地存儲
      }
    }
    
    // 回退到本地存儲（Base64 格式）
    console.log('💾 使用本地存儲照片（Base64 格式）...')
    
    try {
      // 壓縮圖片以減少存儲空間和避免 Firebase 1MB 限制
      const compressedImage = await compressImage(file, 800, 600, 0.7)
      
      // 檢查壓縮後的大小
      const sizeInBytes = compressedImage.length * 0.75 // Base64 編碼大約是原始大小的 4/3
      const sizeInKB = sizeInBytes / 1024
      
      console.log(`📷 圖片已壓縮：${Math.round(sizeInKB)} KB`)
      
      if (sizeInKB > 900) {
        console.warn('⚠️ 圖片仍然較大，進行二次壓縮...')
        // 如果還是太大，進行二次壓縮
        return await compressImage(file, 600, 400, 0.5)
      }
      
      return compressedImage
    } catch (error) {
      console.error('❌ 圖片壓縮失敗，使用原始 Base64:', error)
      
      // 如果壓縮失敗，回退到原始 Base64（但這可能會超過 Firebase 限制）
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          const sizeInBytes = result.length * 0.75
          const sizeInKB = sizeInBytes / 1024
          
          if (sizeInKB > 1000) {
            reject(new Error(`圖片太大 (${Math.round(sizeInKB)} KB)，請選擇較小的圖片文件`))
          } else {
            resolve(result)
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
  },

  // 檢查狀態
  isCloudMode: () => isFirebaseConfigured(),
  
  getStorageInfo: () => {
    const hasFirebase = isFirebaseConfigured()
    const hasStorage = hasFirebase && storage
    
    if (hasFirebase && hasStorage) {
      return {
        mode: 'cloud',
        description: '雲端同步模式 - 數據存儲在Firebase，照片存儲在Firebase Storage'
      }
    } else if (hasFirebase) {
      return {
        mode: 'hybrid',
        description: '混合模式 - 數據存儲在Firebase，照片壓縮存儲在Firestore'
      }
    }
    return {
      mode: 'local',
      description: '本地存儲模式 - 數據存儲在瀏覽器中'
    }
  },

  // 檢查存儲狀態
  checkStorageStatus: async () => {
    const hasFirebase = isFirebaseConfigured()
    const hasStorage = hasFirebase && storage
    
    if (hasFirebase && hasStorage) {
      return { 
        configured: true, 
        connected: true, 
        error: null,
        storageType: 'Firebase Storage'
      }
    } else if (hasFirebase) {
      return { 
        configured: true, 
        connected: true, 
        error: 'Firebase Storage 未配置，照片將壓縮存儲在 Firestore',
        storageType: 'Firestore (Base64)'
      }
    } else {
      return { 
        configured: false, 
        connected: false, 
        error: 'Firebase 未配置，僅支援本地存儲',
        storageType: 'Local Storage'
      }
    }
  }
}

// 導出類型
export type { Project, PersonalRecord, CoordinatorRecord } 