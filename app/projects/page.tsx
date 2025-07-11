'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Folder, 
  Edit3, 
  Trash2, 
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { storageAdapter, type Project } from '@/lib/storage-adapter'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [currentProject, setCurrentProject] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Omit<Project, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    status: 'planning',
    director: '',
    budget: '',
    notes: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load projects using storage adapter
    const loadProjects = async () => {
      console.log('🔄 正在載入專案...')
      try {
        const savedProjects = await storageAdapter.getProjects()
        console.log('✅ 專案載入成功:', savedProjects.length, '個專案')
        setProjects(savedProjects)
        
        const savedCurrentProject = localStorage.getItem('currentProject')
        if (savedCurrentProject) {
          setCurrentProject(savedCurrentProject)
        }
      } catch (error) {
        console.error('❌ 載入專案失敗:', error)
      }
    }
    
    loadProjects()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = '請輸入專案名稱'
    if (!formData.location.trim()) newErrors.location = '請輸入拍攝地點'
    if (!formData.startDate) newErrors.startDate = '請選擇開始日期'
    if (!formData.director.trim()) newErrors.director = '請輸入導演姓名'
    
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = '結束日期不能早於開始日期'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      console.log('🔄 正在保存專案...')
      
      if (editingProject) {
        // Update existing project
        await storageAdapter.updateProject(editingProject.id!, formData)
        console.log('✅ 專案更新成功')
        
        // Reload projects to get updated data
        const updatedProjects = await storageAdapter.getProjects()
        setProjects(updatedProjects)
      } else {
        // Create new project
        const newProject = await storageAdapter.createProject(formData)
        console.log('✅ 專案創建成功:', newProject.id)
        
        // Reload projects to get latest data
        const updatedProjects = await storageAdapter.getProjects()
        setProjects(updatedProjects)
        
        // If this is the first project or no current project is set, make it current
        if (!currentProject || projects.length === 0) {
          setCurrentProject(newProject.id!)
          localStorage.setItem('currentProject', newProject.id!)
        }
      }
      
      resetForm()
    } catch (error) {
      console.error('❌ 專案保存失敗:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      status: 'planning',
      director: '',
      budget: '',
      notes: ''
    })
    setShowCreateForm(false)
    setEditingProject(null)
    setErrors({})
  }

  const deleteProject = async (id: string) => {
    if (confirm('確定要刪除此專案嗎？此操作無法復原。')) {
      try {
        console.log('🔄 正在刪除專案...')
        await storageAdapter.deleteProject(id)
        console.log('✅ 專案刪除成功')
        
        // Reload projects
        const updatedProjects = await storageAdapter.getProjects()
        setProjects(updatedProjects)
        
        // If deleted project was current, clear current project
        if (currentProject === id) {
          setCurrentProject(null)
          localStorage.removeItem('currentProject')
        }
      } catch (error) {
        console.error('❌ 刪除專案失敗:', error)
      }
    }
  }

  const setAsCurrentProject = (id: string) => {
    setCurrentProject(id)
    localStorage.setItem('currentProject', id)
  }

  const startEditing = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description,
      location: project.location,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      director: project.director,
      budget: project.budget,
      notes: project.notes
    })
    setEditingProject(project)
    setShowCreateForm(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <Calendar className="w-4 h-4 text-orange-600" />
      case 'active': return <Play className="w-4 h-4 text-green-600" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />
      default: return <Pause className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return '規劃中'
      case 'active': return '進行中'
      case 'completed': return '已完成'
      default: return '未知'
    }
  }

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString('zh-TW') : '未設定'
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center">
          <Link href="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">專案管理</h1>
            <p className="text-sm text-gray-600">管理拍攝專案和選擇當前專案</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary text-sm py-2 px-4 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增專案
        </button>
      </div>

      {/* Current Project Info */}
      {currentProject && (
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="font-semibold text-blue-900">當前專案</h2>
          </div>
          {projects.find(p => p.id === currentProject) && (
            <div>
              <p className="font-medium text-blue-900">
                {projects.find(p => p.id === currentProject)?.name}
              </p>
              <p className="text-sm text-blue-700">
                {projects.find(p => p.id === currentProject)?.location}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingProject ? '編輯專案' : '創建新專案'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 基本資訊 */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="form-label">專案名稱 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="例：電影拍攝專案A"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">專案描述</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="form-input"
                  placeholder="專案簡短描述..."
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
                  placeholder="例：台北市信義區"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.location}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">開始日期 *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`form-input ${errors.startDate ? 'border-red-500' : ''}`}
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">結束日期</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={`form-input ${errors.endDate ? 'border-red-500' : ''}`}
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">專案狀態</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="planning">規劃中</option>
                    <option value="active">進行中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">導演 *</label>
                  <input
                    type="text"
                    name="director"
                    value={formData.director}
                    onChange={handleInputChange}
                    className={`form-input ${errors.director ? 'border-red-500' : ''}`}
                    placeholder="導演姓名"
                  />
                  {errors.director && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.director}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">預算</label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="例：NT$ 1,000,000"
                />
              </div>

              <div>
                <label className="form-label">備註</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="form-input"
                  placeholder="其他備註資訊..."
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-primary flex-1">
                {editingProject ? '更新專案' : '創建專案'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">專案列表 ({projects.length})</h2>
        
        {projects.length === 0 ? (
          <div className="card text-center py-8">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">尚無專案記錄</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              創建第一個專案
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-gray-900 mr-3">{project.name}</h3>
                    {currentProject === project.id && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        當前專案
                      </span>
                    )}
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                      <span>{project.location}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      {getStatusIcon(project.status)}
                      <span className="ml-2">{getStatusText(project.status)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-500 mr-2" />
                      <span>導演：{project.director}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  {currentProject !== project.id && project.id && (
                    <button
                      onClick={() => setAsCurrentProject(project.id!)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded text-sm"
                    >
                      設為當前
                    </button>
                  )}
                  <button
                    onClick={() => startEditing(project)}
                    className="text-gray-600 hover:bg-gray-50 p-2 rounded"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {project.id && (
                    <button
                      onClick={() => deleteProject(project.id!)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 