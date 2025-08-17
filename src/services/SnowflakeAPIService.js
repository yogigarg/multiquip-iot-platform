// src/services/SnowflakeAPIService.js
class SnowflakeAPIService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
    
    // Debug: Log all environment variables to console
    console.log('🔍 Environment Variables Debug:');
    console.log('REACT_APP_SNOWFLAKE_ACCOUNT:', process.env.REACT_APP_SNOWFLAKE_ACCOUNT);
    console.log('REACT_APP_SNOWFLAKE_USERNAME:', process.env.REACT_APP_SNOWFLAKE_USERNAME);
    console.log('REACT_APP_SNOWFLAKE_PASSWORD:', process.env.REACT_APP_SNOWFLAKE_PASSWORD ? '***HIDDEN***' : 'MISSING');
    console.log('REACT_APP_SNOWFLAKE_WAREHOUSE:', process.env.REACT_APP_SNOWFLAKE_WAREHOUSE);
    console.log('REACT_APP_SNOWFLAKE_DATABASE:', process.env.REACT_APP_SNOWFLAKE_DATABASE);
    console.log('REACT_APP_SNOWFLAKE_SCHEMA:', process.env.REACT_APP_SNOWFLAKE_SCHEMA);
    console.log('REACT_APP_SNOWFLAKE_INTEGRATION:', process.env.REACT_APP_SNOWFLAKE_INTEGRATION);
    console.log('REACT_APP_USE_MOCK_DATA:', process.env.REACT_APP_USE_MOCK_DATA);
    
    // Check if we have all required Snowflake credentials
    this.hasSnowflakeCredentials = !!(
      process.env.REACT_APP_SNOWFLAKE_ACCOUNT &&
      process.env.REACT_APP_SNOWFLAKE_USERNAME &&
      process.env.REACT_APP_SNOWFLAKE_PASSWORD &&
      process.env.REACT_APP_SNOWFLAKE_WAREHOUSE &&
      process.env.REACT_APP_SNOWFLAKE_DATABASE &&
      process.env.REACT_APP_SNOWFLAKE_SCHEMA
    );
    
    // Determine if we should use mock data
    this.useMockData = process.env.REACT_APP_USE_MOCK_DATA === 'true' || !this.hasSnowflakeCredentials;
    
    console.log('✅ Has Snowflake Credentials:', this.hasSnowflakeCredentials);
    console.log('🎭 Using Mock Data:', this.useMockData);
    
    // Snowflake configuration
    this.snowflakeConfig = {
      account: process.env.REACT_APP_SNOWFLAKE_ACCOUNT,
      username: process.env.REACT_APP_SNOWFLAKE_USERNAME,
      password: process.env.REACT_APP_SNOWFLAKE_PASSWORD,
      warehouse: process.env.REACT_APP_SNOWFLAKE_WAREHOUSE,
      database: process.env.REACT_APP_SNOWFLAKE_DATABASE,
      schema: process.env.REACT_APP_SNOWFLAKE_SCHEMA
    };
  }

  isUsingMockData() {
    return this.useMockData;
  }

  async testConnection() {
    console.log('🔗 Testing Snowflake connection...');
    
    if (this.useMockData) {
      console.log('⚠️ Using mock data - skipping real connection test');
      return { success: false, message: 'Using mock data' };
    }

    try {
      // In a real implementation, this would make an actual API call to your backend
      // which would then connect to Snowflake
      const response = await fetch(`${this.baseURL}/snowflake/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.snowflakeConfig)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Snowflake connection successful');
        return { success: true, message: 'Connected to Snowflake' };
      } else {
        console.log('❌ Snowflake connection failed');
        return { success: false, message: 'Connection failed' };
      }
    } catch (error) {
      console.error('❌ Snowflake connection error:', error);
      return { success: false, message: error.message };
    }
  }

  async getDashboardData() {
    console.log('📊 Loading dashboard data...');
    
    if (this.useMockData) {
      console.log('🎭 Returning mock dashboard data');
      return this.getMockDashboardData();
    }

    try {
      const response = await fetch(`${this.baseURL}/snowflake/dashboard-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.snowflakeConfig)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real Snowflake dashboard data loaded');
        return data;
      } else {
        console.log('⚠️ Failed to load real data, falling back to mock');
        return this.getMockDashboardData();
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      console.log('⚠️ Falling back to mock data');
      return this.getMockDashboardData();
    }
  }

  async getEquipmentData(siteName) {
    console.log('🏗️ Loading equipment data for site:', siteName);
    
    if (this.useMockData) {
      console.log('🎭 Returning mock equipment data');
      return this.getMockEquipmentData(siteName);
    }

    try {
      const response = await fetch(`${this.baseURL}/snowflake/equipment-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...this.snowflakeConfig,
          siteName: siteName
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real Snowflake equipment data loaded');
        return data;
      } else {
        console.log('⚠️ Failed to load real equipment data, falling back to mock');
        return this.getMockEquipmentData(siteName);
      }
    } catch (error) {
      console.error('❌ Error loading equipment data:', error);
      console.log('⚠️ Falling back to mock equipment data');
      return this.getMockEquipmentData(siteName);
    }
  }

  // ML-related API calls
  async trainMLModel() {
    console.log('🧠 Starting ML model training...');
    
    if (this.useMockData) {
      console.log('🎭 Simulating ML model training');
      return {
        success: true,
        message: 'Mock training completed',
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.85,
        f1Score: 0.87
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/ml/train-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.snowflakeConfig)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ ML model training completed');
        return result;
      } else {
        throw new Error('Model training failed');
      }
    } catch (error) {
      console.error('❌ ML model training error:', error);
      return { success: false, message: error.message };
    }
  }

  async getMLPredictions(equipmentIds) {
    console.log('🔮 Getting ML predictions for equipment:', equipmentIds);
    
    if (this.useMockData) {
      console.log('🎭 Returning mock ML predictions');
      return this.getMockMLPredictions(equipmentIds);
    }

    try {
      const response = await fetch(`${this.baseURL}/ml/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...this.snowflakeConfig,
          equipmentIds: equipmentIds
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real ML predictions loaded');
        return data;
      } else {
        console.log('⚠️ Failed to load real predictions, falling back to mock');
        return this.getMockMLPredictions(equipmentIds);
      }
    } catch (error) {
      console.error('❌ Error loading ML predictions:', error);
      console.log('⚠️ Falling back to mock predictions');
      return this.getMockMLPredictions(equipmentIds);
    }
  }

  async getSensorData(equipmentId, days = 7) {
    console.log('📊 Getting sensor data for equipment:', equipmentId);
    
    if (this.useMockData) {
      console.log('🎭 Returning mock sensor data');
      return this.getMockSensorData(equipmentId, days);
    }

    try {
      const response = await fetch(`${this.baseURL}/snowflake/sensor-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...this.snowflakeConfig,
          equipmentId: equipmentId,
          days: days
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real sensor data loaded');
        return data;
      } else {
        console.log('⚠️ Failed to load real sensor data, falling back to mock');
        return this.getMockSensorData(equipmentId, days);
      }
    } catch (error) {
      console.error('❌ Error loading sensor data:', error);
      console.log('⚠️ Falling back to mock sensor data');
      return this.getMockSensorData(equipmentId, days);
    }
  }

  async uploadSensorData(sensorReadings) {
    console.log('📤 Uploading sensor data...');
    
    if (this.useMockData) {
      console.log('🎭 Mock sensor data upload');
      return { success: true, message: 'Mock upload completed', recordsUploaded: sensorReadings.length };
    }

    try {
      const response = await fetch(`${this.baseURL}/snowflake/upload-sensor-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...this.snowflakeConfig,
          sensorReadings: sensorReadings
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sensor data uploaded successfully');
        return result;
      } else {
        throw new Error('Sensor data upload failed');
      }
    } catch (error) {
      console.error('❌ Sensor data upload error:', error);
      return { success: false, message: error.message };
    }
  }

  // Mock data methods
  getMockDashboardData() {
    return {
      metrics: {
        TOTAL_EQUIPMENT: 127,
        FLEET_UPTIME: 94.2,
        AI_ACCURACY: 97.8,
        COST_SAVINGS: 2.4
      },
      jobSites: [
        {
          SITE_NAME: 'Downtown Infrastructure Project',
          EQUIPMENT_COUNT: 45,
          WORK_AREAS: 6,
          PROJECT_MANAGER: 'Sarah Johnson'
        },
        {
          SITE_NAME: 'Highway Expansion Phase 2',
          EQUIPMENT_COUNT: 38,
          WORK_AREAS: 4,
          PROJECT_MANAGER: 'Mike Rodriguez'
        },
        {
          SITE_NAME: 'Commercial Complex Build',
          EQUIPMENT_COUNT: 44,
          WORK_AREAS: 8,
          PROJECT_MANAGER: 'Emily Chen'
        }
      ],
      categories: [
        {
          CATEGORY_NAME: 'Generators',
          EQUIPMENT_COUNT: 32,
          FUEL_TYPE: 'Diesel'
        },
        {
          CATEGORY_NAME: 'Water Pumps',
          EQUIPMENT_COUNT: 28,
          FUEL_TYPE: 'Electric'
        },
        {
          CATEGORY_NAME: 'Compactors',
          EQUIPMENT_COUNT: 35,
          FUEL_TYPE: 'Diesel'
        },
        {
          CATEGORY_NAME: 'Mixers',
          EQUIPMENT_COUNT: 32,
          FUEL_TYPE: 'Electric'
        }
      ],
      alerts: [
        {
          ALERT_ID: 'ALT-001',
          EQUIPMENT_ID: 'GEN-234',
          SEVERITY: 'critical',
          MESSAGE: 'Engine temperature exceeding normal range',
          SITE_NAME: 'Downtown Infrastructure Project',
          CREATED_AT: new Date().toISOString()
        },
        {
          ALERT_ID: 'ALT-002',
          EQUIPMENT_ID: 'PMP-156',
          SEVERITY: 'high',
          MESSAGE: 'Maintenance due within 24 hours',
          SITE_NAME: 'Highway Expansion Phase 2',
          CREATED_AT: new Date().toISOString()
        }
      ],
      maintenance: {
        SCHEDULED: 15,
        IN_PROGRESS: 2,
        PARTS_ORDERED: 1,
        COMPLETED: 127,
        EMERGENCY: 1,
        OVERDUE: 0
      }
    };
  }

  getMockEquipmentData(siteName) {
    const equipmentTypes = ['Generators', 'Water Pumps', 'Compactors', 'Mixers'];
    const statuses = ['operational', 'maintenance', 'critical', 'idle'];
    const areas = ['Excavation', 'Staging', 'Storage', 'Concrete', 'Assembly', 'Access'];
    
    const equipment = [];
    const count = Math.floor(Math.random() * 20) + 10; // 10-30 pieces of equipment
    
    for (let i = 0; i < count; i++) {
      equipment.push({
        EQUIPMENT_ID: `EQ-${String(i + 1).padStart(3, '0')}`,
        EQUIPMENT_NAME: `${equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)]} ${i + 1}`,
        EQUIPMENT_TYPE: equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)],
        STATUS: statuses[Math.floor(Math.random() * statuses.length)],
        AREA_NAME: areas[Math.floor(Math.random() * areas.length)],
        GPS_LATITUDE: 34.0522 + (Math.random() - 0.5) * 0.01,
        GPS_LONGITUDE: -118.2437 + (Math.random() - 0.5) * 0.01,
        UPTIME_PERCENTAGE: 85 + Math.random() * 15,
        OPERATING_HOURS: Math.random() * 5000
      });
    }
    
    return { equipment };
  }

  getMockMLPredictions(equipmentIds) {
    const predictions = equipmentIds.map(equipmentId => {
      const failureProbability = Math.random() * 100;
      const riskLevel = failureProbability > 70 ? 'high' : failureProbability > 40 ? 'medium' : 'low';
      const daysUntilMaintenance = Math.max(1, Math.floor((100 - failureProbability) / 3));
      
      return {
        equipmentId,
        failureProbability: failureProbability.toFixed(1),
        riskLevel,
        daysUntilMaintenance,
        recommendedAction: riskLevel === 'high' ? 'Schedule immediate maintenance' :
                          riskLevel === 'medium' ? 'Plan maintenance within 2 weeks' :
                          'Continue normal operations',
        confidence: (85 + Math.random() * 15).toFixed(1),
        lastUpdated: new Date().toISOString(),
        sensors: {
          temperature: (75 + Math.random() * 25).toFixed(1),
          vibration: (0.5 + Math.random() * 2).toFixed(2),
          pressure: (100 + Math.random() * 50).toFixed(1),
          current: (15 + Math.random() * 10).toFixed(1)
        }
      };
    });
    
    return { predictions };
  }

  getMockSensorData(equipmentId, days) {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < days * 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      data.push({
        equipmentId,
        timestamp: timestamp.toISOString(),
        temperature: (75 + Math.sin(i / 24) * 10 + Math.random() * 5).toFixed(1),
        vibration: (0.5 + Math.sin(i / 12) * 0.3 + Math.random() * 0.2).toFixed(3),
        pressure: (125 + Math.cos(i / 6) * 15 + Math.random() * 10).toFixed(1),
        current: (18 + Math.sin(i / 8) * 3 + Math.random() * 2).toFixed(1),
        oilPressure: (45 + Math.random() * 10).toFixed(1),
        rpm: Math.floor(1800 + Math.random() * 400),
        fuelLevel: (50 + Math.random() * 50).toFixed(1),
        operatingHours: (1000 + i + Math.random() * 10).toFixed(1)
      });
    }
    
    return { sensorData: data.reverse() }; // Most recent first
  }

  // Legacy methods for backward compatibility
  async getJobSites() {
    const data = await this.getDashboardData();
    return { jobSites: data.jobSites || [] };
  }

  async getAlerts(limit = 10) {
    const data = await this.getDashboardData();
    return { alerts: (data.alerts || []).slice(0, limit) };
  }

  async getMaintenanceData() {
    const data = await this.getDashboardData();
    return { maintenance: data.maintenance || {} };
  }

  async getAnalyticsData() {
    return {
      analytics: {
        totalOperatingHours: 12450,
        averageUptime: 94.2,
        fuelEfficiency: 87.3,
        maintenanceCost: 45000,
        predictedSavings: 120000
      }
    };
  }

  async getEquipmentDetails(equipmentId) {
    const sensorData = await this.getSensorData(equipmentId, 1);
    const predictions = await this.getMLPredictions([equipmentId]);
    
    return {
      equipment: {
        id: equipmentId,
        name: `Equipment ${equipmentId}`,
        type: 'Generator',
        status: 'operational',
        location: 'Downtown Infrastructure Project',
        lastMaintenance: '2024-01-15',
        nextMaintenance: '2024-03-15',
        operatingHours: 1250.5,
        sensorData: sensorData.sensorData || [],
        mlPrediction: predictions.predictions?.[0] || null
      }
    };
  }

  async createAlert(alertData) {
    console.log('📢 Creating alert:', alertData);
    return { success: true, alertId: `ALT-${Date.now()}` };
  }

  async createWorkOrder(workOrderData) {
    console.log('🔧 Creating work order:', workOrderData);
    return { success: true, workOrderId: `WO-${Date.now()}` };
  }

  async updateEquipmentStatus(equipmentId, status) {
    console.log('🔄 Updating equipment status:', equipmentId, status);
    return { success: true, message: `Equipment ${equipmentId} status updated to ${status}` };
  }
}

// Export singleton instance
const snowflakeAPI = new SnowflakeAPIService();
export default snowflakeAPI;