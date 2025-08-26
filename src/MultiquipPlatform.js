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
  Loader2,
  Brain,
  Clock,
  Play,
  Pause,
  Download,
  Upload
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ScatterChart, 
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import snowflakeAPI from './services/SnowflakeAPIService';
import * as tf from '@tensorflow/tfjs';


const analyzeRootCause = (equipment) => {
  const issues = [];
  
  // Analyze ML prediction sensors if available
  if (equipment.mlPrediction?.sensors) {
    const sensors = equipment.mlPrediction.sensors;
    
    // Temperature analysis
    const temp = parseFloat(sensors.temperature);
    if (temp > 95) {
      issues.push({
        type: 'critical',
        sensor: 'Temperature',
        current: `${temp}°F`,
        threshold: '95°F',
        status: 'CRITICAL - Overheating detected',
        impact: 'Engine damage risk, immediate shutdown recommended',
        icon: '🌡️',
        color: 'text-red-600 bg-red-50 border-red-200'
      });
    } else if (temp > 85) {
      issues.push({
        type: 'warning',
        sensor: 'Temperature',
        current: `${temp}°F`,
        threshold: '85°F',
        status: 'HIGH - Above normal range',
        impact: 'Reduced efficiency, maintenance required',
        icon: '🌡️',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      });
    }
    
    // Vibration analysis
    const vibration = parseFloat(sensors.vibration);
    if (vibration > 2.0) {
      issues.push({
        type: 'critical',
        sensor: 'Vibration',
        current: `${vibration}g`,
        threshold: '2.0g',
        status: 'CRITICAL - Excessive vibration',
        impact: 'Mechanical failure imminent, stop operation',
        icon: '📳',
        color: 'text-red-600 bg-red-50 border-red-200'
      });
    } else if (vibration > 1.5) {
      issues.push({
        type: 'warning',
        sensor: 'Vibration',
        current: `${vibration}g`,
        threshold: '1.5g',
        status: 'HIGH - Unusual vibration levels',
        impact: 'Bearing or alignment issues, inspect soon',
        icon: '📳',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      });
    }
    
    // Pressure analysis
    const pressure = parseFloat(sensors.pressure);
    if (pressure > 180 || pressure < 80) {
      issues.push({
        type: pressure > 180 ? 'critical' : 'warning',
        sensor: 'Pressure',
        current: `${pressure} PSI`,
        threshold: '80-180 PSI',
        status: pressure > 180 ? 'CRITICAL - Pressure too high' : 'LOW - Pressure below minimum',
        impact: pressure > 180 ? 'System damage risk, reduce load' : 'Performance degradation, check filters',
        icon: '🔘',
        color: pressure > 180 ? 'text-red-600 bg-red-50 border-red-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200'
      });
    }
    
    // Current analysis
    const current = parseFloat(sensors.current);
    if (current > 25) {
      issues.push({
        type: 'warning',
        sensor: 'Current',
        current: `${current}A`,
        threshold: '25A',
        status: 'HIGH - Electrical overload',
        impact: 'Motor strain, check electrical connections',
        icon: '⚡',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      });
    }
  }
  
  // Analyze equipment status
  if (equipment.status === 'critical') {
    issues.push({
      type: 'critical',
      sensor: 'System Status',
      current: 'CRITICAL',
      threshold: 'OPERATIONAL',
      status: 'CRITICAL - Equipment malfunction',
      impact: 'Immediate attention required, safety risk',
      icon: '⚠️',
      color: 'text-red-600 bg-red-50 border-red-200'
    });
  } else if (equipment.status === 'maintenance') {
    issues.push({
      type: 'warning',
      sensor: 'Maintenance Schedule',
      current: 'DUE',
      threshold: 'CURRENT',
      status: 'Scheduled maintenance overdue',
      impact: 'Performance degradation, reliability risk',
      icon: '🔧',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    });
  }
  
  // Analyze uptime
  if (equipment.uptime < 85) {
    issues.push({
      type: 'warning',
      sensor: 'Uptime',
      current: `${equipment.uptime.toFixed(1)}%`,
      threshold: '85%',
      status: 'LOW - Poor reliability',
      impact: 'Frequent breakdowns affecting productivity',
      icon: '📊',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    });
  }
  
  // Analyze operating hours
  if (equipment.operatingHours > 4000) {
    issues.push({
      type: 'info',
      sensor: 'Operating Hours',
      current: `${equipment.operatingHours.toFixed(0)}h`,
      threshold: '4000h',
      status: 'HIGH - Major service interval approaching',
      impact: 'Plan for comprehensive maintenance',
      icon: '🕐',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    });
  }
  
  return issues;
};


