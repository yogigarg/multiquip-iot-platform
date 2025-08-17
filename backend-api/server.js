// backend-api/server.js
const express = require('express');
const cors = require('cors');
const snowflake = require('snowflake-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for development
const mockData = {
  dashboard: {
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
  }
};

// Snowflake connection configuration
let snowflakeConnection = null;

// Helper function to clean Snowflake account URL
const cleanSnowflakeAccount = (account) => {
  if (!account) return account;
  
  // Remove duplicate .snowflakecomputing.com suffixes
  let cleanAccount = account.toLowerCase().trim();
  
  // If it already has .snowflakecomputing.com, don't add it again
  if (cleanAccount.endsWith('.snowflakecomputing.com')) {
    // Remove any double .snowflakecomputing.com
    cleanAccount = cleanAccount.replace(/\.snowflakecomputing\.com\.snowflakecomputing\.com$/, '.snowflakecomputing.com');
    // Extract just the account identifier part
    cleanAccount = cleanAccount.replace(/\.snowflakecomputing\.com$/, '');
  }
  
  console.log(`🔧 Cleaned account: ${account} → ${cleanAccount}`);
  return cleanAccount;
};

const connectToSnowflake = (config) => {
  return new Promise((resolve, reject) => {
    try {
      const cleanedAccount = cleanSnowflakeAccount(config.account);
      
      console.log('🔗 Connecting to Snowflake with config:');
      console.log(`   Account: ${cleanedAccount}`);
      console.log(`   Username: ${config.username}`);
      console.log(`   Warehouse: ${config.warehouse}`);
      console.log(`   Database: ${config.database}`);
      console.log(`   Schema: ${config.schema}`);
      
      const connection = snowflake.createConnection({
        account: cleanedAccount,
        username: config.username,
        password: config.password,
        warehouse: config.warehouse,
        database: config.database,
        schema: config.schema,
        // Add additional connection options for better reliability
        connectTimeout: 60000, // 60 seconds
        networkTimeout: 60000,
        queryTimeout: 60000,
        // Handle SSL issues
        insecureConnect: false,
        ocspFailOpen: true
      });

      connection.connect((err, conn) => {
        if (err) {
          console.error('❌ Failed to connect to Snowflake:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to Snowflake successfully');
          snowflakeConnection = conn;
          resolve(conn);
        }
      });
    } catch (error) {
      console.error('❌ Error creating Snowflake connection:', error);
      reject(error);
    }
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    snowflake: snowflakeConnection ? 'connected' : 'disconnected',
    endpoints: [
      'GET /api/health',
      'POST /api/snowflake/test-connection',
      'POST /api/snowflake/dashboard-data',
      'POST /api/snowflake/equipment-data',
      'POST /api/snowflake/sensor-data',
      'POST /api/ml/train-model',
      'POST /api/ml/predictions'
    ]
  });
});

// Test Snowflake connection
app.post('/api/snowflake/test-connection', async (req, res) => {
  try {
    console.log('🔗 Testing Snowflake connection...');
    const config = req.body;
    
    // Validate required fields
    if (!config.account || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Snowflake credentials (account, username, password)',
        timestamp: new Date().toISOString()
      });
    }
    
    await connectToSnowflake(config);
    
    res.json({
      success: true,
      message: 'Connected to Snowflake successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Snowflake connection failed:', error.message);
    
    // Return a successful response but indicate we're using mock data
    res.json({
      success: false,
      message: `Snowflake connection failed: ${error.message}. Using mock data.`,
      timestamp: new Date().toISOString(),
      fallback: 'mock_data'
    });
  }
});

// Get dashboard data
app.post('/api/snowflake/dashboard-data', async (req, res) => {
  try {
    console.log('📊 Loading dashboard data...');
    const config = req.body;
    
    // Try to connect to Snowflake if not connected
    if (!snowflakeConnection && config.account) {
      try {
        await connectToSnowflake(config);
        
        // If connected successfully, you could run real Snowflake queries here
        // For now, we'll still return mock data but with a connection indicator
        const data = { ...mockData.dashboard };
        data.dataSource = 'snowflake_connected_mock';
        
        return res.json(data);
      } catch (error) {
        console.log('⚠️ Snowflake connection failed, using mock data');
      }
    }
    
    // Return mock data
    const data = { ...mockData.dashboard };
    data.dataSource = 'mock';
    res.json(data);
    
  } catch (error) {
    console.error('❌ Error loading dashboard data:', error);
    // Return mock data on error
    res.json(mockData.dashboard);
  }
});

