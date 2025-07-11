'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, Droplets, UtensilsCrossed, Recycle, CheckCircle, AlertCircle, Folder, Camera, Upload, X, ChevronDown, ChevronUp } from 'lucide-react'
import { storageAdapter, type CoordinatorRecord } from '@/lib/storage-adapter'
import FormInput from '@/components/FormInput'
import FormTextarea from '@/components/FormTextarea'

interface CoordinatorData {
  date: string
  coordinatorName: string
  location: string
  
  // 用電數據
  electricityUsage: string
  electricityStartReading: string
  electricityEndReading: string
  electricityPhotos: string[]
  
  // 飲水數據
  waterWeight: string
  waterBottleCount: string
  waterPhotos: string[]
  
  // 餐點數據
  foodWasteWeight: string
  mealCount: string
  mealPhotos: string[]
  
  // 回收數據
  recycleWeight: string
  recycleTypes: string[]
  recyclePhotos: string[]
  
  notes: string
  projectId: string | null
  projectName: string
}

type DataCategory = 'electricity' | 'water' | 'meal' | 'recycle'

export default function CoordinatorPage() {
  const [formData, setFormData] = useState<CoordinatorData>({
    date: new Date().toISOString().split('T')[0],
    coordinatorName: '',
    location: '',
    electricityUsage: '',
    electricityStartReading: '',
    electricityEndReading: '',
    electricityPhotos: [],
    waterWeight: '',
    waterBottleCount: '',
    waterPhotos: [],
    foodWasteWeight: '',
    mealCount: '',
    mealPhotos: [],
    recycleWeight: '',
    recycleTypes: [],
    recyclePhotos: [],
    notes: '',
    projectId: null,
    projectName: ''
  })
  
  const [currentProject, setCurrentProject] = useState<any>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedCards, setExpandedCards] = useState<Set<DataCategory>>(new Set())
  
  // 為每個分類創建獨立的文件輸入引用
  const electricityInputRef = useRef<HTMLInputElement>(null)
  const waterInputRef = useRef<HTMLInputElement>(null)
  const mealInputRef = useRef<HTMLInputElement>(null)
  const recycleInputRef = useRef<HTMLInputElement>(null)

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

  const toggleCard = (category: DataCategory) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
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

  // 通用照片處理函數
  const handlePhotoUpload = async (files: FileList, category: DataCategory) => {
    if (files.length === 0) return

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
        [`${category}Photos`]: [...(prev[`${category}Photos` as keyof CoordinatorData] as string[]), ...newPhotos]
      }))
      
      console.log(`✅ ${category} 照片上傳成功:`, newPhotos.length, '張照片')
    } catch (error) {
      console.error(`❌ ${category} 照片上傳失敗:`, error)
    }
  }

  const removePhoto = (category: DataCategory, index: number) => {
    setFormData(prev => ({
      ...prev,
      [`${category}Photos`]: (prev[`${category}Photos` as keyof CoordinatorData] as string[]).filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      console.log('🔄 正在保存統整員記錄...')
      
      // 合併所有照片到一個數組中
      const allPhotos = [
        ...formData.electricityPhotos,
        ...formData.waterPhotos,
        ...formData.mealPhotos,
        ...formData.recyclePhotos
      ]
      
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
        // 暫時將所有照片合併到 photoUrls 中
        photoUrls: allPhotos
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
      electricityPhotos: [],
      waterWeight: '',
      waterBottleCount: '',
      waterPhotos: [],
      foodWasteWeight: '',
      mealCount: '',
      mealPhotos: [],
      recycleWeight: '',
      recycleTypes: [],
      recyclePhotos: [],
      notes: '',
      projectId: currentProject?.id || null,
      projectName: currentProject?.name || ''
    })
    setIsSubmitted(false)
    setErrors({})
    setExpandedCards(new Set())
  }

  // 數據卡片配置
  const dataCards = [
    {
      id: 'electricity' as DataCategory,
      title: '用電數據',
      icon: <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      darkBorderColor: 'border-yellow-700',
      darkBgColor: 'bg-yellow-900/20',
      accentColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      id: 'water' as DataCategory,
      title: '飲水數據',
      icon: <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      darkBorderColor: 'border-blue-700',
      darkBgColor: 'bg-blue-900/20',
      accentColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'meal' as DataCategory,
      title: '餐點數據',
      icon: <UtensilsCrossed className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      darkBorderColor: 'border-orange-700',
      darkBgColor: 'bg-orange-900/20',
      accentColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      id: 'recycle' as DataCategory,
      title: '回收數據',
      icon: <Recycle className="w-6 h-6 text-green-600 dark:text-green-400" />,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      darkBorderColor: 'border-green-700',
      darkBgColor: 'bg-green-900/20',
      accentColor: 'text-green-600 dark:text-green-400'
    }
  ]

  const renderPhotoSection = (category: DataCategory, inputRef: React.RefObject<HTMLInputElement>, color: string) => {
    const photos = formData[`${category}Photos` as keyof CoordinatorData] as string[]
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">現場照片</h4>
        
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handlePhotoUpload(e.target.files, category)}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-${color}-400 dark:hover:border-${color}-500 transition-colors flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 hover:text-${color}-600 dark:hover:text-${color}-400`}
        >
          <Upload className="w-6 h-6 mb-2" />
          <span className="text-sm">點擊上傳照片</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            可選擇多張照片，支援 JPG、PNG 格式
          </span>
        </button>

        {photos.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              已上傳照片 ({photos.length} 張)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`${category} 照片 ${index + 1}`}
                    className="w-full h-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(category, index)}
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
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="card max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">提交成功！</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">統整數據已成功記錄</p>
          <div className="space-y-3">
            <button
              onClick={resetForm}
              className="btn-primary w-full"
            >
              記錄新的數據
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
          <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">統整人員記錄</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">記錄現場整體數據</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本資訊 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">基本資訊</h2>
          
          <div className="space-y-4">
            {/* 當前專案顯示 */}
            {currentProject ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center">
                  <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-200">當前專案</span>
                </div>
                <p className="text-blue-800 dark:text-blue-300 font-medium">{currentProject.name}</p>
                <p className="text-blue-700 dark:text-blue-400 text-sm">{currentProject.location}</p>
              </div>
            ) : (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-700">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                  <span className="text-sm font-medium text-orange-900 dark:text-orange-200">未選擇專案</span>
                </div>
                <p className="text-orange-800 dark:text-orange-300 text-sm">請先到專案管理建立或選擇專案</p>
                <Link href="/projects" className="text-orange-600 dark:text-orange-400 text-sm underline">
                  前往專案管理
                </Link>
              </div>
            )}

            <FormInput
              label="日期"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required={true}
            />

            <FormInput
              label="統整人員姓名"
              name="coordinatorName"
              value={formData.coordinatorName}
              onChange={handleInputChange}
              error={errors.coordinatorName}
              placeholder="輸入統整人員姓名"
              required={true}
            />

            <FormInput
              label="拍攝地點"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              error={errors.location}
              placeholder="輸入拍攝地點"
              required={true}
            />
          </div>
        </div>

        {/* 數據收集卡片 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">數據收集</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">點擊下方卡片來記錄相應的數據</p>
          
          {dataCards.map((card) => (
            <div key={card.id} className={`border rounded-lg ${card.borderColor} dark:${card.darkBorderColor} ${expandedCards.has(card.id) ? `${card.bgColor} dark:${card.darkBgColor}` : 'bg-white dark:bg-gray-800'} transition-colors`}>
              {/* 卡片頭部 - 可點選 */}
              <button
                type="button"
                onClick={() => toggleCard(card.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  {card.icon}
                  <h3 className={`ml-3 font-semibold ${card.accentColor}`}>{card.title}</h3>
                </div>
                {expandedCards.has(card.id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                )}
              </button>

              {/* 卡片內容 - 展開時顯示 */}
              {expandedCards.has(card.id) && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-4 space-y-4">
                    {/* 用電數據 */}
                    {card.id === 'electricity' && (
                      <>
                        <FormInput
                          label="總用電量 (kWh)"
                          name="electricityUsage"
                          type="number"
                          value={formData.electricityUsage}
                          onChange={handleInputChange}
                          placeholder="輸入總用電量"
                          step="0.1"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormInput
                            label="開始讀數"
                            name="electricityStartReading"
                            type="number"
                            value={formData.electricityStartReading}
                            onChange={handleInputChange}
                            placeholder="開始讀數"
                            step="0.1"
                          />
                          <FormInput
                            label="結束讀數"
                            name="electricityEndReading"
                            type="number"
                            value={formData.electricityEndReading}
                            onChange={handleInputChange}
                            placeholder="結束讀數"
                            step="0.1"
                          />
                        </div>
                        {renderPhotoSection('electricity', electricityInputRef, 'yellow')}
                      </>
                    )}

                    {/* 飲水數據 */}
                    {card.id === 'water' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <FormInput
                            label="飲水重量 (kg)"
                            name="waterWeight"
                            type="number"
                            value={formData.waterWeight}
                            onChange={handleInputChange}
                            placeholder="輸入飲水重量"
                            step="0.1"
                          />
                          <FormInput
                            label="瓶數"
                            name="waterBottleCount"
                            type="number"
                            value={formData.waterBottleCount}
                            onChange={handleInputChange}
                            placeholder="輸入瓶數"
                          />
                        </div>
                        {renderPhotoSection('water', waterInputRef, 'blue')}
                      </>
                    )}

                    {/* 餐點數據 */}
                    {card.id === 'meal' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <FormInput
                            label="餐點數量"
                            name="mealCount"
                            type="number"
                            value={formData.mealCount}
                            onChange={handleInputChange}
                            placeholder="輸入餐點數量"
                          />
                          <FormInput
                            label="廚餘重量 (kg)"
                            name="foodWasteWeight"
                            type="number"
                            value={formData.foodWasteWeight}
                            onChange={handleInputChange}
                            placeholder="輸入廚餘重量"
                            step="0.1"
                          />
                        </div>
                        {renderPhotoSection('meal', mealInputRef, 'orange')}
                      </>
                    )}

                    {/* 回收數據 */}
                    {card.id === 'recycle' && (
                      <>
                        <FormInput
                          label="回收重量 (kg)"
                          name="recycleWeight"
                          type="number"
                          value={formData.recycleWeight}
                          onChange={handleInputChange}
                          placeholder="輸入回收重量"
                          step="0.1"
                        />
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            回收類型
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {recycleOptions.map((option) => (
                              <label key={option} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.recycleTypes.includes(option)}
                                  onChange={() => handleRecycleTypeChange(option)}
                                  className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {renderPhotoSection('recycle', recycleInputRef, 'green')}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 備註 */}
        <div className="card">
          <FormTextarea
            label="備註"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
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