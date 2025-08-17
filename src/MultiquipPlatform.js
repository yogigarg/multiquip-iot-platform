// src/MultiquipPlatform.js
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Bell,
  Settings,
  Users,
  BarChart3,
  Zap,
  Droplets,
  Wrench,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Loader2
} from 'lucide-react';
import snowflakeAPI from './services/SnowflakeAPIService';

const MultiquipPlatform = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // State for dashboard data - now from Snowflake
  const [dashboardData, setDashboardData] = useState({
    totalEquipment: 0,
    uptime: 0,
    accuracy: 0,
    savings: 0,
    jobSites: [],
    equipmentCategories: [],
    alerts: [],
    maintenanceData: {}
  });

  // Load data from Snowflake
  const loadDataFromSnowflake = async () => {
    setLoading(true);
    try {
      console.log('🔗 Loading data from Snowflake...');
      
      // Test connection first
      const connectionTest = await snowflakeAPI.testConnection();
      setConnectionStatus(connectionTest.success ? 'connected' : 'error');
      
      // Load dashboard data
      const data = await snowflakeAPI.getDashboardData();
      
      // Transform the data for our UI
      setDashboardData({
        totalEquipment: data.metrics?.TOTAL_EQUIPMENT || 0,
        uptime: Number(data.metrics?.FLEET_UPTIME || 0).toFixed(1),
        accuracy: Number(data.metrics?.AI_ACCURACY || 0).toFixed(1),
        savings: Number(data.metrics?.COST_SAVINGS || 0).toFixed(1),
        jobSites: data.jobSites?.map(site => ({
          name: site.SITE_NAME,
          equipment: site.EQUIPMENT_COUNT,
          areas: site.WORK_AREAS,
          manager: site.PROJECT_MANAGER
        })) || [],
        equipmentCategories: data.categories?.map(cat => ({
          name: cat.CATEGORY_NAME,
          count: cat.EQUIPMENT_COUNT,
          fuelType: cat.FUEL_TYPE,
          icon: cat.CATEGORY_NAME === 'Generators' ? Zap : 
                cat.CATEGORY_NAME === 'Water Pumps' ? Droplets : 
                cat.CATEGORY_NAME === 'Compactors' ? Activity : Wrench,
          color: cat.CATEGORY_NAME === 'Generators' ? 'bg-yellow-500' :
                 cat.CATEGORY_NAME === 'Water Pumps' ? 'bg-blue-500' :
                 cat.CATEGORY_NAME === 'Compactors' ? 'bg-green-500' : 'bg-purple-500'
        })) || [],
        alerts: data.alerts?.map(alert => ({
          id: alert.ALERT_ID,
          equipment: alert.EQUIPMENT_ID,
          severity: alert.SEVERITY,
          message: alert.MESSAGE,
          site: alert.SITE_NAME,
          createdAt: alert.CREATED_AT
        })) || [],
        maintenanceData: data.maintenance || {}
      });
      
      setLastUpdated(new Date());
      console.log('✅ Data loaded successfully from Snowflake');
      
    } catch (error) {
      console.error('❌ Error loading data from Snowflake:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadDataFromSnowflake();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDataFromSnowflake, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Connection Status Component
  const ConnectionStatus = () => {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Database className={`h-4 w-4 ${
          connectionStatus === 'connected' ? 'text-green-600' :
          connectionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
        }`} />
        <span className={
          connectionStatus === 'connected' ? 'text-green-600' :
          connectionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
        }>
          {connectionStatus === 'connected' ? 'Snowflake Connected' :
           connectionStatus === 'error' ? 'Connection Error' : 'Demo Mode'}
        </span>
        <span className="text-gray-500">|</span>
        <span className="text-gray-600">
          Updated: {lastUpdated.toLocaleTimeString()}
        </span>
        <button
          onClick={loadDataFromSnowflake}
          disabled={loading}
          className="ml-2 p-1 hover:bg-gray-100 rounded"
          title="Refresh from Snowflake"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <RefreshCw className="h-4 w-4 text-blue-600" />
          )}
        </button>
      </div>
    );
  };

  // Navigation Bar
  const Navigation = () => (
    <nav className="bg-gray-900 text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="h-8 w-8 text-yellow-400" />
          <span className="text-xl font-bold">Multiquip IoT Platform</span>
          <span className="text-sm text-gray-400">
            {snowflakeAPI.isUsingMockData() ? '(Demo Data)' : '(Live Data)'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <ConnectionStatus />
          <button className="p-2 hover:bg-gray-700 rounded relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {dashboardData.alerts.length}
            </span>
          </button>
          <button className="p-2 hover:bg-gray-700 rounded">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );

  // Job Site Map Component with real data
  const JobSiteMap = () => {
    const [selectedSite, setSelectedSite] = useState('Downtown Infrastructure Project');
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [siteEquipment, setSiteEquipment] = useState([]);
    const [loadingEquipment, setLoadingEquipment] = useState(false);

    const loadSiteEquipment = async () => {
      if (!dashboardData.jobSites.length) return;
      
      setLoadingEquipment(true);
      try {
        const data = await snowflakeAPI.getEquipmentData(selectedSite);
        setSiteEquipment(data.equipment?.map(e => ({
          id: e.EQUIPMENT_ID,
          name: e.EQUIPMENT_NAME || e.EQUIPMENT_ID,
          x: Math.abs((e.GPS_LONGITUDE + 118.2437) * 1000) % 90 + 5,
          y: Math.abs((e.GPS_LATITUDE - 34.0522) * 1000) % 90 + 5,
          status: e.STATUS || 'operational',
          area: e.AREA_NAME || 'Unknown Area',
          equipmentType: e.EQUIPMENT_TYPE,
          uptime: e.UPTIME_PERCENTAGE || 95 + Math.random() * 5,
          operatingHours: e.OPERATING_HOURS || Math.random() * 5000
        })) || []);
      } catch (error) {
        console.error('Error loading site equipment:', error);
      } finally {
        setLoadingEquipment(false);
      }
    };

    useEffect(() => {
      loadSiteEquipment();
    }, [selectedSite, dashboardData.jobSites]);

    const getStatusColor = (status) => {
      switch(status) {
        case 'critical': return '#EF4444';
        case 'maintenance': return '#F59E0B';
        case 'idle': return '#6B7280';
        default: return '#10B981';
      }
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Live Job Site Map</h3>
            <p className="text-sm text-gray-600">
              Real-time from Snowflake | {siteEquipment.length} units on site
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="border rounded px-3 py-1"
            >
              {dashboardData.jobSites.map((site, index) => (
                <option key={index} value={site.name}>{site.name}</option>
              ))}
            </select>
            {loadingEquipment && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>🔗 {connectionStatus === 'connected' ? 'Live Snowflake Data' : 'Demo Data'}:</strong> 
            {connectionStatus === 'connected' ? 
              ' Equipment positions and status updated in real-time from Snowflake database.' :
              ' Configure Snowflake credentials in .env file to see live data.'
            }
          </p>
        </div>

        <div className="relative bg-gray-100 rounded" style={{ height: '350px' }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <rect x="5" y="5" width="90" height="90" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="0.5" rx="2" />
            
            <line x1="35" y1="5" x2="35" y2="95" stroke="#E5E7EB" strokeWidth="0.3" />
            <line x1="65" y1="5" x2="65" y2="95" stroke="#E5E7EB" strokeWidth="0.3" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="#E5E7EB" strokeWidth="0.3" />
            
            <text x="20" y="25" textAnchor="middle" fontSize="1.8" fill="#6B7280">Excavation</text>
            <text x="50" y="25" textAnchor="middle" fontSize="1.8" fill="#6B7280">Staging</text>
            <text x="80" y="25" textAnchor="middle" fontSize="1.8" fill="#6B7280">Storage</text>
            <text x="20" y="75" textAnchor="middle" fontSize="1.8" fill="#6B7280">Concrete</text>
            <text x="50" y="75" textAnchor="middle" fontSize="1.8" fill="#6B7280">Assembly</text>
            <text x="80" y="75" textAnchor="middle" fontSize="1.8" fill="#6B7280">Access</text>

            {siteEquipment.map((item) => (
              <g key={item.id}>
                <circle
                  cx={item.x}
                  cy={item.y}
                  r="2"
                  fill={getStatusColor(item.status)}
                  stroke="#FFFFFF"
                  strokeWidth="0.5"
                  className="cursor-pointer"
                  onClick={() => setSelectedEquipment(item)}
                />
                <text 
                  x={item.x} 
                  y={item.y + 5} 
                  textAnchor="middle" 
                  fontSize="1.2" 
                  fill="#374151"
                  className="pointer-events-none"
                >
                  {item.equipmentType === 'Generators' ? 'G' :
                   item.equipmentType === 'Water Pumps' ? 'P' :
                   item.equipmentType === 'Compactors' ? 'C' : 'M'}
                </text>
              </g>
            ))}
          </svg>

          {selectedEquipment && (
            <div className="absolute top-4 right-4 bg-white rounded shadow-lg border p-3 w-60">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{selectedEquipment.name}</h4>
                <button onClick={() => setSelectedEquipment(null)}>
                  <XCircle className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="space-y-1 text-xs">
                <p><span className="text-gray-600">ID:</span> {selectedEquipment.id}</p>
                <p><span className="text-gray-600">Type:</span> {selectedEquipment.equipmentType}</p>
                <p><span className="text-gray-600">Area:</span> {selectedEquipment.area}</p>
                <p>
                  <span className="text-gray-600">Status:</span> 
                  <span className={
                    selectedEquipment.status === 'critical' ? 'text-red-600' :
                    selectedEquipment.status === 'maintenance' ? 'text-yellow-600' : 'text-green-600'
                  }> {selectedEquipment.status}</span>
                </p>
                <p><span className="text-gray-600">Uptime:</span> {selectedEquipment.uptime.toFixed(1)}%</p>
                <p><span className="text-gray-600">Hours:</span> {selectedEquipment.operatingHours.toFixed(0)}h</p>
              </div>
              <div className="mt-3 flex space-x-1">
                <button className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                  Details
                </button>
                <button className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded">
                  Service
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4 text-center">
          <div>
            <p className="text-lg font-bold text-green-600">
              {siteEquipment.filter(e => e.status === 'operational').length}
            </p>
            <p className="text-sm text-gray-600">Operational</p>
          </div>
          <div>
            <p className="text-lg font-bold text-yellow-600">
              {siteEquipment.filter(e => e.status === 'maintenance').length}
            </p>
            <p className="text-sm text-gray-600">Maintenance</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">
              {siteEquipment.filter(e => e.status === 'critical').length}
            </p>
            <p className="text-sm text-gray-600">Critical</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{siteEquipment.length}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>
      </div>
    );
  };

  // Main Dashboard with Snowflake data
  const DashboardModule = () => (
    <div className="space-y-6">
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-blue-800">Loading live data from Snowflake...</span>
          </div>
        </div>
      )}

      {!snowflakeAPI.isUsingMockData() && connectionStatus === 'connected' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-800">✅ Connected to Snowflake - Showing live data</span>
          </div>
        </div>
      )}

      {snowflakeAPI.isUsingMockData() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-800">⚠️ Demo Mode - Update .env with Snowflake credentials</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Equipment</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.totalEquipment}</p>
              <p className="text-xs text-gray-500">From Snowflake DB</p>
            </div>
            <Activity className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fleet Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.uptime}%</p>
              <p className="text-xs text-gray-500">Real-time average</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.accuracy}%</p>
              <p className="text-xs text-gray-500">ML Performance</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cost Savings</p>
              <p className="text-2xl font-bold text-gray-900">${dashboardData.savings}M</p>
              <p className="text-xs text-gray-500">YTD from DB</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Equipment Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardData.equipmentCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={index} className="flex items-center p-4 border rounded-lg">
                <div className={`p-3 rounded-lg ${category.color} text-white mr-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{category.name}</h4>
                  <p className="text-sm text-gray-600">{category.count} units</p>
                  <p className="text-xs text-gray-500">{category.fuelType}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Priority Alerts</h3>
        <div className="space-y-3">
          {dashboardData.alerts.length > 0 ? dashboardData.alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  alert.severity === 'critical' ? 'bg-red-500' : 
                  alert.severity === 'high' ? 'bg-yellow-500' : 'bg-orange-500'
                }`} />
                <div>
                  <p className="font-medium text-sm">{alert.equipment}</p>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                  <p className="text-xs text-gray-500">{alert.site}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded">
                  View
                </button>
                <button className="px-3 py-1 bg-green-600 text-white text-sm rounded">
                  Service
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No active alerts - all equipment operational</p>
            </div>
          )}
        </div>
      </div>

      <JobSiteMap />
    </div>
  );

  // Simple placeholder modules
  const EquipmentModule = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Equipment Fleet Management</h2>
      <p className="text-gray-600">Complete equipment management with live Snowflake data</p>
    </div>
  );

  const AlertsModule = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">IoT Alerts Management</h2>
      <p className="text-gray-600">Real-time alerts from equipment sensors</p>
    </div>
  );

  const MaintenanceModule = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Maintenance Management</h2>
      <p className="text-gray-600">Predictive maintenance and work orders</p>
    </div>
  );

  const AnalyticsModule = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Analytics & ML Insights</h2>
      <p className="text-gray-600">Equipment performance analytics</p>
    </div>
  );

  const AIModule = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
      <p className="text-gray-600">AI-powered equipment recommendations</p>
    </div>
  );

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardModule />;
      case 'equipment': return <EquipmentModule />;
      case 'alerts': return <AlertsModule />;
      case 'maintenance': return <MaintenanceModule />;
      case 'analytics': return <AnalyticsModule />;
      case 'ai-assistant': return <AIModule />;
      default: return <DashboardModule />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'equipment', label: 'Equipment', icon: Activity },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'maintenance', label: 'Maintenance', icon: Wrench },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'ai-assistant', label: 'AI Assistant', icon: Users }
          ].map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeModule === module.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{module.label}</span>
              </button>
            );
          })}
        </div>

        {renderModule()}
      </div>
    </div>
  );
};

export default MultiquipPlatform;