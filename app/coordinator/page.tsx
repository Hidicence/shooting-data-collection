'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, Droplets, UtensilsCrossed, Recycle, CheckCircle, AlertCircle, Folder } from 'lucide-react'
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
    notes: '',
    projectId: null,
    projectName: ''
  })
  
  const [currentProject, setCurrentProject] = useState<any>(null)
  
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const handleRecycleTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      recycleTypes: checked 
        ? [...prev.recycleTypes, type]
        : prev.recycleTypes.filter(t => t !== type)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.coordinatorName.trim()) newErrors.coordinatorName = '請輸入統整人員姓名'
    if (!formData.location.trim()) newErrors.location = '請輸入拍攝地點'
    
    // 驗證數字欄位
    const numberFields = [
      'electricityUsage', 'electricityStartReading', 'electricityEndReading',
      'waterWeight', 'waterBottleCount', 'foodWasteWeight', 'mealCount', 'recycleWeight'
    ]
    
    numberFields.forEach(field => {
      const value = formData[field as keyof CoordinatorData] as string
      if (value && isNaN(Number(value))) {
        newErrors[field] = '請輸入有效的數字'
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
        projectName: formData.projectName
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
      notes: '',
      projectId: currentProject?.id || null,
      projectName: currentProject?.name || ''
    })
    setIsSubmitted(false)
    setErrors({})
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="card text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">提交成功！</h2>
          <p className="text-gray-600 mb-6">現場數據已成功記錄</p>
          <div className="space-y-3">
            <button onClick={resetForm} className="btn-primary w-full">
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
              <label className="form-label">統整人員姓名 *</label>
              <input
                type="text"
                name="coordinatorName"
                value={formData.coordinatorName}
                onChange={handleInputChange}
                className={`form-input ${errors.coordinatorName ? 'border-red-500' : ''}`}
                placeholder="請輸入統整人員姓名"
              />
              {errors.coordinatorName && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.coordinatorName}
                </p>
              )}
            </div>

            <div>
              <label className="form-label">日期 *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">拍攝地點 *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`form-input ${errors.location ? 'border-red-500' : ''}`}
                placeholder="例：攝影棚A、戶外場景等"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 用電數據 */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Zap className="w-5 h-5 text-yellow-600 mr-2" />
            <h2 className="text-lg font-semibold">用電數據</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">總用電度數 (kWh)</label>
              <input
                type="number"
                name="electricityUsage"
                value={formData.electricityUsage}
                onChange={handleInputChange}
                className={`form-input ${errors.electricityUsage ? 'border-red-500' : ''}`}
                placeholder="例：15.5"
                step="0.1"
              />
              {errors.electricityUsage && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.electricityUsage}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">開始讀數</label>
                <input
                  type="number"
                  name="electricityStartReading"
                  value={formData.electricityStartReading}
                  onChange={handleInputChange}
                  className={`form-input ${errors.electricityStartReading ? 'border-red-500' : ''}`}
                  placeholder="例：1000"
                  step="0.1"
                />
              </div>
              <div>
                <label className="form-label">結束讀數</label>
                <input
                  type="number"
                  name="electricityEndReading"
                  value={formData.electricityEndReading}
                  onChange={handleInputChange}
                  className={`form-input ${errors.electricityEndReading ? 'border-red-500' : ''}`}
                  placeholder="例：1015.5"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 飲水數據 */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Droplets className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">飲水數據</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">飲水重量 (公斤)</label>
              <input
                type="number"
                name="waterWeight"
                value={formData.waterWeight}
                onChange={handleInputChange}
                className={`form-input ${errors.waterWeight ? 'border-red-500' : ''}`}
                placeholder="例：50"
                step="0.1"
              />
              {errors.waterWeight && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.waterWeight}
                </p>
              )}
            </div>

            <div>
              <label className="form-label">瓶裝水數量 (瓶)</label>
              <input
                type="number"
                name="waterBottleCount"
                value={formData.waterBottleCount}
                onChange={handleInputChange}
                className={`form-input ${errors.waterBottleCount ? 'border-red-500' : ''}`}
                placeholder="例：30"
              />
            </div>
          </div>
        </div>

        {/* 餐點數據 */}
        <div className="card">
          <div className="flex items-center mb-4">
            <UtensilsCrossed className="w-5 h-5 text-orange-600 mr-2" />
            <h2 className="text-lg font-semibold">餐點數據</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">廚餘重量 (公斤)</label>
              <input
                type="number"
                name="foodWasteWeight"
                value={formData.foodWasteWeight}
                onChange={handleInputChange}
                className={`form-input ${errors.foodWasteWeight ? 'border-red-500' : ''}`}
                placeholder="例：5.2"
                step="0.1"
              />
              {errors.foodWasteWeight && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.foodWasteWeight}
                </p>
              )}
            </div>

            <div>
              <label className="form-label">用餐人次</label>
              <input
                type="number"
                name="mealCount"
                value={formData.mealCount}
                onChange={handleInputChange}
                className={`form-input ${errors.mealCount ? 'border-red-500' : ''}`}
                placeholder="例：25"
              />
            </div>
          </div>
        </div>

        {/* 回收數據 */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Recycle className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold">回收數據</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">回收重量 (公斤)</label>
              <input
                type="number"
                name="recycleWeight"
                value={formData.recycleWeight}
                onChange={handleInputChange}
                className={`form-input ${errors.recycleWeight ? 'border-red-500' : ''}`}
                placeholder="例：8.5"
                step="0.1"
              />
              {errors.recycleWeight && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.recycleWeight}
                </p>
              )}
            </div>

            <div>
              <label className="form-label">回收類型</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {recycleOptions.map(option => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recycleTypes.includes(option)}
                      onChange={(e) => handleRecycleTypeChange(option, e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 備註 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">備註</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="form-input"
            placeholder="其他補充說明（選填）"
          />
        </div>

        {/* 提交按鈕 */}
        <div className="pb-6">
          <button type="submit" className="btn-primary w-full">
            提交現場數據
          </button>
        </div>
      </form>
    </div>
  )
} 