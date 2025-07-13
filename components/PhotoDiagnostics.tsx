'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Database, 
  Cloud, 
  HardDrive, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { storageAdapter, type PersonalRecord, type CoordinatorRecord } from '@/lib/storage-adapter'
import { storage } from '@/lib/firebase'
import { ref, listAll } from 'firebase/storage'

interface StorageDiagnostics {
  localStoragePhotos: number
  firestorePhotos: number
  firebaseStoragePhotos: number
  totalRecordsWithPhotos: number
  inconsistentPhotos: string[]
}

export default function PhotoDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<StorageDiagnostics | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState('')

  const runDiagnostics = async () => {
    setIsScanning(true)
    setScanProgress('開始掃描照片存儲...')
    
    try {
      const result: StorageDiagnostics = {
        localStoragePhotos: 0,
        firestorePhotos: 0,
        firebaseStoragePhotos: 0,
        totalRecordsWithPhotos: 0,
        inconsistentPhotos: []
      }

      // 1. 檢查本地存儲
      setScanProgress('檢查本地存儲...')
      const localPersonalRecords = JSON.parse(localStorage.getItem('personalRecords') || '[]')
      const localCoordinatorRecords = JSON.parse(localStorage.getItem('coordinatorRecords') || '[]')
      
      localPersonalRecords.forEach((record: any) => {
        if (record.departurePhoto && record.departurePhoto.startsWith('data:')) result.localStoragePhotos++
        if (record.returnPhoto && record.returnPhoto.startsWith('data:')) result.localStoragePhotos++
      })
      
      localCoordinatorRecords.forEach((record: any) => {
        if (record.photoUrls && Array.isArray(record.photoUrls)) {
          record.photoUrls.forEach((url: string) => {
            if (url.startsWith('data:')) result.localStoragePhotos++
          })
        }
      })

      // 2. 檢查 Firestore 記錄
      setScanProgress('檢查 Firestore 記錄...')
      try {
        const personalRecords = await storageAdapter.getPersonalRecords()
        const coordinatorRecords = await storageAdapter.getCoordinatorRecords()
        
        personalRecords.forEach((record: PersonalRecord) => {
          if (record.departurePhotoUrl) {
            result.totalRecordsWithPhotos++
            if (record.departurePhotoUrl.startsWith('data:')) {
              result.firestorePhotos++
            } else if (record.departurePhotoUrl.includes('firebasestorage.googleapis.com')) {
              result.inconsistentPhotos.push(`個人記錄-${record.name}-去程照片: ${record.departurePhotoUrl}`)
            }
          }
          if (record.returnPhotoUrl) {
            result.totalRecordsWithPhotos++
            if (record.returnPhotoUrl.startsWith('data:')) {
              result.firestorePhotos++
            } else if (record.returnPhotoUrl.includes('firebasestorage.googleapis.com')) {
              result.inconsistentPhotos.push(`個人記錄-${record.name}-回程照片: ${record.returnPhotoUrl}`)
            }
          }
        })

        coordinatorRecords.forEach((record: CoordinatorRecord) => {
          if (record.photoUrls && Array.isArray(record.photoUrls)) {
            record.photoUrls.forEach((url: string, index: number) => {
              result.totalRecordsWithPhotos++
              if (url.startsWith('data:')) {
                result.firestorePhotos++
              } else if (url.includes('firebasestorage.googleapis.com')) {
                result.inconsistentPhotos.push(`統整記錄-${record.coordinatorName}-照片${index + 1}: ${url}`)
              }
            })
          }
        })
      } catch (error) {
        console.warn('無法檢查 Firestore 記錄:', error)
      }

      // 3. 檢查 Firebase Storage
      setScanProgress('檢查 Firebase Storage...')
      if (storage) {
        try {
          const photosRef = ref(storage, 'photos/')
          const result_storage = await listAll(photosRef)
          
          const countPhotosRecursively = async (folderRef: any): Promise<number> => {
            const folderResult = await listAll(folderRef)
            let count = folderResult.items.length
            
            for (const prefixRef of folderResult.prefixes) {
              count += await countPhotosRecursively(prefixRef)
            }
            
            return count
          }
          
          result.firebaseStoragePhotos = result_storage.items.length
          for (const prefixRef of result_storage.prefixes) {
            result.firebaseStoragePhotos += await countPhotosRecursively(prefixRef)
          }
        } catch (error) {
          console.warn('無法檢查 Firebase Storage:', error)
        }
      }

      setScanProgress('掃描完成！')
      setDiagnostics(result)
    } catch (error) {
      console.error('診斷失敗:', error)
      setScanProgress('診斷失敗，請稍後重試')
    } finally {
      setIsScanning(false)
    }
  }

  const cleanupInconsistentPhotos = async () => {
    if (!diagnostics || diagnostics.inconsistentPhotos.length === 0) return
    
    const confirmCleanup = confirm(
      `發現 ${diagnostics.inconsistentPhotos.length} 個指向已刪除 Firebase Storage 照片的記錄。\n\n` +
      '是否要清理這些無效的照片引用？\n\n' +
      '注意：這將會移除記錄中的照片URL，但不會刪除記錄本身。'
    )
    
    if (!confirmCleanup) return

    setScanProgress('正在清理無效照片引用...')
    
    try {
      // 這裡需要實現清理邏輯
      // 由於涉及到修改記錄，需要謹慎處理
      alert('清理功能將在下一版本實現，目前請手動處理')
    } catch (error) {
      console.error('清理失敗:', error)
      alert('清理失敗，請稍後重試')
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2" />
          照片存儲診斷
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            檢查照片在不同存儲位置的分佈情況，幫助解決同步問題。
          </p>
          
          <button
            onClick={runDiagnostics}
            disabled={isScanning}
            className="btn-primary flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? '掃描中...' : '開始診斷'}
          </button>
          
          {scanProgress && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {scanProgress}
            </p>
          )}
        </div>
      </div>

      {diagnostics && (
        <div className="space-y-4">
          {/* 存儲統計 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
              <div className="flex items-center">
                <HardDrive className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">本地存儲照片</p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-300">
                    {diagnostics.localStoragePhotos}
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Firestore 照片</p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-300">
                    {diagnostics.firestorePhotos}
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
              <div className="flex items-center">
                <Cloud className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Firebase Storage</p>
                  <p className="text-xl font-bold text-purple-900 dark:text-purple-300">
                    {diagnostics.firebaseStoragePhotos}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 問題警告 */}
          {diagnostics.inconsistentPhotos.length > 0 && (
            <div className="card bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
              <div className="flex items-start">
                <AlertTriangle className="w-6 h-6 text-orange-600 mr-3 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-900 dark:text-orange-300 mb-2">
                    發現同步問題
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">
                    有 {diagnostics.inconsistentPhotos.length} 個記錄指向已刪除的 Firebase Storage 照片。
                    這就是為什麼您在 Firebase 中刪除照片後，dashboard 中仍能看到照片的原因。
                  </p>
                  
                  <div className="space-y-2 mb-3">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-orange-800 dark:text-orange-300 font-medium">
                        查看詳細列表
                      </summary>
                      <div className="mt-2 space-y-1 text-orange-600 dark:text-orange-400">
                        {diagnostics.inconsistentPhotos.slice(0, 5).map((photo, index) => (
                          <div key={index} className="text-xs font-mono bg-orange-100 dark:bg-orange-800/30 p-2 rounded">
                            {photo}
                          </div>
                        ))}
                        {diagnostics.inconsistentPhotos.length > 5 && (
                          <p className="text-xs">... 還有 {diagnostics.inconsistentPhotos.length - 5} 個</p>
                        )}
                      </div>
                    </details>
                  </div>

                  <button
                    onClick={cleanupInconsistentPhotos}
                    className="bg-orange-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-orange-700 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    清理無效引用
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 建議 */}
          <div className="card bg-gray-50 dark:bg-gray-800/50">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              解決方案建議
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                <span>
                  <strong>總照片數：</strong> {diagnostics.localStoragePhotos + diagnostics.firestorePhotos + diagnostics.firebaseStoragePhotos} 張
                </span>
              </div>
              
              {diagnostics.firebaseStoragePhotos === 0 && diagnostics.firestorePhotos > 0 && (
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mr-2 mt-0.5" />
                  <span>
                    您的照片主要存儲在 Firestore 中（Base64格式），照片管理功能目前只顯示 Firebase Storage 的照片。
                  </span>
                </div>
              )}
              
              {diagnostics.inconsistentPhotos.length > 0 && (
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mr-2 mt-0.5" />
                  <span>
                    建議清理無效的照片引用以保持數據一致性。
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 