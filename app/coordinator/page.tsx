'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, Droplets, UtensilsCrossed, Recycle, CheckCircle, AlertCircle, Folder, Camera, Upload, X } from 'lucide-react'
import { storageAdapter, type CoordinatorRecord } from '@/lib/storage-adapter'

interface CoordinatorData {
  date: string
  coordinatorName: string
  location: string
  
  // 用電數據
  electricityUsage: string
  electricityStartReading: string
  electricityEndReading: string
  
  // 飲水數據
  waterWeight: string
  waterBottleCount: string
  
  // 餐點數據
  foodWasteWeight: string
  mealCount: string
  
  // 回收數據
  recycleWeight: string
  recycleTypes: string[]
  
  // 照片數據 (可選)
  photos: string[]
  
  notes: string
  projectId: string | null
  projectName: string
}

export default function CoordinatorPage() {
  const [formData, setFormData] = useState<CoordinatorData>({
    date: new Date().toISOString().split('T')[0],
    coordinatorName: '',
    location: '',
    electricityUsage: '',
    electricityStartReading: '',
    electricityEndReading: '',
    waterWeight: '',
    waterBottleCount: '',
    foodWasteWeight: '',
    mealCount: '',
    recycleWeight: '',
    recycleTypes: [],
    photos: [],
    notes: '',
    projectId: null,
    projectName: ''
  })
  
  const [currentProject, setCurrentProject] = useState<any>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const recycleOptions = [
    '塑膠瓶', '紙類', '鋁罐', '玻璃', '廢電池', '其他'
  ]

  useEffect(() => {
    // Load current project using storage adapter
    const loadCurrentProject = async () => {
      const currentProjectId = localStorage.getItem('currentProject')
      if (currentProjectId) {
        try {
          console.log('🔄 正在載入當前專案...')
          const projects = await storageAdapter.getProjects()
          const project = projects.find((p: any) => p.id === currentProjectId)
          if (project) {
            console.log('✅ 當前專案載入成功:', project.name)
            setCurrentProject(project)
            setFormData(prev => ({
              ...prev,
              projectId: project.id || null,
              projectName: project.name
            }))
          }
        } catch (error) {
          console.error('❌ 載入當前專案失敗:', error)
        }
      }
    }
    
    loadCurrentProject()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleRecycleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      recycleTypes: prev.recycleTypes.includes(type)
        ? prev.recycleTypes.filter(t => t !== type)
        : [...prev.recycleTypes, type]
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.coordinatorName.trim()) {
      newErrors.coordinatorName = '統整人員姓名為必填項目'
    }

    if (!formData.location.trim()) {
      newErrors.location = '拍攝地點為必填項目'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 照片處理函數
  const handlePhotoUpload = async (files: FileList) => {
    if (files.length === 0) return

    setUploadingPhotos(true)
    try {
      const newPhotos: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // 轉換為 base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
        
        newPhotos.push(base64)
      }
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos]
      }))
      
      console.log('✅ 照片上傳成功:', newPhotos.length, '張照片')
    } catch (error) {
      console.error('❌ 照片上傳失敗:', error)
    } finally {
      setUploadingPhotos(false)
    }
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      console.log('🔄 正在保存統整員記錄...')
      
      // 準備 CoordinatorRecord 數據
      const recordData: Omit<CoordinatorRecord, 'id' | 'createdAt'> = {
        date: formData.date,
        coordinatorName: formData.coordinatorName,
        location: formData.location,
        electricityUsage: formData.electricityUsage,
        electricityStartReading: formData.electricityStartReading,
        electricityEndReading: formData.electricityEndReading,
        waterWeight: formData.waterWeight,
        waterBottleCount: formData.waterBottleCount,
        foodWasteWeight: formData.foodWasteWeight,
        mealCount: formData.mealCount,
        recycleWeight: formData.recycleWeight,
        recycleTypes: formData.recycleTypes,
        notes: formData.notes,
        projectId: formData.projectId || '',
        projectName: formData.projectName,
        // 添加照片 URL 列表
        photoUrls: formData.photos
      }
      
      const savedRecord = await storageAdapter.createCoordinatorRecord(recordData)
      console.log('✅ 統整員記錄保存成功:', savedRecord.id)
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('❌ 統整員記錄保存失敗:', error)
      // 可以在這裡顯示錯誤訊息給用戶
    }
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      coordinatorName: '',
      location: '',
      electricityUsage: '',
      electricityStartReading: '',
      electricityEndReading: '',
      waterWeight: '',
      waterBottleCount: '',
      foodWasteWeight: '',
      mealCount: '',
      recycleWeight: '',
      recycleTypes: [],
      photos: [],
      notes: '',
      projectId: currentProject?.id || null,
      projectName: currentProject?.name || ''
    })
    setIsSubmitted(false)
    setErrors({})
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">提交成功！</h2>
          <p className="text-gray-600 mb-6">統整數據已成功記錄</p>
          <div className="space-y-3">
            <button
              onClick={resetForm}
              className="btn-primary w-full"
            >
              繼續記錄
            </button>
            <Link href="/" className="btn-secondary w-full block text-center">
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center mb-6 pt-4">
        <Link href="/" className="mr-4">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">現場數據統整</h1>
          <p className="text-sm text-gray-600">統整人員數據填寫</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本資訊 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">基本資訊</h2>
          
          <div className="space-y-4">
            {/* 當前專案顯示 */}
            {currentProject ? (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <Folder className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">當前專案</span>
                </div>
                <p className="text-blue-800 font-medium">{currentProject.name}</p>
                <p className="text-blue-700 text-sm">{currentProject.location}</p>
              </div>
            ) : (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-orange-600 mr-2" />
                  <span className="text-sm font-medium text-orange-900">未選擇專案</span>
                </div>
                <p className="text-orange-800 text-sm">請先到專案管理建立或選擇專案</p>
                <Link href="/projects" className="text-orange-600 text-sm underline">
                  前往專案管理
                </Link>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期 *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                統整人員姓名 *
              </label>
              <input
                type="text"
                name="coordinatorName"
                value={formData.coordinatorName}
                onChange={handleInputChange}
                className={`input-field ${errors.coordinatorName ? 'border-red-500' : ''}`}
                placeholder="輸入統整人員姓名"
                required
              />
              {errors.coordinatorName && (
                <p className="text-red-500 text-sm mt-1">{errors.coordinatorName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                拍攝地點 *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`input-field ${errors.location ? 'border-red-500' : ''}`}
                placeholder="輸入拍攝地點"
                required
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* 用電數據 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 text-yellow-600 mr-2" />
            用電數據
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                總用電量 (kWh)
              </label>
              <input
                type="number"
                step="0.1"
                name="electricityUsage"
                value={formData.electricityUsage}
                onChange={handleInputChange}
                className="input-field"
                placeholder="輸入總用電量"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始讀數
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="electricityStartReading"
                  value={formData.electricityStartReading}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="開始讀數"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  結束讀數
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="electricityEndReading"
                  value={formData.electricityEndReading}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="結束讀數"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 飲水數據 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Droplets className="w-5 h-5 text-blue-600 mr-2" />
            飲水數據
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                飲水重量 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="waterWeight"
                value={formData.waterWeight}
                onChange={handleInputChange}
                className="input-field"
                placeholder="輸入飲水重量"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                瓶數
              </label>
              <input
                type="number"
                name="waterBottleCount"
                value={formData.waterBottleCount}
                onChange={handleInputChange}
                className="input-field"
                placeholder="輸入瓶數"
              />
            </div>
          </div>
        </div>

        {/* 餐點數據 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <UtensilsCrossed className="w-5 h-5 text-orange-600 mr-2" />
            餐點數據
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                餐點數量
              </label>
              <input
                type="number"
                name="mealCount"
                value={formData.mealCount}
                onChange={handleInputChange}
                className="input-field"
                placeholder="輸入餐點數量"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                廚餘重量 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="foodWasteWeight"
                value={formData.foodWasteWeight}
                onChange={handleInputChange}
                className="input-field"
                placeholder="輸入廚餘重量"
              />
            </div>
          </div>
        </div>

        {/* 回收數據 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Recycle className="w-5 h-5 text-green-600 mr-2" />
            回收數據
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                回收重量 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="recycleWeight"
                value={formData.recycleWeight}
                onChange={handleInputChange}
                className="input-field"
                placeholder="輸入回收重量"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                回收類型
              </label>
              <div className="grid grid-cols-2 gap-2">
                {recycleOptions.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recycleTypes.includes(option)}
                      onChange={() => handleRecycleTypeChange(option)}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 照片上傳 (可選) */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Camera className="w-5 h-5 text-purple-600 mr-2" />
            現場照片 (可選)
          </h2>
          
          <div className="space-y-4">
            <div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhotos}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors flex flex-col items-center justify-center text-gray-600 hover:text-purple-600"
              >
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">
                  {uploadingPhotos ? '上傳中...' : '點擊上傳現場照片'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  可選擇多張照片，支援 JPG、PNG 格式
                </span>
              </button>
            </div>

            {/* 照片預覽 */}
            {formData.photos.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  已上傳照片 ({formData.photos.length} 張)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`現場照片 ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 備註 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">備註</h2>
          
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            className="input-field"
            placeholder="輸入其他需要記錄的資訊..."
          />
        </div>

        {/* 提交按鈕 */}
        <div className="pb-8">
          <button
            type="submit"
            className="w-full btn-primary py-4 text-lg"
          >
            提交統整數據
          </button>
        </div>
      </form>
    </div>
  )
} 