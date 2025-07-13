'use client'

import { useState, useEffect } from 'react'
import { 
  Camera, 
  Download, 
  Eye, 
  Calendar,
  User,
  Folder,
  Image,
  ExternalLink,
  RefreshCw,
  Filter,
  Search,
  Grid,
  List
} from 'lucide-react'
import { storage } from '@/lib/firebase'
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage'
import JSZip from 'jszip'
import { storageAdapter, type PersonalRecord, type CoordinatorRecord } from '@/lib/storage-adapter'

interface PhotoItem {
  name: string
  url: string
  fullPath: string
  projectName?: string
  recordType?: 'personal' | 'coordinator'
  userName?: string
  date?: string
  category?: string
  size?: number
  lastModified?: Date
}

interface PhotoManagerProps {
  projects?: Array<{ id?: string; name: string }>
  selectedProject?: string | null
}

export default function PhotoManager({ projects = [], selectedProject }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // 批量下載狀態
  const [isBatchDownloading, setIsBatchDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadStatus, setDownloadStatus] = useState('')
  
  // 篩選選項
  const [filterType, setFilterType] = useState<'all' | 'personal' | 'coordinator'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    if (storage) {
      loadPhotos()
    }
  }, [selectedProject])

  useEffect(() => {
    filterPhotos()
  }, [photos, filterType, searchTerm, selectedDate])

  const parsePhotoPath = (fullPath: string): Partial<PhotoItem> => {
    // 解析路徑：photos/專案名稱/記錄類型/用戶名/日期/檔案名稱
    const parts = fullPath.split('/')
    
    if (parts.length >= 3 && parts[0] === 'photos') {
      const projectName = parts[1]
      const recordTypeRaw = parts[2]
      
      let recordType: 'personal' | 'coordinator' | undefined
      if (recordTypeRaw.includes('個人') || recordTypeRaw.includes('personal')) {
        recordType = 'personal'
      } else if (recordTypeRaw.includes('統整') || recordTypeRaw.includes('coordinator')) {
        recordType = 'coordinator'
      }

      let userName: string | undefined
      let date: string | undefined
      let category: string | undefined

      if (recordType === 'personal' && parts.length >= 4) {
        userName = parts[3]
        if (parts.length >= 5) {
          date = parts[4]
        }
      } else if (recordType === 'coordinator' && parts.length >= 4) {
        date = parts[3]
        // 從檔案名稱中解析分類
        const fileName = parts[parts.length - 1]
        if (fileName.includes('用電')) category = '用電記錄'
        else if (fileName.includes('飲水')) category = '飲水記錄'
        else if (fileName.includes('餐飲') || fileName.includes('餐點')) category = '餐飲記錄'
        else if (fileName.includes('回收')) category = '回收記錄'
      }

      return {
        projectName,
        recordType,
        userName,
        date,
        category
      }
    }

    return {}
  }

  const loadPhotos = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 正在載入照片列表...')
      const allPhotos: PhotoItem[] = []
      
      // 1. 從 Firebase Storage 載入照片
      if (storage) {
        try {
          console.log('📁 檢查 Firebase Storage...')
          let basePath = 'photos/'
          if (selectedProject && projects.length > 0) {
            const project = projects.find(p => p.id && p.id === selectedProject)
            if (project) {
              basePath = `photos/${project.name}/`
            }
          }

          const photosRef = ref(storage, basePath)
          const result = await listAll(photosRef)
          
          const photoPromises: Promise<PhotoItem>[] = []

          // 遞歸函數來處理所有文件夾
          const processFolder = async (folderRef: any): Promise<void> => {
            const folderResult = await listAll(folderRef)
            
            // 處理當前文件夾中的圖片
            for (const itemRef of folderResult.items) {
              const promise = (async (): Promise<PhotoItem> => {
                const [url, metadata] = await Promise.all([
                  getDownloadURL(itemRef),
                  getMetadata(itemRef).catch(() => null)
                ])

                const parsedInfo = parsePhotoPath(itemRef.fullPath)

                return {
                  name: itemRef.name,
                  url,
                  fullPath: itemRef.fullPath,
                  size: metadata?.size,
                  lastModified: metadata?.timeCreated ? new Date(metadata.timeCreated) : undefined,
                  ...parsedInfo
                }
              })()
              
              photoPromises.push(promise)
            }

            // 遞歸處理子文件夾
            for (const prefixRef of folderResult.prefixes) {
              await processFolder(prefixRef)
            }
          }

          // 處理根目錄的文件
          for (const itemRef of result.items) {
            const promise = (async (): Promise<PhotoItem> => {
              const [url, metadata] = await Promise.all([
                getDownloadURL(itemRef),
                getMetadata(itemRef).catch(() => null)
              ])

              const parsedInfo = parsePhotoPath(itemRef.fullPath)

              return {
                name: itemRef.name,
                url,
                fullPath: itemRef.fullPath,
                size: metadata?.size,
                lastModified: metadata?.timeCreated ? new Date(metadata.timeCreated) : undefined,
                ...parsedInfo
              }
            })()
            
            photoPromises.push(promise)
          }

          // 遞歸處理所有子文件夾
          for (const prefixRef of result.prefixes) {
            await processFolder(prefixRef)
          }

          const storagePhotos = await Promise.all(photoPromises)
          allPhotos.push(...storagePhotos)
          console.log(`✅ Firebase Storage 載入了 ${storagePhotos.length} 張照片`)
          
        } catch (error) {
          console.warn('Firebase Storage 載入失敗:', error)
        }
      }

      // 2. 從 Firestore 記錄中載入 Base64 照片
      try {
        console.log('🗄️ 檢查 Firestore 記錄...')
        const personalRecords = await storageAdapter.getPersonalRecords(selectedProject || undefined)
        const coordinatorRecords = await storageAdapter.getCoordinatorRecords(selectedProject || undefined)

        // 處理個人記錄照片
        personalRecords.forEach((record: PersonalRecord) => {
          if (record.departurePhotoUrl && record.departurePhotoUrl.startsWith('data:')) {
            allPhotos.push({
              name: `${record.name}_去程照片_${record.date}.jpg`,
              url: record.departurePhotoUrl,
              fullPath: `firestore/個人記錄/${record.name}/${record.date}/去程照片.jpg`,
              projectName: record.projectName,
              recordType: 'personal',
              userName: record.name,
              date: record.date,
              size: Math.round(record.departurePhotoUrl.length * 0.75), // 估算大小
              lastModified: record.createdAt?.toDate ? record.createdAt.toDate() : undefined
            })
          }
          
          if (record.returnPhotoUrl && record.returnPhotoUrl.startsWith('data:')) {
            allPhotos.push({
              name: `${record.name}_回程照片_${record.date}.jpg`,
              url: record.returnPhotoUrl,
              fullPath: `firestore/個人記錄/${record.name}/${record.date}/回程照片.jpg`,
              projectName: record.projectName,
              recordType: 'personal',
              userName: record.name,
              date: record.date,
              size: Math.round(record.returnPhotoUrl.length * 0.75),
              lastModified: record.createdAt?.toDate ? record.createdAt.toDate() : undefined
            })
          }
        })

        // 處理統整記錄照片
        coordinatorRecords.forEach((record: CoordinatorRecord) => {
          if (record.photoUrls && Array.isArray(record.photoUrls)) {
            record.photoUrls.forEach((url: string, index: number) => {
              if (url.startsWith('data:')) {
                allPhotos.push({
                  name: `${record.coordinatorName}_現場照片${index + 1}_${record.date}.jpg`,
                  url: url,
                  fullPath: `firestore/統整員記錄/${record.date}/現場照片${index + 1}.jpg`,
                  projectName: record.projectName,
                  recordType: 'coordinator',
                  userName: record.coordinatorName,
                  date: record.date,
                  category: '現場記錄',
                  size: Math.round(url.length * 0.75),
                  lastModified: record.createdAt?.toDate ? record.createdAt.toDate() : undefined
                })
              }
            })
          }
        })

        console.log(`✅ Firestore 載入了 ${allPhotos.filter(p => p.fullPath.startsWith('firestore')).length} 張照片`)
        
      } catch (error) {
        console.warn('Firestore 記錄載入失敗:', error)
      }

      // 按上傳時間倒序排序
      allPhotos.sort((a, b) => {
        if (a.lastModified && b.lastModified) {
          return b.lastModified.getTime() - a.lastModified.getTime()
        }
        return b.name.localeCompare(a.name)
      })

      setPhotos(allPhotos)
      console.log(`✅ 總共載入了 ${allPhotos.length} 張照片`)
      
    } catch (error) {
      console.error('❌ 載入照片失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterPhotos = () => {
    let filtered = [...photos]

    // 按記錄類型篩選
    if (filterType !== 'all') {
      filtered = filtered.filter(photo => photo.recordType === filterType)
    }

    // 按搜尋詞篩選
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(photo => 
        photo.name.toLowerCase().includes(term) ||
        photo.projectName?.toLowerCase().includes(term) ||
        photo.userName?.toLowerCase().includes(term) ||
        photo.category?.toLowerCase().includes(term)
      )
    }

    // 按日期篩選
    if (selectedDate) {
      filtered = filtered.filter(photo => 
        photo.date === selectedDate ||
        photo.name.includes(selectedDate)
      )
    }

    setFilteredPhotos(filtered)
  }

  const downloadPhoto = async (photo: PhotoItem) => {
    try {
      console.log('📥 下載照片:', photo.name)
      
      const response = await fetch(photo.url)
      const blob = await response.blob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = photo.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('✅ 照片下載成功')
    } catch (error) {
      console.error('❌ 下載失敗:', error)
      alert('下載失敗，請稍後重試')
    }
  }

  const openPhoto = (photo: PhotoItem) => {
    setSelectedPhoto(photo)
    setShowPreview(true)
  }

  const batchDownloadPhotos = async () => {
    if (filteredPhotos.length === 0) {
      alert('沒有照片可下載')
      return
    }

    setIsBatchDownloading(true)
    setDownloadProgress(0)
    setDownloadStatus('準備下載...')

    try {
      const zip = new JSZip()
      
      console.log(`🗂️ 開始批量下載 ${filteredPhotos.length} 張照片...`)
      
      for (let i = 0; i < filteredPhotos.length; i++) {
        const photo = filteredPhotos[i]
        setDownloadStatus(`下載照片 ${i + 1}/${filteredPhotos.length}: ${photo.name}`)
        setDownloadProgress(Math.round((i / filteredPhotos.length) * 80)) // 80% 用於下載照片
        
        try {
          // 下載照片
          const response = await fetch(photo.url)
          const blob = await response.blob()
          
          // 生成保持原始路徑結構的文件路徑
          let zipPath = photo.fullPath
          
          // 如果fullPath是以'photos/'開頭，保持這個結構
          if (!zipPath.startsWith('photos/')) {
            // 如果沒有完整路徑，根據解析的信息重建路徑
            if (photo.projectName) {
              if (photo.recordType === 'personal' && photo.userName) {
                zipPath = `photos/${photo.projectName}/個人記錄/${photo.userName}/${photo.name}`
              } else if (photo.recordType === 'coordinator') {
                const dateStr = photo.date || new Date().toISOString().split('T')[0]
                zipPath = `photos/${photo.projectName}/統整員記錄/${dateStr}/${photo.name}`
              } else {
                zipPath = `photos/${photo.projectName}/其他記錄/${photo.name}`
              }
            } else {
              zipPath = `photos/未分類/${photo.name}`
            }
          }
          
          // 添加到ZIP文件
          zip.file(zipPath, blob)
          
          console.log(`✅ 已添加到ZIP: ${zipPath}`)
          
        } catch (error) {
          console.error(`❌ 下載照片失敗: ${photo.name}`, error)
          // 繼續下載其他照片，不中斷整個過程
        }
      }
      
      setDownloadStatus('正在生成ZIP文件...')
      setDownloadProgress(90)
      
      // 生成ZIP文件
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata) => {
        // 更新壓縮進度
        const progress = 90 + Math.round(metadata.percent / 10)
        setDownloadProgress(progress)
      })
      
      setDownloadStatus('準備下載ZIP文件...')
      setDownloadProgress(100)
      
      // 創建下載鏈接
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      
      // 生成有意義的文件名
      const timestamp = new Date().toISOString().split('T')[0]
      let filename = `拍攝照片_${timestamp}.zip`
      
      if (selectedProject && projects.length > 0) {
        const project = projects.find(p => p.id && p.id === selectedProject)
        if (project) {
          filename = `${project.name}_拍攝照片_${timestamp}.zip`
        }
      }
      
      if (filterType !== 'all') {
        const typeText = filterType === 'personal' ? '個人記錄' : '統整記錄'
        filename = filename.replace('.zip', `_${typeText}.zip`)
      }
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`✅ 批量下載完成: ${filename}`)
      setDownloadStatus(`下載完成！文件：${filename}`)
      
      // 3秒後清除狀態
      setTimeout(() => {
        setDownloadStatus('')
        setDownloadProgress(0)
      }, 3000)
      
    } catch (error) {
      console.error('❌ 批量下載失敗:', error)
      setDownloadStatus('下載失敗，請稍後重試')
      
      setTimeout(() => {
        setDownloadStatus('')
        setDownloadProgress(0)
      }, 3000)
    } finally {
      setIsBatchDownloading(false)
    }
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '未知大小'
    const kb = bytes / 1024
    const mb = kb / 1024
    
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`
    } else {
      return `${kb.toFixed(1)} KB`
    }
  }

  const formatDate = (date?: Date): string => {
    if (!date) return '未知日期'
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRecordTypeText = (type?: string): string => {
    switch (type) {
      case 'personal': return '個人記錄'
      case 'coordinator': return '統整記錄'
      default: return '未分類'
    }
  }

  const getRecordTypeColor = (type?: string): string => {
    switch (type) {
      case 'personal': return 'bg-blue-100 text-blue-800'
      case 'coordinator': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!storage) {
    return (
      <div className="text-center py-8">
        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Firebase Storage 未配置</p>
        <p className="text-sm text-gray-500">照片管理功能不可用</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 工具列 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            照片管理
          </h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            共 {filteredPhotos.length} 張照片
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={batchDownloadPhotos}
            disabled={isBatchDownloading || filteredPhotos.length === 0}
            className="btn-primary text-sm py-2 px-3 flex items-center disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1" />
            {isBatchDownloading ? '下載中...' : `打包下載 (${filteredPhotos.length})`}
          </button>
          
          <button
            onClick={loadPhotos}
            disabled={isLoading}
            className="btn-secondary text-sm py-2 px-3 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            重新載入
          </button>
          
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="btn-secondary text-sm py-2 px-3 flex items-center"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              搜尋
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋照片名稱、專案、用戶..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              記錄類型
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">所有類型</option>
              <option value="personal">個人記錄</option>
              <option value="coordinator">統整記錄</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              日期
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* 批量下載進度 */}
      {isBatchDownloading && (
        <div className="card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                批量下載進行中...
              </h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {downloadProgress}%
              </span>
            </div>
            
            {/* 進度條 */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            
            {/* 狀態文字 */}
            {downloadStatus && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {downloadStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 載入狀態 */}
      {isLoading && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">載入照片中...</p>
        </div>
      )}

      {/* 照片列表 */}
      {!isLoading && filteredPhotos.length === 0 && (
        <div className="text-center py-8">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {photos.length === 0 ? '尚無照片' : '沒有符合篩選條件的照片'}
          </p>
        </div>
      )}

      {/* 網格視圖 */}
      {!isLoading && filteredPhotos.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredPhotos.map((photo, index) => (
            <div key={index} className="card p-0 overflow-hidden group">
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => openPhoto(photo)}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadPhoto(photo)
                    }}
                    className="bg-white/80 hover:bg-white p-1 rounded-full shadow"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                {photo.recordType && (
                  <div className="absolute bottom-2 left-2">
                    <span className={`text-xs px-2 py-1 rounded ${getRecordTypeColor(photo.recordType)}`}>
                      {getRecordTypeText(photo.recordType)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {photo.name}
                </p>
                {photo.projectName && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {photo.projectName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 列表視圖 */}
      {!isLoading && filteredPhotos.length > 0 && viewMode === 'list' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    照片
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    專案
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    類型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    用戶
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    大小
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPhotos.map((photo, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-10 h-10 object-cover rounded cursor-pointer"
                          onClick={() => openPhoto(photo)}
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {photo.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {photo.projectName || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${getRecordTypeColor(photo.recordType)}`}>
                        {getRecordTypeText(photo.recordType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {photo.userName || photo.category || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(photo.size)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(photo.lastModified)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openPhoto(photo)}
                          className="text-blue-600 hover:text-blue-900"
                          title="預覽"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadPhoto(photo)}
                          className="text-green-600 hover:text-green-900"
                          title="下載"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(photo.url, '_blank')}
                          className="text-purple-600 hover:text-purple-900"
                          title="在新視窗開啟"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 照片預覽模態框 */}
      {showPreview && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedPhoto.name}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">關閉</span>
                  ✕
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">專案：</span>{selectedPhoto.projectName || '未知'}</p>
                    <p><span className="font-medium">類型：</span>{getRecordTypeText(selectedPhoto.recordType)}</p>
                    <p><span className="font-medium">用戶：</span>{selectedPhoto.userName || selectedPhoto.category || '未知'}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">大小：</span>{formatFileSize(selectedPhoto.size)}</p>
                    <p><span className="font-medium">日期：</span>{formatDate(selectedPhoto.lastModified)}</p>
                    <p><span className="font-medium">路徑：</span>{selectedPhoto.fullPath}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 text-center">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.name}
                className="max-w-full max-h-96 mx-auto rounded"
              />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
              <button
                onClick={() => downloadPhoto(selectedPhoto)}
                className="btn-secondary flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                下載
              </button>
              <button
                onClick={() => window.open(selectedPhoto.url, '_blank')}
                className="btn-primary flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                在新視窗開啟
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 