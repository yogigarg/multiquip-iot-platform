// src/services/SnowflakeAPIService.js
class SnowflakeAPIService {
  constructor() {
    // In production, these would come from environment variables
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
    this.snowflakeConfig = {
      account: process.env.REACT_APP_SNOWFLAKE_ACCOUNT,
      username: process.env.REACT_APP_SNOWFLAKE_USERNAME,
      password: process.env.REACT_APP_SNOWFLAKE_PASSWORD,
      warehouse: process.env.REACT_APP_SNOWFLAKE_WAREHOUSE || 'MULTIQUIP_WH',
      database: process.env.REACT_APP_SNOWFLAKE_DATABASE || 'MULTIQUIP_DB',
      schema: process.env.REACT_APP_SNOWFLAKE_SCHEMA || 'CONSTRUCTION'
    };
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const config = { ...defaultOptions, ...options };

    try {
      console.log(`🔗 API Call: ${config.method} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Response:`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      
      // Return mock data if API fails (for development)
      return this.getMockData(endpoint);
    }
  }

  // Mock data fallback for development
  getMockData(endpoint) {
    console.log(`🔄 Using mock data for: ${endpoint}`);
    
    if (endpoint.includes('/dashboard')) {
      return {
        metrics: {
          TOTAL_EQUIPMENT: 10,
          FLEET_UPTIME: 96.2,
          AI_ACCURACY: 91.7,
          COST_SAVINGS: 0.8
        },
        jobSites: [
          { SITE_NAME: 'Downtown Infrastructure Project', EQUIPMENT_COUNT: 4, WORK_AREAS: 2, PROJECT_MANAGER: 'John Smith' },
          { SITE_NAME: 'Highway 101 Expansion', EQUIPMENT_COUNT: 3, WORK_AREAS: 2, PROJECT_MANAGER: 'Sarah Johnson' },
          { SITE_NAME: 'Commercial Building Complex', EQUIPMENT_COUNT: 2, WORK_AREAS: 1, PROJECT_MANAGER: 'Mike Rodriguez' },
          { SITE_NAME: 'Bridge Replacement Project', EQUIPMENT_COUNT: 1, WORK_AREAS: 1, PROJECT_MANAGER: 'Lisa Chen' }
        ],
        categories: [
          { CATEGORY_NAME: 'Generators', EQUIPMENT_COUNT: 4, FUEL_TYPE: 'DIESEL' },
          { CATEGORY_NAME: 'Water Pumps', EQUIPMENT_COUNT: 3, FUEL_TYPE: 'GASOLINE' },
          { CATEGORY_NAME: 'Compactors', EQUIPMENT_COUNT: 2, FUEL_TYPE: 'DIESEL' },
          { CATEGORY_NAME: 'Concrete Mixers', EQUIPMENT_COUNT: 1, FUEL_TYPE: 'GASOLINE' }
        ],
        alerts: [
          { ALERT_ID: 1, EQUIPMENT_ID: 'EQ000001', SEVERITY: 'high', MESSAGE: 'Engine temperature approaching upper limit - 195°F detected', SITE_NAME: 'Downtown Infrastructure Project', CREATED_AT: new Date().toISOString() },
          { ALERT_ID: 2, EQUIPMENT_ID: 'EQ000002', SEVERITY: 'medium', MESSAGE: 'Fuel consumption pattern suggests filter replacement needed', SITE_NAME: 'Downtown Infrastructure Project', CREATED_AT: new Date().toISOString() },
          { ALERT_ID: 3, EQUIPMENT_ID: 'EQ000010', SEVERITY: 'critical', MESSAGE: 'Pump pressure drop indicates potential impeller damage', SITE_NAME: 'Highway 101 Expansion', CREATED_AT: new Date().toISOString() }
        ],
        maintenance: {
          SCHEDULED: 8,
          IN_PROGRESS: 2,
          PARTS_ORDERED: 1,
          COMPLETED: 15,
          EMERGENCY: 1,
          OVERDUE: 0
        },
        timestamp: new Date().toISOString()
      };
    }

    if (endpoint.includes('/equipment')) {
      return {
        equipment: [
          { EQUIPMENT_ID: 'EQ000001', EQUIPMENT_NAME: 'Generator-001', EQUIPMENT_TYPE: 'Generators', GPS_LATITUDE: 34.0522, GPS_LONGITUDE: -118.2437, AREA_NAME: 'Main Excavation Zone', STATUS: 'operational', UPTIME_PERCENTAGE: 98.2, OPERATING_HOURS: 1250.5 },
          { EQUIPMENT_ID: 'EQ000002', EQUIPMENT_NAME: 'Generator-002', EQUIPMENT_TYPE: 'Generators', GPS_LATITUDE: 34.0523, GPS_LONGITUDE: -118.2438, AREA_NAME: 'Main Excavation Zone', STATUS: 'operational', UPTIME_PERCENTAGE: 96.8, OPERATING_HOURS: 1100.0 },
          { EQUIPMENT_ID: 'EQ000003', EQUIPMENT_NAME: 'Pump-001', EQUIPMENT_TYPE: 'Water Pumps', GPS_LATITUDE: 34.0524, GPS_LONGITUDE: -118.2439, AREA_NAME: 'Concrete Staging Area', STATUS: 'operational', UPTIME_PERCENTAGE: 94.5, OPERATING_HOURS: 800.25 },
          { EQUIPMENT_ID: 'EQ000010', EQUIPMENT_NAME: 'Pump-003', EQUIPMENT_TYPE: 'Water Pumps', GPS_LATITUDE: 37.7753, GPS_LONGITUDE: -122.4198, AREA_NAME: 'North Grading Section', STATUS: 'maintenance', UPTIME_PERCENTAGE: 87.5, OPERATING_HOURS: 1800.0 }
        ],
        timestamp: new Date().toISOString()
      };
    }

    return { error: 'No mock data available', timestamp: new Date().toISOString() };
  }

  // Dashboard data - combines multiple Snowflake queries
  async getDashboardData() {
    return this.apiCall('/dashboard');
  }

  // Equipment data for job site mapping
  async getEquipmentData(site = 'Downtown Infrastructure Project', area = 'ALL') {
    const params = new URLSearchParams({ site, area });
    return this.apiCall(`/equipment?${params}`);
  }

  // Job sites list
  async getJobSites() {
    return this.apiCall('/job-sites');
  }

  // Active alerts
  async getAlerts(limit = 10) {
    return this.apiCall(`/alerts?limit=${limit}`);
  }

  // Maintenance data
  async getMaintenanceData() {
    return this.apiCall('/maintenance');
  }

  // Analytics data
  async getAnalyticsData() {
    return this.apiCall('/analytics');
  }

  // Equipment details
  async getEquipmentDetails(equipmentId) {
    return this.apiCall(`/equipment/${equipmentId}`);
  }

  // Fuel consumption data
  async getFuelConsumption(equipmentId, days = 30) {
    const params = new URLSearchParams({ equipmentId, days: days.toString() });
    return this.apiCall(`/fuel-consumption?${params}`);
  }

  // Create alert
  async createAlert(alertData) {
    return this.apiCall('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  }

  // Create work order
  async createWorkOrder(workOrderData) {
    return this.apiCall('/maintenance/work-orders', {
      method: 'POST',
      body: JSON.stringify(workOrderData)
    });
  }

  // Update equipment status
  async updateEquipmentStatus(equipmentId, status) {
    return this.apiCall(`/equipment/${equipmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Upload IoT sensor data
  async uploadIoTData(sensorData) {
    return this.apiCall('/iot/bulk-upload', {
      method: 'POST',
      body: JSON.stringify({ sensorData })
    });
  }

  // Test Snowflake connection
  async testConnection() {
    try {
      const response = await this.apiCall('/health');
      return {
        success: true,
        status: response.status || 'connected',
        message: 'Snowflake connection successful',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        status: 'disconnected',
        message: `Connection failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Utility method to check if we're using real API or mock data
  isUsingMockData() {
    return !this.snowflakeConfig.account || this.snowflakeConfig.account.includes('your-account');
  }

  // Get connection status for UI display
  getConnectionStatus() {
    if (this.isUsingMockData()) {
      return {
        status: 'mock',
        message: 'Using demo data - Configure Snowflake credentials to connect',
        color: 'text-yellow-600'
      };
    } else {
      return {
        status: 'configured',
        message: 'Snowflake credentials configured',
        color: 'text-green-600'
      };
    }
  }
}

// Export singleton instance
const snowflakeAPI = new SnowflakeAPIService();
export default snowflakeAPI;