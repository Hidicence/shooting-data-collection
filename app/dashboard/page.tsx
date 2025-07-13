'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  BarChart3, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  MapPin,
  Camera,
  Zap,
  Droplets,
  UtensilsCrossed,
  Recycle
} from 'lucide-react'
import { storageAdapter, type PersonalRecord, type CoordinatorRecord, type Project } from '@/lib/storage-adapter'
import PhotoManager from '@/components/PhotoManager'
import PhotoDiagnostics from '@/components/PhotoDiagnostics'

export default function DashboardPage() {
  const [personalData, setPersonalData] = useState<PersonalRecord[]>([])
  const [coordinatorData, setCoordinatorData] = useState<CoordinatorRecord[]>([])
  const [activeTab, setActiveTab] = useState<'personal' | 'coordinator' | 'photos' | 'diagnostics'>('personal')
  const [selectedRecord, setSelectedRecord] = useState<PersonalRecord | CoordinatorRecord | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  useEffect(() => {
    // Load data using storage adapter (Firebase/localStorage)
    const loadData = async () => {
      try {
        console.log('🔄 正在載入儀表板數據...')
        
        // Load projects
        const projectsData = await storageAdapter.getProjects()
        console.log('✅ 專案數據載入成功:', projectsData.length, '個專案')
        setProjects(projectsData)
        
        // Load personal records
        const personal = await storageAdapter.getPersonalRecords()
        console.log('✅ 個人記錄載入成功:', personal.length, '筆記錄')
        setPersonalData(personal)
        
        // Load coordinator records
        const coordinator = await storageAdapter.getCoordinatorRecords()
        console.log('✅ 統整記錄載入成功:', coordinator.length, '筆記錄')
        setCoordinatorData(coordinator)
      } catch (error) {
        console.error('❌ 載入儀表板數據失敗:', error)
      }
    }
    
    loadData()
  }, [])

  const deletePersonalRecord = async (id: string) => {
    try {
      await storageAdapter.deletePersonalRecord(id)
      // Reload data
      const personal = await storageAdapter.getPersonalRecords()
      setPersonalData(personal)
    } catch (error) {
      console.error('❌ 刪除個人記錄失敗:', error)
    }
  }

  const deleteCoordinatorRecord = async (id: string) => {
    try {
      await storageAdapter.deleteCoordinatorRecord(id)
      // Reload data
      const coordinator = await storageAdapter.getCoordinatorRecords()
      setCoordinatorData(coordinator)
    } catch (error) {
      console.error('❌ 刪除統整記錄失敗:', error)
    }
  }

  const exportData = () => {
    const allData = {
      personalRecords: personalData,
      coordinatorRecords: coordinatorData,
      projects: projects,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(allData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `拍攝數據收集_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const clearAllData = async () => {
    if (confirm('確定要清除所有數據嗎？此操作無法復原！\n\n這將刪除：\n• 所有個人記錄\n• 所有統整記錄\n• 所有專案資料')) {
      try {
        console.log('🔄 正在清除所有數據...')
        
        // 清除個人記錄
        for (const record of personalData) {
          if (record.id) {
            await storageAdapter.deletePersonalRecord(record.id)
          }
        }
        
        // 清除統整記錄
        for (const record of coordinatorData) {
          if (record.id) {
            await storageAdapter.deleteCoordinatorRecord(record.id)
          }
        }
        
        // 清除專案
        for (const project of projects) {
          if (project.id) {
            await storageAdapter.deleteProject(project.id)
          }
        }
        
        // 清除當前專案設定
        localStorage.removeItem('currentProject')
        
        // 重新載入數據
        setPersonalData([])
        setCoordinatorData([])
        setProjects([])
        setSelectedProject(null)
        
        console.log('✅ 所有數據已清除')
        alert('所有數據已成功清除！')
      } catch (error) {
        console.error('❌ 清除數據失敗:', error)
        alert('清除數據時發生錯誤，請稍後再試')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW')
  }

  // Filter data by selected project
  const filteredPersonalData = selectedProject 
    ? personalData.filter(record => record.projectId === selectedProject)
    : personalData
  
  const filteredCoordinatorData = selectedProject
    ? coordinatorData.filter(record => record.projectId === selectedProject)
    : coordinatorData

  // Statistics
  const totalPersonalRecords = filteredPersonalData.length
  const totalCoordinatorRecords = filteredCoordinatorData.length
  const totalMileage = filteredPersonalData.reduce((sum, record) => sum + parseFloat(record.mileage || '0'), 0)
  const totalElectricity = filteredCoordinatorData.reduce((sum, record) => sum + parseFloat(record.electricityUsage || '0'), 0)

  return (
    <div className="min-h-screen p-4 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center">
          <Link href="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">數據管理中心</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">查看和管理所有收集數據</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportData}
            className="btn-secondary text-sm py-2 px-4 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            匯出
          </button>
          <button
            onClick={clearAllData}
            className="bg-red-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-red-700 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清除所有數據
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">個人記錄</p>
              <p className="text-xl font-bold">{totalPersonalRecords}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">統整記錄</p>
              <p className="text-xl font-bold">{totalCoordinatorRecords}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <MapPin className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">總里程</p>
              <p className="text-xl font-bold">{totalMileage.toFixed(1)} km</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">總用電</p>
              <p className="text-xl font-bold">{totalElectricity.toFixed(1)} kWh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Filter */}
      {projects.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">專案篩選</label>
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">所有專案</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          {selectedProject && (
            <div className="mt-2 text-sm text-gray-600">
              當前篩選：{projects.find(p => p.id === selectedProject)?.name}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
        <button
          onClick={() => setActiveTab('personal')}
          className={`py-3 px-4 text-center rounded-lg border ${
            activeTab === 'personal' 
              ? 'bg-primary text-white border-primary' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          個人記錄 ({totalPersonalRecords})
        </button>
        <button
          onClick={() => setActiveTab('coordinator')}
          className={`py-3 px-4 text-center rounded-lg border ${
            activeTab === 'coordinator' 
              ? 'bg-primary text-white border-primary' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
          }`}
        >
          <BarChart3 className="w-5 h-5 inline mr-2" />
          統整記錄 ({totalCoordinatorRecords})
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`py-3 px-4 text-center rounded-lg border ${
            activeTab === 'photos' 
              ? 'bg-primary text-white border-primary' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
          }`}
        >
          <Camera className="w-5 h-5 inline mr-2" />
          照片管理
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`py-3 px-4 text-center rounded-lg border ${
            activeTab === 'diagnostics' 
              ? 'bg-primary text-white border-primary' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
          }`}
        >
          <Trash2 className="w-5 h-5 inline mr-2" />
          診斷修復
        </button>
      </div>

      {/* Personal Records */}
      {activeTab === 'personal' && (
        <div className="space-y-4">
          {filteredPersonalData.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">尚無個人記錄數據</p>
            </div>
          ) : (
            filteredPersonalData.map((record) => (
              <div key={record.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Users className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="font-medium">{record.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{formatDate(record.date)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{record.startLocation} → {record.endLocation}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>里程: {record.mileage} km</span>
                    </div>
                    {record.projectName && (
                      <div className="mt-2 text-sm text-blue-600">
                        專案: {record.projectName}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePersonalRecord(record.id!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Coordinator Records */}
      {activeTab === 'coordinator' && (
        <div className="space-y-4">
          {filteredCoordinatorData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">尚無統整記錄數據</p>
            </div>
          ) : (
            filteredCoordinatorData.map((record) => (
              <div key={record.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <BarChart3 className="w-4 h-4 text-green-600 mr-2" />
                      <span className="font-medium">{record.coordinatorName}</span>
                      <span className="text-sm text-gray-500 ml-2">{formatDate(record.date)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{record.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Zap className="w-4 h-4 mr-1" />
                      <span>用電: {record.electricityUsage} kWh</span>
                    </div>
                    {record.projectName && (
                      <div className="mt-2 text-sm text-blue-600">
                        專案: {record.projectName}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCoordinatorRecord(record.id!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Photo Management */}
      {activeTab === 'photos' && (
        <PhotoManager 
          projects={projects}
          selectedProject={selectedProject}
        />
      )}

      {/* Photo Diagnostics */}
      {activeTab === 'diagnostics' && (
        <PhotoDiagnostics />
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activeTab === 'personal' ? '個人記錄詳情' : '統整記錄詳情'}
                </h3>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
              
              {activeTab === 'personal' ? (
                // Personal Record
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">姓名</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{(selectedRecord as PersonalRecord).name}</p>
                  </div>
                  {(selectedRecord as PersonalRecord).projectName && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">所屬專案</label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100">{(selectedRecord as PersonalRecord).projectName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">日期</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(selectedRecord.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">出發地</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{(selectedRecord as PersonalRecord).startLocation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">目的地</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{(selectedRecord as PersonalRecord).endLocation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">里程數</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{(selectedRecord as PersonalRecord).mileage} km</p>
                  </div>
                  
                  {/* 照片 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">去程照片</label>
                      {(selectedRecord as PersonalRecord).departurePhotoUrl ? (
                        <img 
                          src={(selectedRecord as PersonalRecord).departurePhotoUrl} 
                          alt="去程照片" 
                          className="w-full h-32 object-cover rounded mt-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded mt-2 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">回程照片</label>
                      {(selectedRecord as PersonalRecord).returnPhotoUrl ? (
                        <img 
                          src={(selectedRecord as PersonalRecord).returnPhotoUrl} 
                          alt="回程照片" 
                          className="w-full h-32 object-cover rounded mt-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded mt-2 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(selectedRecord as PersonalRecord).notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註</label>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">{(selectedRecord as PersonalRecord).notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                // Coordinator Record
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">統整人員</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{(selectedRecord as CoordinatorRecord).coordinatorName}</p>
                  </div>
                  {(selectedRecord as CoordinatorRecord).projectName && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">所屬專案</label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100">{(selectedRecord as CoordinatorRecord).projectName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">日期</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(selectedRecord.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">地點</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{(selectedRecord as CoordinatorRecord).location}</p>
                  </div>
                  
                  {/* 電力數據 */}
                  {(selectedRecord as CoordinatorRecord).electricityUsage && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-700">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-400 mb-2 flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        用電數據
                      </h4>
                      <p className="text-yellow-700 dark:text-yellow-300">總用電：{(selectedRecord as CoordinatorRecord).electricityUsage} kWh</p>
                      {(selectedRecord as CoordinatorRecord).electricityStartReading && (
                        <p className="text-yellow-700 dark:text-yellow-300">開始讀數：{(selectedRecord as CoordinatorRecord).electricityStartReading}</p>
                      )}
                      {(selectedRecord as CoordinatorRecord).electricityEndReading && (
                        <p className="text-yellow-700 dark:text-yellow-300">結束讀數：{(selectedRecord as CoordinatorRecord).electricityEndReading}</p>
                      )}
                    </div>
                  )}
                  
                  {/* 飲水數據 */}
                  {((selectedRecord as CoordinatorRecord).waterWeight || (selectedRecord as CoordinatorRecord).waterBottleCount) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-700">
                      <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2 flex items-center">
                        <Droplets className="w-4 h-4 mr-2" />
                        飲水數據
                      </h4>
                      {(selectedRecord as CoordinatorRecord).waterWeight && (
                        <p className="text-blue-700 dark:text-blue-300">飲水重量：{(selectedRecord as CoordinatorRecord).waterWeight} kg</p>
                      )}
                      {(selectedRecord as CoordinatorRecord).waterBottleCount && (
                        <p className="text-blue-700 dark:text-blue-300">瓶數：{(selectedRecord as CoordinatorRecord).waterBottleCount} 瓶</p>
                      )}
                    </div>
                  )}
                  
                  {/* 餐點數據 */}
                  {((selectedRecord as CoordinatorRecord).foodWasteWeight || (selectedRecord as CoordinatorRecord).mealCount) && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-700">
                      <h4 className="font-medium text-green-800 dark:text-green-400 mb-2 flex items-center">
                        <UtensilsCrossed className="w-4 h-4 mr-2" />
                        餐點數據
                      </h4>
                      {(selectedRecord as CoordinatorRecord).mealCount && (
                        <p className="text-green-700 dark:text-green-300">餐點數：{(selectedRecord as CoordinatorRecord).mealCount} 份</p>
                      )}
                      {(selectedRecord as CoordinatorRecord).foodWasteWeight && (
                        <p className="text-green-700 dark:text-green-300">廚餘重量：{(selectedRecord as CoordinatorRecord).foodWasteWeight} kg</p>
                      )}
                    </div>
                  )}
                  
                  {/* 回收數據 */}
                  {((selectedRecord as CoordinatorRecord).recycleWeight || (selectedRecord as CoordinatorRecord).recycleTypes.length > 0) && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border border-purple-200 dark:border-purple-700">
                      <h4 className="font-medium text-purple-800 dark:text-purple-400 mb-2 flex items-center">
                        <Recycle className="w-4 h-4 mr-2" />
                        回收數據
                      </h4>
                      {(selectedRecord as CoordinatorRecord).recycleWeight && (
                        <p className="text-purple-700 dark:text-purple-300">回收重量：{(selectedRecord as CoordinatorRecord).recycleWeight} kg</p>
                      )}
                      {(selectedRecord as CoordinatorRecord).recycleTypes.length > 0 && (
                        <p className="text-purple-700 dark:text-purple-300">回收類型：{(selectedRecord as CoordinatorRecord).recycleTypes.join(', ')}</p>
                      )}
                    </div>
                  )}
                  
                  {(selectedRecord as CoordinatorRecord).notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註</label>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">{(selectedRecord as CoordinatorRecord).notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 