// Get equipment data for specific site
app.post('/api/snowflake/equipment-data', async (req, res) => {
  try {
    console.log('🏗️ Loading equipment data...');
    const { siteName } = req.body;
    
    // Generate mock equipment data
    const equipmentTypes = ['Generators', 'Water Pumps', 'Compactors', 'Mixers'];
    const statuses = ['operational', 'maintenance', 'critical', 'idle'];
    const areas = ['Excavation', 'Staging', 'Storage', 'Concrete', 'Assembly', 'Access'];
    
    const equipment = [];
    const count = Math.floor(Math.random() * 15) + 10; // 10-25 pieces
    
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
    
    res.json({ 
      equipment,
      siteName,
      dataSource: snowflakeConnection ? 'snowflake_connected_mock' : 'mock'
    });
  } catch (error) {
    console.error('❌ Error loading equipment data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sensor data for equipment
app.post('/api/snowflake/sensor-data', async (req, res) => {
  try {
    console.log('📊 Loading sensor data...');
    const { equipmentId, days = 7 } = req.body;
    
    // Generate mock sensor data
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
    
    res.json({ 
      sensorData: data.reverse(), // Most recent first
      equipmentId,
      days,
      dataSource: snowflakeConnection ? 'snowflake_connected_mock' : 'mock'
    });
  } catch (error) {
    console.error('❌ Error loading sensor data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ML Model Training endpoint
app.post('/api/ml/train-model', async (req, res) => {
  try {
    console.log('🧠 Starting ML model training...');
    
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const metrics = {
      accuracy: 0.92 + Math.random() * 0.05,
      precision: 0.89 + Math.random() * 0.05,
      recall: 0.85 + Math.random() * 0.05,
      f1Score: 0.87 + Math.random() * 0.05
    };
    
    console.log('✅ ML model training completed');
    
    res.json({
      success: true,
      message: 'Model training completed successfully',
      metrics: metrics,
      timestamp: new Date().toISOString(),
      dataSource: snowflakeConnection ? 'snowflake_connected_mock' : 'mock'
    });
  } catch (error) {
    console.error('❌ ML model training error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ML Predictions endpoint
app.post('/api/ml/predictions', async (req, res) => {
  try {
    console.log('🔮 Generating ML predictions...');
    const { equipmentIds = [] } = req.body;
    
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
    
    console.log(`✅ Generated ${predictions.length} predictions`);
    
    res.json({
      success: true,
      predictions: predictions,
      timestamp: new Date().toISOString(),
      dataSource: snowflakeConnection ? 'snowflake_connected_mock' : 'mock'
    });
  } catch (error) {
    console.error('❌ Error generating predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload sensor data
app.post('/api/snowflake/upload-sensor-data', async (req, res) => {
  try {
    console.log('📤 Uploading sensor data...');
    const { sensorReadings } = req.body;
    
    // Here you would insert into Snowflake
    // For now, just simulate success
    
    res.json({
      success: true,
      message: 'Sensor data uploaded successfully',
      recordsUploaded: sensorReadings.length,
      timestamp: new Date().toISOString(),
      dataSource: snowflakeConnection ? 'snowflake_connected_mock' : 'mock'
    });
  } catch (error) {
    console.error('❌ Error uploading sensor data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/health',
      'POST /api/snowflake/test-connection',
      'POST /api/snowflake/dashboard-data',
      'POST /api/snowflake/equipment-data',
      'POST /api/ml/train-model',
      'POST /api/ml/predictions'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Multiquip Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Snowflake endpoints ready`);
  console.log(`🧠 ML endpoints ready`);
  console.log(`\n🔧 To fix Snowflake connection:`);
  console.log(`   1. Check your .env file has correct account URL`);
  console.log(`   2. Account should be: pppxlve-ynb88788 (without .snowflakecomputing.com)`);
  console.log(`   3. Or use the full URL format your Snowflake admin provided`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  if (snowflakeConnection) {
    snowflakeConnection.destroy();
  }
  process.exit(0);
});