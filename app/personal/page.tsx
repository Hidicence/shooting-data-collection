'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Upload, CheckCircle, AlertCircle, Folder } from 'lucide-react'
import { storageAdapter, type PersonalRecord } from '@/lib/storage-adapter'
import FormInput from '@/components/FormInput'
import FormTextarea from '@/components/FormTextarea'

interface PersonalData {
  name: string
  date: string
  mileage: string
  startLocation: string
  endLocation: string
  departurePhoto: string | null
  returnPhoto: string | null
  notes: string
  projectId: string | null
  projectName: string
}

export default function PersonalPage() {
  const [formData, setFormData] = useState<PersonalData>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    mileage: '',
    startLocation: '',
    endLocation: '',
    departurePhoto: null,
    returnPhoto: null,
    notes: '',
    projectId: null,
    projectName: ''
  })
  
  const [currentProject, setCurrentProject] = useState<any>(null)
  
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const departureInputRef = useRef<HTMLInputElement>(null)
  const returnInputRef = useRef<HTMLInputElement>(null)

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

  const handlePhotoUpload = async (type: 'departure' | 'return', file: File) => {
    if (!currentProject) {
      console.warn('未選擇專案，照片將存儲為 Base64')
      // 回退到 Base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFormData(prev => ({
          ...prev,
          [type === 'departure' ? 'departurePhoto' : 'returnPhoto']: result
        }))
      }
      reader.readAsDataURL(file)
      return
    }

    try {
      console.log(`🔄 正在上傳${type === 'departure' ? '去程' : '回程'}照片...`)
      
      // 使用智能上傳（優先 Google Drive）
      const photoUrl = await storageAdapter.uploadPhoto(
        file,
        `photos/${currentProject.name}/${formData.name}/${type}/${Date.now()}.jpg`,
        {
          projectName: currentProject.name,
          recordType: 'personal',
          userName: formData.name,
          date: formData.date,
          photoType: type
        }
      )
      
      console.log(`✅ ${type === 'departure' ? '去程' : '回程'}照片上傳成功`)
      
      setFormData(prev => ({
        ...prev,
        [type === 'departure' ? 'departurePhoto' : 'returnPhoto']: photoUrl
      }))
      
    } catch (error) {
      console.error(`❌ ${type === 'departure' ? '去程' : '回程'}照片上傳失敗:`, error)
      
      // 回退到 Base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFormData(prev => ({
          ...prev,
          [type === 'departure' ? 'departurePhoto' : 'returnPhoto']: result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = '請輸入姓名'
    if (!formData.mileage.trim()) newErrors.mileage = '請輸入里程數'
    if (!formData.startLocation.trim()) newErrors.startLocation = '請輸入出發地點'
    if (!formData.endLocation.trim()) newErrors.endLocation = '請輸入目的地點'
    if (!formData.departurePhoto) newErrors.departurePhoto = '請上傳去程照片'
    if (!formData.returnPhoto) newErrors.returnPhoto = '請上傳回程照片'
    
    if (formData.mileage && isNaN(Number(formData.mileage))) {
      newErrors.mileage = '請輸入有效的數字'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔄 表單提交開始...')
    console.log('表單數據:', formData)
    
    const isValid = validateForm()
    console.log('表單驗證結果:', isValid)
    console.log('錯誤列表:', errors)
    
    if (!isValid) {
      console.log('❌ 表單驗證失敗，無法提交')
      // 在手機上顯示第一個錯誤
      const firstError = Object.values(errors)[0]
      if (firstError) {
        alert(`表單驗證失敗：${firstError}`)
      }
      return
    }
    
    try {
      console.log('🔄 正在保存個人記錄...')
      
      // 準備 PersonalRecord 數據
      const recordData: Omit<PersonalRecord, 'id' | 'createdAt'> = {
        name: formData.name,
        date: formData.date,
        mileage: formData.mileage,
        startLocation: formData.startLocation,
        endLocation: formData.endLocation,
        departurePhotoUrl: formData.departurePhoto || '',
        returnPhotoUrl: formData.returnPhoto || '',
        notes: formData.notes,
        projectId: formData.projectId || '',
        projectName: formData.projectName
      }
      
      const savedRecord = await storageAdapter.createPersonalRecord(recordData)
      console.log('✅ 個人記錄保存成功:', savedRecord.id)
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('❌ 個人記錄保存失敗:', error)
      // 可以在這裡顯示錯誤訊息給用戶
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      mileage: '',
      startLocation: '',
      endLocation: '',
      departurePhoto: null,
      returnPhoto: null,
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
          <p className="text-gray-600 mb-6">您的里程數據已成功記錄</p>
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
          <h1 className="text-xl font-bold text-gray-900">個人里程記錄</h1>
          <p className="text-sm text-gray-600">拍攝人員數據填寫</p>
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

            <FormInput
              label="姓名"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              placeholder="請輸入您的姓名"
              required={true}
            />

            <FormInput
              label="日期"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required={true}
            />
          </div>
        </div>

        {/* 行程資訊 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">行程資訊</h2>
          
          <div className="space-y-4">
            <FormInput
              label="總里程數 (公里)"
              name="mileage"
              type="number"
              value={formData.mileage}
              onChange={handleInputChange}
              error={errors.mileage}
              placeholder="例：50"
              step="0.1"
              required={true}
            />

            <FormInput
              label="出發地點"
              name="startLocation"
              value={formData.startLocation}
              onChange={handleInputChange}
              error={errors.startLocation}
              placeholder="例：台北車站"
              required={true}
            />

            <FormInput
              label="目的地點"
              name="endLocation"
              value={formData.endLocation}
              onChange={handleInputChange}
              error={errors.endLocation}
              placeholder="例：拍攝現場"
              required={true}
            />
          </div>
        </div>

        {/* 照片上傳 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">里程證明照片</h2>
          
          <div className="space-y-4">
            {/* 去程照片 */}
            <div>
              <label className="form-label">去程里程照片 *</label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => departureInputRef.current?.click()}
                  className={`w-full p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
                    formData.departurePhoto 
                      ? 'border-green-300 bg-green-50' 
                      : errors.departurePhoto 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">
                    {formData.departurePhoto ? '已上傳去程照片' : '點擊上傳去程里程照片'}
                  </p>
                </button>
                
                <input
                  ref={departureInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhotoUpload('departure', file)
                  }}
                  className="hidden"
                />
                
                {formData.departurePhoto && (
                  <div className="mt-3">
                    <img
                      src={formData.departurePhoto}
                      alt="去程照片"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
                
                {errors.departurePhoto && (
                  <p className="text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.departurePhoto}
                  </p>
                )}
              </div>
            </div>

            {/* 回程照片 */}
            <div>
              <label className="form-label">回程里程照片 *</label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => returnInputRef.current?.click()}
                  className={`w-full p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
                    formData.returnPhoto 
                      ? 'border-green-300 bg-green-50' 
                      : errors.returnPhoto 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">
                    {formData.returnPhoto ? '已上傳回程照片' : '點擊上傳回程里程照片'}
                  </p>
                </button>
                
                <input
                  ref={returnInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhotoUpload('return', file)
                  }}
                  className="hidden"
                />
                
                {formData.returnPhoto && (
                  <div className="mt-3">
                    <img
                      src={formData.returnPhoto}
                      alt="回程照片"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
                
                {errors.returnPhoto && (
                  <p className="text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.returnPhoto}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 備註 */}
        <div className="card">
          <FormTextarea
            label="備註"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="其他補充說明（選填）"
          />
        </div>

        {/* 提交按鈕 - 手機端優化 */}
        <div className="pb-8 pt-4">
          <button 
            type="submit" 
            className="btn-primary w-full py-4 text-lg font-semibold shadow-xl sticky bottom-4 z-10"
            style={{ minHeight: '56px' }}
          >
            提交里程記錄
          </button>
        </div>
        
        {/* 手機端額外底部空間，避免虛擬鍵盤遮擋 */}
        <div className="h-20 md:h-0"></div>
      </form>
    </div>
  )
} 