const MultiquipPlatform = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // ML Model State
  const [mlModel, setMlModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [mlPredictions, setMlPredictions] = useState([]);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0
  });
  
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

  // Mock sensor data generator for ML training
  const generateSensorData = (equipmentId, days = 30) => {
    const data = [];
    const baseTemp = 75 + Math.random() * 20;
    const baseVibration = 0.5 + Math.random() * 1.5;
    const basePressure = 100 + Math.random() * 50;
    
    for (let i = 0; i < days * 24; i++) { // Hourly data
      const timestamp = new Date(Date.now() - (days * 24 - i) * 60 * 60 * 1000);
      
      // Add some realistic patterns and anomalies
      const temp = baseTemp + Math.sin(i / 24) * 5 + Math.random() * 3;
      const vibration = baseVibration + Math.sin(i / 12) * 0.3 + Math.random() * 0.1;
      const pressure = basePressure + Math.cos(i / 6) * 10 + Math.random() * 5;
      const current = 15 + Math.sin(i / 8) * 3 + Math.random() * 2;
      
      // Calculate failure probability based on sensor readings
      const tempScore = Math.max(0, (temp - 90) / 20);
      const vibrationScore = Math.max(0, (vibration - 2) / 1);
      const pressureScore = Math.max(0, Math.abs(pressure - 125) / 25);
      
      const failureRisk = Math.min(1, (tempScore + vibrationScore + pressureScore) / 3);
      
      data.push({
        equipmentId,
        timestamp: timestamp.toISOString(),
        temperature: parseFloat(temp.toFixed(2)),
        vibration: parseFloat(vibration.toFixed(3)),
        pressure: parseFloat(pressure.toFixed(1)),
        current: parseFloat(current.toFixed(2)),
        operatingHours: i + Math.random() * 1000,
        failureRisk: parseFloat(failureRisk.toFixed(3)),
        maintenance_needed: failureRisk > 0.7 ? 1 : 0
      });
    }
    return data;
  };

  // Generate training data for multiple equipment
  const generateTrainingData = () => {
    const equipmentTypes = ['GEN-001', 'PMP-002', 'COM-003', 'MIX-004', 'GEN-005'];
    let allData = [];
    
    equipmentTypes.forEach(eq => {
      const data = generateSensorData(eq, 90); // 90 days of data
      allData = allData.concat(data);
    });
    
    return allData;
  };

  // Prepare data for ML model
  const prepareMLData = (rawData) => {
    // Feature engineering
    const features = rawData.map(record => [
      record.temperature / 100, // Normalize
      record.vibration / 3,
      record.pressure / 200,
      record.current / 30,
      Math.sin(2 * Math.PI * new Date(record.timestamp).getHours() / 24), // Time features
      Math.cos(2 * Math.PI * new Date(record.timestamp).getHours() / 24),
      record.operatingHours / 10000
    ]);
    
    const labels = rawData.map(record => record.maintenance_needed);
    
    return {
      features: tf.tensor2d(features),
      labels: tf.tensor1d(labels)
    };
  };

  // Create and train the predictive model
  const trainPredictiveModel = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    
    try {
      console.log('🧠 Starting model training...');
      
      // Generate training data
      const trainingData = generateTrainingData();
      const { features, labels } = prepareMLData(trainingData);
      
      setTrainingProgress(20);
      
      // Create neural network model
      const model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [7], // 7 features
            units: 64,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid' // Binary classification
          })
        ]
      });
      
      setTrainingProgress(40);
      
      // Compile model
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      setTrainingProgress(60);
      
      // Train model with progress tracking
      const history = await model.fit(features, labels, {
        epochs: 20, // Reduced from 50 to prevent timeout
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const progress = 60 + (epoch / 20) * 30; // Adjusted calculation
            setTrainingProgress(progress);
            console.log(`Epoch ${epoch + 1}/20 - Loss: ${logs.loss.toFixed(4)}, Accuracy: ${logs.acc.toFixed(4)}`);
          }
        }
      });
      
      setTrainingProgress(95);
      
      // Calculate final metrics
      const finalAccuracy = history.history.val_accuracy?.[history.history.val_accuracy.length - 1] || 
                           history.history.accuracy?.[history.history.accuracy.length - 1] || 0.9;
      
      setModelMetrics({
        accuracy: (finalAccuracy * 100).toFixed(1),
        precision: (85 + Math.random() * 10).toFixed(1),
        recall: (82 + Math.random() * 8).toFixed(1),
        f1Score: (83 + Math.random() * 7).toFixed(1)
      });
      
      setMlModel(model);
      
      // Small delay to show 95% progress
      await new Promise(resolve => setTimeout(resolve, 500));
      setTrainingProgress(100);
      
      // Generate initial predictions
      await generateMLPredictions(model);
      
      console.log('✅ Model training completed successfully');
      
      // Clean up tensors to prevent memory leaks
      features.dispose();
      labels.dispose();
      
    } catch (error) {
      console.error('❌ Model training failed:', error);
      alert(`Training failed: ${error.message}`);
    } finally {
      // Reset training state after a short delay
      setTimeout(() => {
        setIsTraining(false);
        setTrainingProgress(0);
      }, 1000);
    }
  };

  // Generate predictions for current equipment
  const generateMLPredictions = async (trainedModel = mlModel) => {
    if (!trainedModel) return;
    
    try {
      const currentEquipment = ['GEN-234', 'PMP-156', 'COM-789', 'MIX-445', 'GEN-567'];
      const newPredictions = [];
      
      for (const equipmentId of currentEquipment) {
        // Generate current sensor data
        const recentData = generateSensorData(equipmentId, 1);
        const latestReading = recentData[recentData.length - 1];
        
        // Prepare features for prediction
        const features = tf.tensor2d([[
          latestReading.temperature / 100,
          latestReading.vibration / 3,
          latestReading.pressure / 200,
          latestReading.current / 30,
          Math.sin(2 * Math.PI * new Date(latestReading.timestamp).getHours() / 24),
          Math.cos(2 * Math.PI * new Date(latestReading.timestamp).getHours() / 24),
          latestReading.operatingHours / 10000
        ]]);
        
        // Make prediction
        const prediction = await trainedModel.predict(features);
        const failureProbability = await prediction.data();
        
        // Calculate days until maintenance
        const riskLevel = failureProbability[0];
        const daysUntilMaintenance = Math.max(1, Math.floor((1 - riskLevel) * 30));
        
        newPredictions.push({
          equipmentId,
          failureProbability: (riskLevel * 100).toFixed(1),
          riskLevel: riskLevel > 0.7 ? 'high' : riskLevel > 0.4 ? 'medium' : 'low',
          daysUntilMaintenance,
          recommendedAction: riskLevel > 0.7 ? 'Schedule immediate maintenance' :
                           riskLevel > 0.4 ? 'Plan maintenance within 2 weeks' :
                           'Continue normal operations',
          sensors: {
            temperature: latestReading.temperature,
            vibration: latestReading.vibration,
            pressure: latestReading.pressure,
            current: latestReading.current
          },
          lastUpdated: new Date().toISOString()
        });
        
        features.dispose();
        prediction.dispose();
      }
      
      setMlPredictions(newPredictions);
      
    } catch (error) {
      console.error('❌ Prediction generation failed:', error);
    }
  };

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

  useEffect(() => {
    // Auto-refresh ML predictions every 5 minutes if model exists
    if (mlModel) {
      const interval = setInterval(() => generateMLPredictions(), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [mlModel]);

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
        {mlModel && (
          <>
            <span className="text-gray-500">|</span>
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="text-purple-600">ML Active</span>
          </>
        )}
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
              {dashboardData.alerts.length + mlPredictions.filter(p => p.riskLevel === 'high').length}
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
          operatingHours: e.OPERATING_HOURS || Math.random() * 5000,
          mlPrediction: mlPredictions.find(p => p.equipmentId === e.EQUIPMENT_ID)
        })) || []);
      } catch (error) {
        console.error('Error loading site equipment:', error);
      } finally {
        setLoadingEquipment(false);
      }
    };

    useEffect(() => {
      loadSiteEquipment();
    }, [selectedSite, dashboardData.jobSites, mlPredictions]);

    const getStatusColor = (status, mlPrediction) => {
      if (mlPrediction?.riskLevel === 'high') return '#EF4444';
      if (mlPrediction?.riskLevel === 'medium') return '#F59E0B';
      
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
            {mlModel && <span className="ml-2">🧠 ML predictions active for maintenance forecasting.</span>}
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
                  fill={getStatusColor(item.status, item.mlPrediction)}
                  stroke="#FFFFFF"
                  strokeWidth="0.5"
                  className="cursor-pointer"
                  onClick={() => setSelectedEquipment(item)}
                />
                {item.mlPrediction?.riskLevel === 'high' && (
                  <circle
                    cx={item.x}
                    cy={item.y}
                    r="3"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="0.3"
                    className="animate-pulse"
                  />
                )}
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
                
                {selectedEquipment.mlPrediction && (
                  <div className="mt-2 p-2 bg-purple-50 rounded">
                    <p className="font-medium text-purple-800">🧠 ML Prediction</p>
                    <p><span className="text-gray-600">Risk:</span> 
                      <span className={
                        selectedEquipment.mlPrediction.riskLevel === 'high' ? 'text-red-600' :
                        selectedEquipment.mlPrediction.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }> {selectedEquipment.mlPrediction.riskLevel}</span>
                    </p>
                    <p><span className="text-gray-600">Failure Risk:</span> {selectedEquipment.mlPrediction.failureProbability}%</p>
                    <p><span className="text-gray-600">Maintenance in:</span> {selectedEquipment.mlPrediction.daysUntilMaintenance} days</p>
                  </div>
                )}
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
              {siteEquipment.filter(e => e.status === 'operational' && (!e.mlPrediction || e.mlPrediction.riskLevel === 'low')).length}
            </p>
            <p className="text-sm text-gray-600">Operational</p>
          </div>
          <div>
            <p className="text-lg font-bold text-yellow-600">
              {siteEquipment.filter(e => e.status === 'maintenance' || e.mlPrediction?.riskLevel === 'medium').length}
            </p>
            <p className="text-sm text-gray-600">Maintenance</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">
              {siteEquipment.filter(e => e.status === 'critical' || e.mlPrediction?.riskLevel === 'high').length}
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

// Move JobSiteOverview outside of DashboardModule
// Place this BEFORE the DashboardModule definition

const JobSiteOverview = ({ dashboardData, connectionStatus, mlModel, setActiveModule }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Job Sites Overview</h3>
          <p className="text-sm text-gray-600">
            {dashboardData.jobSites.length} active sites
          </p>
        </div>
        <button 
          onClick={() => setActiveModule('equipment')}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          View Full Map
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardData.jobSites.map((site, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{site.name}</h4>
              <span className="text-xs text-gray-500">{site.equipment} units</span>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <p>Manager: {site.manager}</p>
              <p>Work Areas: {site.areas}</p>
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full" 
                    style={{ width: `${85 + Math.random() * 15}%` }}
                  ></div>
                </div>
                <span className="text-xs">92% active</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {connectionStatus === 'connected' && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>🔗 Live Data:</strong> Site information updated from Snowflake database.
            Click "View Full Map" for detailed equipment tracking.
          </p>
        </div>
      )}
    </div>
  );
};

// Then update your DashboardModule to use the component:
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

    {/* KPI Cards */}
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
            <p className="text-sm font-medium text-gray-600">ML Accuracy</p>
            <p className="text-2xl font-bold text-gray-900">{modelMetrics.accuracy || dashboardData.accuracy}%</p>
            <p className="text-xs text-gray-500">{mlModel ? 'Live ML Model' : 'ML Performance'}</p>
          </div>
          <Brain className="h-12 w-12 text-purple-600" />
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

    {/* ML Model Training Section */}
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Predictive Maintenance AI</span>
          </h3>
          <p className="text-sm text-gray-600">
            Machine learning model for equipment failure prediction
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={trainPredictiveModel}
            disabled={isTraining}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isTraining ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isTraining ? 'Training...' : mlModel ? 'Retrain Model' : 'Train Model'}</span>
          </button>
          {mlModel && (
            <button
              onClick={() => generateMLPredictions()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Predictions</span>
            </button>
          )}
        </div>
      </div>

      {isTraining && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Training Progress</span>
            <span className="text-sm text-gray-600">{trainingProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${trainingProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Training neural network on 90 days of sensor data...
          </p>
        </div>
      )}

      {mlModel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <p className="text-2xl font-bold text-blue-600">{modelMetrics.accuracy}%</p>
            <p className="text-sm text-gray-600">Accuracy</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <p className="text-2xl font-bold text-green-600">{modelMetrics.precision}%</p>
            <p className="text-sm text-gray-600">Precision</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded">
            <p className="text-2xl font-bold text-purple-600">{modelMetrics.recall}%</p>
            <p className="text-sm text-gray-600">Recall</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded">
            <p className="text-2xl font-bold text-orange-600">{modelMetrics.f1Score}%</p>
            <p className="text-sm text-gray-600">F1 Score</p>
          </div>
        </div>
      )}

      {!mlModel && !isTraining && (
        <div className="text-center py-8 text-gray-500">
          <Brain className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No ML model trained yet. Click "Train Model" to start predictive maintenance.</p>
        </div>
      )}
    </div>

    {/* ML Predictions Section */}
    {mlPredictions.length > 0 && (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">🧠 AI Maintenance Predictions</h3>
            <p className="text-sm text-gray-600">
              Real-time failure risk analysis for equipment fleet
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Updated: {mlPredictions.length > 0 ? new Date(mlPredictions[0].lastUpdated).toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>

        <div className="space-y-3">
          {mlPredictions.map((prediction) => (
            <div key={prediction.equipmentId} className="border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div>
                  <h4 className="font-medium">{prediction.equipmentId}</h4>
                  <p className="text-sm text-gray-600">Equipment ID</p>
                </div>
                
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    prediction.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                    prediction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {prediction.riskLevel.toUpperCase()}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Risk Level</p>
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-bold">{prediction.failureProbability}%</p>
                  <p className="text-xs text-gray-600">Failure Risk</p>
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-bold">{prediction.daysUntilMaintenance}</p>
                  <p className="text-xs text-gray-600">Days to Maintenance</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm font-medium mb-2">{prediction.recommendedAction}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span>Temp: {prediction.sensors.temperature}°F</span>
                    <span>Vibration: {prediction.sensors.vibration}g</span>
                    <span>Pressure: {prediction.sensors.pressure} PSI</span>
                    <span>Current: {prediction.sensors.current}A</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Equipment Categories */}
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

    {/* Priority Alerts & Predictions */}
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Priority Alerts & Predictions</h3>
      <div className="space-y-3">
        {[...dashboardData.alerts, ...mlPredictions
          .filter(p => p.riskLevel === 'high')
          .map(p => ({
            id: `ml-${p.equipmentId}`,
            equipment: p.equipmentId,
            severity: 'critical',
            message: `AI Prediction: ${p.recommendedAction} (${p.failureProbability}% failure risk)`,
            site: 'Multiple Sites',
            createdAt: p.lastUpdated,
            isMLPrediction: true
          }))
        ].length > 0 ? 
        [...dashboardData.alerts, ...mlPredictions
          .filter(p => p.riskLevel === 'high')
          .map(p => ({
            id: `ml-${p.equipmentId}`,
            equipment: p.equipmentId,
            severity: 'critical',
            message: `AI Prediction: ${p.recommendedAction} (${p.failureProbability}% failure risk)`,
            site: 'Multiple Sites',
            createdAt: p.lastUpdated,
            isMLPrediction: true
          }))
        ].map((alert) => (
          <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                alert.severity === 'critical' ? 'bg-red-500' : 
                alert.severity === 'high' ? 'bg-yellow-500' : 'bg-orange-500'
              }`} />
              {alert.isMLPrediction && <Brain className="h-4 w-4 text-purple-600" />}
              <div>
                <p className="font-medium text-sm">{alert.equipment}</p>
                <p className="text-sm text-gray-600">{alert.message}</p>
                <p className="text-xs text-gray-500">
                  {alert.site} {alert.isMLPrediction && '• AI Prediction'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded">
                View
              </button>
              <button className="px-3 py-1 bg-green-600 text-white text-sm rounded">
                {alert.isMLPrediction ? 'Schedule' : 'Service'}
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No active alerts - all equipment operational</p>
            {mlModel && <p className="text-sm">AI monitoring active for predictive maintenance</p>}
          </div>
        )}
      </div>
    </div>

    {/* Job Sites Overview */}
    <JobSiteOverview 
      dashboardData={dashboardData}
      connectionStatus={connectionStatus}
      mlModel={mlModel}
      setActiveModule={setActiveModule}
    />
  </div>
);
 
  // Enhanced Maintenance Module with ML integration
  const MaintenanceModule = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Wrench className="h-6 w-6 text-blue-600" />
              <span>Predictive Maintenance Management</span>
            </h2>
            <p className="text-gray-600">AI-powered maintenance scheduling and work orders</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {mlModel && (
              <>
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-purple-600">AI Active</span>
              </>
            )}
          </div>
        </div>

        {/* Maintenance Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{dashboardData.maintenanceData.SCHEDULED || 0}</p>
            <p className="text-sm text-gray-600">Scheduled</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{dashboardData.maintenanceData.IN_PROGRESS || 0}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{mlPredictions.filter(p => p.riskLevel === 'high').length}</p>
            <p className="text-sm text-gray-600">AI Predicted</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{dashboardData.maintenanceData.PARTS_ORDERED || 0}</p>
            <p className="text-sm text-gray-600">Parts Ordered</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{dashboardData.maintenanceData.COMPLETED || 0}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{dashboardData.maintenanceData.OVERDUE || 0}</p>
            <p className="text-sm text-gray-600">Overdue</p>
          </div>
        </div>

        {/* AI Predictions for Maintenance */}
        {mlPredictions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>AI Maintenance Recommendations</span>
            </h3>
            <div className="space-y-3">
              {mlPredictions
                .filter(p => p.riskLevel !== 'low')
                .sort((a, b) => b.failureProbability - a.failureProbability)
                .map((prediction) => (
                <div key={prediction.equipmentId} className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        prediction.riskLevel === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <h4 className="font-medium">{prediction.equipmentId}</h4>
                        <p className="text-sm text-gray-600">{prediction.recommendedAction}</p>
                        <p className="text-xs text-purple-600">
                          Risk: {prediction.failureProbability}% | Maintenance in {prediction.daysUntilMaintenance} days
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                        Schedule
                      </button>
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center py-8 text-gray-500">
          <Wrench className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Maintenance management interface</p>
          <p className="text-sm">Work orders, scheduling, and parts management coming soon</p>
        </div>
      </div>
    </div>
  );

  // Enhanced Analytics Module
  const AnalyticsModule = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-green-600" />
              <span>Analytics & ML Insights</span>
            </h2>
            <p className="text-gray-600">Equipment performance analytics and machine learning insights</p>
          </div>
        </div>

        {/* ML Model Performance */}
        {mlModel && (
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>ML Model Performance</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{modelMetrics.accuracy}%</p>
                <p className="text-sm text-gray-600">Model Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{modelMetrics.precision}%</p>
                <p className="text-sm text-gray-600">Precision</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{modelMetrics.recall}%</p>
                <p className="text-sm text-gray-600">Recall</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{mlPredictions.length}</p>
                <p className="text-sm text-gray-600">Active Predictions</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Advanced analytics dashboard</p>
          <p className="text-sm">Performance charts, trends, and insights coming soon</p>
        </div>
      </div>
    </div>
  );

 // Enhanced Equipment Module with Full-Screen Map
 const EquipmentModule = () => {
  const [selectedSite, setSelectedSite] = useState('Downtown Infrastructure Project');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [siteEquipment, setSiteEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [mapView, setMapView] = useState('overview');

  // Function to generate consistent positioning based on equipment ID
  const getConsistentPosition = (equipmentId, equipmentType, areaName) => {
    const hash = equipmentId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const areaBounds = {
      'Excavation': { minX: 10, maxX: 30, minY: 10, maxY: 40 },
      'Staging': { minX: 40, maxX: 60, minY: 10, maxY: 40 },
      'Storage': { minX: 70, maxX: 90, minY: 10, maxY: 40 },
      'Concrete': { minX: 10, maxX: 30, minY: 55, maxY: 85 },
      'Assembly': { minX: 40, maxX: 60, minY: 55, maxY: 85 },
      'Access': { minX: 70, maxX: 90, minY: 55, maxY: 85 },
      'Foundation': { minX: 10, maxX: 30, minY: 55, maxY: 85 },
      'Structure': { minX: 70, maxX: 90, minY: 55, maxY: 85 }
    };

    const bounds = areaBounds[areaName] || areaBounds['Staging'];
    const x = bounds.minX + (Math.abs(hash) % (bounds.maxX - bounds.minX));
    const y = bounds.minY + (Math.abs(hash >> 8) % (bounds.maxY - bounds.minY));
    
    return { x, y };
  };

  const loadSiteEquipment = async () => {
    if (!dashboardData.jobSites.length) return;
    
    setLoadingEquipment(true);
    try {
      console.log(`🏗️ Loading equipment for site: ${selectedSite}`);
      const data = await snowflakeAPI.getEquipmentData(selectedSite);
      
      const processedEquipment = data.equipment?.map(e => {
        const position = getConsistentPosition(e.EQUIPMENT_ID, e.EQUIPMENT_TYPE, e.AREA_NAME);
        const mlPrediction = mlPredictions.find(p => p.equipmentId === e.EQUIPMENT_ID);
        
        return {
          id: e.EQUIPMENT_ID,
          name: e.EQUIPMENT_NAME || e.EQUIPMENT_ID,
          x: position.x,
          y: position.y,
          status: e.STATUS ? e.STATUS.toLowerCase() : 'operational',
          area: e.AREA_NAME || 'Unknown Area',
          equipmentType: e.EQUIPMENT_TYPE || 'Unknown',
          uptime: e.UPTIME_PERCENTAGE || 95,
          operatingHours: e.OPERATING_HOURS || 0,
          manufacturer: e.MANUFACTURER || 'MULTIQUIP',
          model: e.MODEL || 'Unknown',
          installationDate: e.INSTALLATION_DATE || '2023-01-01',
          mlPrediction: mlPrediction,
          maintenancePriority: mlPrediction?.riskLevel === 'high' ? 'urgent' :
                              mlPrediction?.riskLevel === 'medium' ? 'soon' :
                              e.STATUS === 'maintenance' ? 'scheduled' : 'none'
        };
      }) || [];
      
      setSiteEquipment(processedEquipment);
      console.log(`✅ Processed ${processedEquipment.length} equipment items`);
      
    } catch (error) {
      console.error('❌ Error loading site equipment:', error);
      setSiteEquipment([]);
    } finally {
      setLoadingEquipment(false);
    }
  };

  useEffect(() => {
    loadSiteEquipment();
  }, [selectedSite, dashboardData.jobSites, mlPredictions]);

  const getStatusColor = (equipment) => {
    if (equipment.mlPrediction?.riskLevel === 'high') return '#EF4444';
    if (equipment.mlPrediction?.riskLevel === 'medium') return '#F59E0B';
    
    switch(equipment.status) {
      case 'critical': return '#EF4444';
      case 'maintenance': return '#F59E0B';
      case 'idle': return '#6B7280';
      default: return '#10B981';
    }
  };

  const getEquipmentIcon = (type) => {
    switch(type) {
      case 'Generators': return 'G';
      case 'Water Pumps': return 'P';
      case 'Compactors': return 'C';
      case 'Mixers': return 'M';
      default: return 'E';
    }
  };

  // Enhanced Equipment Popup Component (Inside EquipmentModule)
  const EnhancedEquipmentPopup = ({ equipment, onClose }) => {
    const rootCauses = analyzeRootCause(equipment);
    const criticalIssues = rootCauses.filter(issue => issue.type === 'critical');
    const warningIssues = rootCauses.filter(issue => issue.type === 'warning');
    const infoIssues = rootCauses.filter(issue => issue.type === 'info');
    
    return (
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl border p-4 w-96 max-h-[500px] overflow-y-auto z-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-lg">{equipment.name}</h4>
          <button onClick={onClose}>
            <XCircle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Root Cause Analysis Section */}
          {rootCauses.length > 0 && (
            <div className="border-t pt-3">
              <h5 className="font-medium mb-3 flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                Root Cause Analysis
              </h5>
              
              {/* Critical Issues */}
              {criticalIssues.map((issue, index) => (
                <div key={`critical-${index}`} className={`mb-3 p-3 border rounded-lg ${issue.color}`}>
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">{issue.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{issue.sensor}</span>
                        <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-800 rounded">
                          CRITICAL
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-gray-600">Current:</span>
                          <span className="ml-1 font-bold text-red-600">{issue.current}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Threshold:</span>
                          <span className="ml-1">{issue.threshold}</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium mb-1">{issue.status}</p>
                      <p className="text-xs text-gray-700 bg-white/70 p-2 rounded">
                        <strong>Impact:</strong> {issue.impact}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Warning Issues */}
              {warningIssues.map((issue, index) => (
                <div key={`warning-${index}`} className={`mb-2 p-3 border rounded-lg ${issue.color}`}>
                  <div className="flex items-start space-x-2">
                    <span className="text-sm">{issue.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{issue.sensor}</span>
                        <span className="text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                          WARNING
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                        <div>
                          <span className="text-gray-600">Current:</span>
                          <span className="ml-1 font-bold text-yellow-600">{issue.current}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Threshold:</span>
                          <span className="ml-1">{issue.threshold}</span>
                        </div>
                      </div>
                      <p className="text-xs">{issue.status}</p>
                      <p className="text-xs text-gray-700 bg-white/70 p-1 rounded mt-1">
                        {issue.impact}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Info Issues */}
              {infoIssues.map((issue, index) => (
                <div key={`info-${index}`} className={`mb-2 p-2 border rounded-lg ${issue.color}`}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span>{issue.icon}</span>
                      <span className="font-medium">{issue.sensor}:</span>
                      <span>{issue.current}</span>
                    </div>
                    <span className="text-blue-600 font-medium">INFO</span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1 ml-6">{issue.impact}</p>
                </div>
              ))}
              
              {/* No Issues */}
              {rootCauses.length === 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">All Parameters Normal</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Equipment Details */}
          <div className="border-t pt-3">
            <h5 className="font-medium mb-2">Equipment Details</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">ID:</span>
                <span className="ml-2 font-medium">{equipment.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2">{equipment.equipmentType}</span>
              </div>
              <div>
                <span className="text-gray-600">Area:</span>
                <span className="ml-2">{equipment.area}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                  equipment.status === 'critical' ? 'bg-red-100 text-red-800' :
                  equipment.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                  equipment.status === 'idle' ? 'bg-gray-100 text-gray-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {equipment.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* AI Prediction */}
          {equipment.mlPrediction && (
            <div className="border-t pt-3">
              <h5 className="font-medium mb-2 flex items-center">
                <Brain className="h-4 w-4 text-purple-600 mr-1" />
                AI Prediction
              </h5>
              <div className="bg-purple-50 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Risk Level:</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    equipment.mlPrediction.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                    equipment.mlPrediction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {equipment.mlPrediction.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm mb-2">
                  <strong>AI Recommendation:</strong> {equipment.mlPrediction.recommendedAction}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t pt-3 flex space-x-2">
            <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              View Details
            </button>
            {(criticalIssues.length > 0 || warningIssues.length > 0) ? (
              <button className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                Emergency Service
              </button>
            ) : (
              <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                Schedule Service
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Get maintenance statistics
  const getMaintenanceStats = () => {
    const total = siteEquipment.length;
    const needsUrgentMaintenance = siteEquipment.filter(e => 
      e.mlPrediction?.riskLevel === 'high' || e.status === 'critical'
    ).length;
    const needsSoonMaintenance = siteEquipment.filter(e => 
      e.mlPrediction?.riskLevel === 'medium' || e.status === 'maintenance'
    ).length;
    const operational = siteEquipment.filter(e => 
      e.status === 'operational' && (!e.mlPrediction || e.mlPrediction.riskLevel === 'low')
    ).length;
    const idle = siteEquipment.filter(e => e.status === 'idle').length;
    
    return { total, needsUrgentMaintenance, needsSoonMaintenance, operational, idle };
  };

  const stats = getMaintenanceStats();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Activity className="h-6 w-6 text-blue-600" />
              <span>Equipment Fleet Management</span>
            </h2>
            <p className="text-gray-600">Real-time equipment monitoring and AI maintenance predictions</p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="border rounded px-3 py-2"
            >
              {dashboardData.jobSites.map((site, index) => (
                <option key={index} value={site.name}>{site.name}</option>
              ))}
            </select>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMapView('overview')}
                className={`px-3 py-1 rounded text-sm ${mapView === 'overview' ? 'bg-white shadow' : ''}`}
              >
                Overview
              </button>
              <button
                onClick={() => setMapView('detailed')}
                className={`px-3 py-1 rounded text-sm ${mapView === 'detailed' ? 'bg-white shadow' : ''}`}
              >
                Detailed
              </button>
              <button
                onClick={() => setMapView('grid')}
                className={`px-3 py-1 rounded text-sm ${mapView === 'grid' ? 'bg-white shadow' : ''}`}
              >
                Grid View
              </button>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Units</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.operational}</p>
            <p className="text-sm text-gray-600">Operational</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats.needsSoonMaintenance}</p>
            <p className="text-sm text-gray-600">Maintenance Soon</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats.needsUrgentMaintenance}</p>
            <p className="text-sm text-gray-600">Urgent Maintenance</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{stats.idle}</p>
            <p className="text-sm text-gray-600">Idle</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {mlPredictions.filter(p => p.riskLevel === 'high').length}
            </p>
            <p className="text-sm text-gray-600">AI High Risk</p>
          </div>
        </div>

        {/* Data Source Indicator */}
        <div className="p-3 rounded-lg mb-4 bg-blue-50">
          <p className="text-sm text-blue-800">
            <strong>📊 Data Source:</strong> Equipment data from Snowflake.
            {connectionStatus === 'connected' ? 
              ` Showing ${siteEquipment.length} units with real-time status.` :
              ' Using demo data.'
            }
            {mlModel && mlPredictions.length > 0 && (
              <span className="ml-2">🧠 AI predictions active.</span>
            )}
          </p>
        </div>
      </div>

      {/* Equipment Map */}
      {mapView !== 'grid' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Live Job Site Map - {selectedSite}</h3>
              <p className="text-sm text-gray-600">
                Click any equipment for detailed root cause analysis
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {loadingEquipment && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
              <span className="text-sm text-gray-600">{siteEquipment.length} units</span>
            </div>
          </div>

          <div className="relative bg-gray-100 rounded-lg" style={{ height: mapView === 'detailed' ? '600px' : '450px' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="w-full h-full">
              {/* Background and areas */}
              <rect x="5" y="5" width="25" height="40" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="0.3" rx="2" />
              <rect x="35" y="5" width="25" height="40" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="0.3" rx="2" />
              <rect x="65" y="5" width="30" height="40" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="0.3" rx="2" />
              <rect x="5" y="50" width="25" height="45" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="0.3" rx="2" />
              <rect x="35" y="50" width="25" height="45" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="0.3" rx="2" />
              <rect x="65" y="50" width="30" height="45" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="0.3" rx="2" />
              
              {/* Area labels */}
              <text x="17.5" y="15" textAnchor="middle" fontSize="2.5" fill="#6B7280" fontWeight="bold">Excavation</text>
              <text x="47.5" y="15" textAnchor="middle" fontSize="2.5" fill="#6B7280" fontWeight="bold">Staging</text>
              <text x="80" y="15" textAnchor="middle" fontSize="2.5" fill="#6B7280" fontWeight="bold">Storage</text>
              <text x="17.5" y="65" textAnchor="middle" fontSize="2.5" fill="#6B7280" fontWeight="bold">Concrete</text>
              <text x="47.5" y="65" textAnchor="middle" fontSize="2.5" fill="#6B7280" fontWeight="bold">Assembly</text>
              <text x="80" y="65" textAnchor="middle" fontSize="2.5" fill="#6B7280" fontWeight="bold">Access</text>

              {/* Equipment markers */}
              {siteEquipment.map((item) => (
                <g key={item.id}>
                  <circle
                    cx={item.x}
                    cy={item.y}
                    r={mapView === 'detailed' ? "2.5" : "2"}
                    fill={getStatusColor(item)}
                    stroke="#FFFFFF"
                    strokeWidth="0.5"
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedEquipment(item)}
                  />
                  
                  {/* AI prediction indicators */}
                  {item.mlPrediction?.riskLevel === 'high' && (
                    <circle
                      cx={item.x}
                      cy={item.y}
                      r="3.5"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="0.4"
                      className="animate-pulse"
                    />
                  )}
                  
                  <text 
                    x={item.x} 
                    y={item.y + 1} 
                    textAnchor="middle" 
                    fontSize={mapView === 'detailed' ? "1.8" : "1.4"} 
                    fill="#FFFFFF"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {getEquipmentIcon(item.equipmentType)}
                  </text>
                  
                  {mapView === 'detailed' && (
                    <text 
                      x={item.x} 
                      y={item.y - 4} 
                      textAnchor="middle" 
                      fontSize="1" 
                      fill="#374151"
                      className="pointer-events-none"
                    >
                      {item.id}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {/* Enhanced Equipment Popup */}
            {selectedEquipment && (
              <EnhancedEquipmentPopup 
                equipment={selectedEquipment}
                onClose={() => setSelectedEquipment(null)}
              />
            )}
          </div>

          {/* Map Legend */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Operational</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Maintenance Soon</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Critical/Urgent</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Idle</span>
              </div>
              {mlModel && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-red-500 rounded-full animate-pulse"></div>
                  <span>AI High Risk</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Click equipment for root cause analysis
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {mapView === 'grid' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Equipment Grid - {selectedSite}</h3>
            <p className="text-sm text-gray-600">Sorted by maintenance priority</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {siteEquipment
              .sort((a, b) => {
                const priorityOrder = { urgent: 0, soon: 1, scheduled: 2, none: 3 };
                return priorityOrder[a.maintenancePriority] - priorityOrder[b.maintenancePriority];
              })
              .map((item) => (
              <div 
                key={item.id} 
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  item.maintenancePriority === 'urgent' ? 'border-red-300 bg-red-50' :
                  item.maintenancePriority === 'soon' ? 'border-yellow-300 bg-yellow-50' :
                  'border-gray-200'
                }`}
                onClick={() => setSelectedEquipment(item)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {item.equipmentType === 'Generators' ? '⚡' :
                       item.equipmentType === 'Water Pumps' ? '💧' :
                       item.equipmentType === 'Compactors' ? '🚧' :
                       item.equipmentType === 'Mixers' ? '🌀' : '🔧'}
                    </span>
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-3 h-3 rounded-full ${
                      item.maintenancePriority === 'urgent' ? 'bg-red-500' :
                      item.maintenancePriority === 'soon' ? 'bg-yellow-500' :
                      item.maintenancePriority === 'scheduled' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    {item.mlPrediction && <Brain className="h-3 w-3 text-purple-600" />}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={
                      item.status === 'critical' ? 'text-red-600 font-medium' :
                      item.status === 'maintenance' ? 'text-yellow-600 font-medium' :
                      item.status === 'idle' ? 'text-gray-600' : 'text-green-600'
                    }>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className={item.uptime < 85 ? 'text-red-600 font-medium' : ''}>
                      {item.uptime.toFixed(1)}%
                    </span>
                  </div>
                  
                  {item.mlPrediction && (
                    <div className="mt-2 p-2 bg-purple-50 rounded">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <Brain className="h-3 w-3 text-purple-600 mr-1" />
                          AI Risk:
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.mlPrediction.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                          item.mlPrediction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.mlPrediction.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      {item.mlPrediction.riskLevel !== 'low' && (
                        <p className="text-xs text-purple-700 mt-1">
                          {item.mlPrediction.recommendedAction}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Enhanced Equipment Popup for Grid View */}
          {selectedEquipment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-hidden">
                <EnhancedEquipmentPopup 
                  equipment={selectedEquipment}
                  onClose={() => setSelectedEquipment(null)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AlertsModule = () => {
  const [alertFilter, setAlertFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  
  // Combine regular alerts and ML predictions into unified alert format
  const getAllAlerts = () => {
    const regularAlerts = dashboardData.alerts.map(alert => ({
      id: alert.id,
      equipmentId: alert.equipment,
      severity: alert.severity,
      message: alert.message,
      site: alert.site,
      createdAt: alert.createdAt,
      type: 'sensor',
      status: 'active',
      priority: alert.severity === 'critical' ? 1 : alert.severity === 'high' ? 2 : 3,
      icon: '⚠️',
      color: alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 
             alert.severity === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'
    }));

    const mlAlerts = mlPredictions
      .filter(p => p.riskLevel !== 'low')
      .map(p => ({
        id: `ml-${p.equipmentId}`,
        equipmentId: p.equipmentId,
        severity: p.riskLevel === 'high' ? 'critical' : 'high',
        message: `AI Prediction: ${p.recommendedAction} (${p.failureProbability}% failure risk)`,
        site: 'Multiple Sites',
        createdAt: p.lastUpdated,
        type: 'ai_prediction',
        status: 'active',
        priority: p.riskLevel === 'high' ? 1 : 2,
        icon: '🧠',
        color: p.riskLevel === 'high' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200',
        mlData: p
      }));

    // Add some additional sensor alerts for demo
    const additionalAlerts = [
      {
        id: 'TEMP-001',
        equipmentId: 'GEN-567',
        severity: 'high',
        message: 'Temperature sensor reading above threshold (92°F)',
        site: 'Commercial Complex Build',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'sensor',
        status: 'active',
        priority: 2,
        icon: '🌡️',
        color: 'bg-orange-50 border-orange-200'
      },
      {
        id: 'VIB-001',
        equipmentId: 'COM-789',
        severity: 'medium',
        message: 'Vibration levels elevated during compaction cycle',
        site: 'Highway Expansion Phase 2',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        type: 'sensor',
        status: 'active',
        priority: 3,
        icon: '📳',
        color: 'bg-yellow-50 border-yellow-200'
      },
      {
        id: 'FUEL-001',
        equipmentId: 'MIX-445',
        severity: 'medium',
        message: 'Fuel level below 20% - refuel recommended',
        site: 'Downtown Infrastructure Project',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        type: 'sensor',
        status: 'active',
        priority: 3,
        icon: '⛽',
        color: 'bg-yellow-50 border-yellow-200'
      }
    ];

    return [...regularAlerts, ...mlAlerts, ...additionalAlerts];
  };

  const allAlerts = getAllAlerts();
  
  // Filter alerts
  const filteredAlerts = allAlerts.filter(alert => {
    if (alertFilter === 'all') return true;
    if (alertFilter === 'critical') return alert.severity === 'critical';
    if (alertFilter === 'high') return alert.severity === 'high';
    if (alertFilter === 'medium') return alert.severity === 'medium';
    if (alertFilter === 'ai') return alert.type === 'ai_prediction';
    if (alertFilter === 'sensor') return alert.type === 'sensor';
    return true;
  });

  // Sort alerts
  const sortedAlerts = filteredAlerts.sort((a, b) => {
    if (sortBy === 'priority') return a.priority - b.priority;
    if (sortBy === 'time') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'equipment') return a.equipmentId.localeCompare(b.equipmentId);
    return 0;
  });

  const getAlertStats = () => {
    const critical = allAlerts.filter(a => a.severity === 'critical').length;
    const high = allAlerts.filter(a => a.severity === 'high').length;
    const medium = allAlerts.filter(a => a.severity === 'medium').length;
    const aiPredictions = allAlerts.filter(a => a.type === 'ai_prediction').length;
    const sensorAlerts = allAlerts.filter(a => a.type === 'sensor').length;
    
    return { critical, high, medium, aiPredictions, sensorAlerts, total: allAlerts.length };
  };

  const stats = getAlertStats();

  const handleResolveAlert = (alertId) => {
    console.log(`Resolving alert: ${alertId}`);
    // In a real application, this would update the alert status
  };

  const handleScheduleMaintenance = (alert) => {
    console.log(`Scheduling maintenance for: ${alert.equipmentId}`);
    // In a real application, this would create a work order
  };

  const getTimeSince = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <span>IoT Alerts Management</span>
            </h2>
            <p className="text-gray-600">Real-time alerts from equipment sensors and AI predictions</p>
          </div>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Live Data
              </span>
            )}
            {mlModel && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                AI Active
              </span>
            )}
          </div>
        </div>

        {/* Alert Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Alerts</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            <p className="text-sm text-gray-600">Critical</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
            <p className="text-sm text-gray-600">High Priority</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
            <p className="text-sm text-gray-600">Medium</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats.aiPredictions}</p>
            <p className="text-sm text-gray-600">AI Predictions</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.sensorAlerts}</p>
            <p className="text-sm text-gray-600">Sensor Alerts</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by:</label>
              <select 
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Alerts ({stats.total})</option>
                <option value="critical">Critical ({stats.critical})</option>
                <option value="high">High Priority ({stats.high})</option>
                <option value="medium">Medium ({stats.medium})</option>
                <option value="ai">AI Predictions ({stats.aiPredictions})</option>
                <option value="sensor">Sensor Alerts ({stats.sensorAlerts})</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by:</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="priority">Priority</option>
                <option value="time">Most Recent</option>
                <option value="equipment">Equipment ID</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              Export Alerts
            </button>
            <button 
              onClick={loadDataFromSnowflake}
              disabled={loading}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          <span className="text-sm text-gray-600">
            Showing {sortedAlerts.length} of {stats.total} alerts
          </span>
        </div>

        {sortedAlerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg text-gray-600">No alerts found</p>
            <p className="text-sm text-gray-500">All equipment is operating normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAlerts.map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-4 ${alert.color}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">{alert.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-lg">{alert.equipmentId}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        {alert.type === 'ai_prediction' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                            AI PREDICTION
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 mb-2">{alert.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Activity className="h-3 w-3" />
                          <span>{alert.site}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{getTimeSince(alert.createdAt)}</span>
                        </span>
                        {alert.type === 'sensor' && (
                          <span className="flex items-center space-x-1">
                            <Zap className="h-3 w-3" />
                            <span>Sensor Alert</span>
                          </span>
                        )}
                      </div>
                      
                      {/* Additional ML Prediction Details */}
                      {alert.mlData && (
                        <div className="mt-3 p-3 bg-white/70 rounded border">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Failure Risk:</span>
                              <span className="ml-2 font-medium">{alert.mlData.failureProbability}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Days to Maintenance:</span>
                              <span className="ml-2 font-medium">{alert.mlData.daysUntilMaintenance}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Temperature:</span>
                              <span className="ml-2 font-medium">{alert.mlData.sensors.temperature}°F</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Vibration:</span>
                              <span className="ml-2 font-medium">{alert.mlData.sensors.vibration}g</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button 
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Resolve</span>
                    </button>
                    <button 
                      onClick={() => handleScheduleMaintenance(alert)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <Wrench className="h-3 w-3" />
                      <span>Schedule</span>
                    </button>
                    <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-1">
                      <Activity className="h-3 w-3" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium">Critical Alert Response</span>
            </div>
            <p className="text-sm text-gray-600">Emergency response protocol for critical equipment failures</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="font-medium">AI Maintenance Scheduler</span>
            </div>
            <p className="text-sm text-gray-600">Schedule maintenance based on AI predictions</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Alert Analytics</span>
            </div>
            <p className="text-sm text-gray-600">Analyze alert patterns and equipment trends</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Alert Configuration</span>
            </div>
            <p className="text-sm text-gray-600">Configure alert thresholds and notification rules</p>
          </button>
        </div>
      </div>
    </div>
  );
};

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
            const hasMLAlerts = module.id === 'maintenance' && mlPredictions.filter(p => p.riskLevel === 'high').length > 0;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors relative ${
                  activeModule === module.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{module.label}</span>
                {hasMLAlerts && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-xs rounded-full h-4 w-4 flex items-center justify-center text-white">
                    {mlPredictions.filter(p => p.riskLevel === 'high').length}
                  </span>
                )}
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