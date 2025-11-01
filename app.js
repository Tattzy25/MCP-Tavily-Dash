// MCP-Tavily Dashboard Application
// Main JavaScript file for handling API calls, UI updates, and real-time monitoring

// ============================================================================
// Application State Management
// ============================================================================

const AppState = {
  apiEndpoint: 'http://localhost:8000',
  refreshRate: 5000,
  autoRefresh: true,
  demoMode: true,
  theme: 'auto',
  currentSection: 'dashboard',
  charts: {},
  refreshInterval: null,
  lastUpdate: null,
  serverStatus: 'offline',
  
  // In-memory data storage (no localStorage due to sandbox restrictions)
  metricsData: null,
  connectionsData: [],
  toolsData: [],
  logsData: [],
};

// ============================================================================
// Mock Data (Used when API is unavailable or demo mode is enabled)
// ============================================================================

const MockData = {
  metrics: {
    server_status: 'online',
    uptime_hours: 24,
    total_connections: 156,
    active_connections: 3,
    total_requests: 2843,
    successful_requests: 2756,
    failed_requests: 87,
    average_response_time: 245,
    tools_available: 12,
    redis_status: 'connected',
    redis_latency: 2,
  },
  
  connections: [
    {
      id: 'conn_001',
      connected_at: '2025-11-01T10:15:32Z',
      duration_seconds: 3600,
      status: 'connected',
      tools_used: ['tavily-search', 'web-scrape'],
    },
    {
      id: 'conn_002',
      connected_at: '2025-11-01T10:30:15Z',
      duration_seconds: 1800,
      status: 'disconnected',
      tools_used: ['tavily-search'],
    },
    {
      id: 'conn_003',
      connected_at: '2025-11-01T10:45:22Z',
      duration_seconds: 900,
      status: 'connected',
      tools_used: ['web-scrape'],
    },
  ],
  
  tools: [
    {
      name: 'tavily-search',
      description: 'Web search using Tavily API',
      call_count: 1203,
      success_rate: 99.2,
      avg_response_time: 215,
    },
    {
      name: 'web-scrape',
      description: 'Extract content from web pages',
      call_count: 542,
      success_rate: 97.8,
      avg_response_time: 312,
    },
  ],
  
  logs: [
    {
      timestamp: '2025-11-01T10:45:22Z',
      level: 'INFO',
      message: 'New connection established: conn_003',
    },
    {
      timestamp: '2025-11-01T10:44:15Z',
      level: 'INFO',
      message: 'Tool execution: tavily-search (215ms)',
    },
    {
      timestamp: '2025-11-01T10:43:01Z',
      level: 'WARNING',
      message: 'High response time detected: 1200ms',
    },
    {
      timestamp: '2025-11-01T10:42:33Z',
      level: 'INFO',
      message: 'Redis ping successful (2ms)',
    },
  ],
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchMetrics() {
  if (AppState.demoMode) {
    return MockData.metrics;
  }
  
  try {
    const response = await fetch(`${AppState.apiEndpoint}/api/metrics`);
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return MockData.metrics;
  }
}

async function fetchConnections() {
  if (AppState.demoMode) {
    return MockData.connections;
  }
  
  try {
    const response = await fetch(`${AppState.apiEndpoint}/api/connections`);
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return MockData.connections;
  }
}

async function fetchTools() {
  if (AppState.demoMode) {
    return MockData.tools;
  }
  
  try {
    const response = await fetch(`${AppState.apiEndpoint}/api/tools`);
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return MockData.tools;
  }
}

async function fetchLogs() {
  if (AppState.demoMode) {
    return MockData.logs;
  }
  
  try {
    const response = await fetch(`${AppState.apiEndpoint}/api/logs`);
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return MockData.logs;
  }
}

async function checkHealth() {
  try {
    const startTime = Date.now();
    const response = await fetch(`${AppState.apiEndpoint}/health`);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, responseTime, data };
    }
    return { success: false, error: 'Health check failed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// UI Update Functions
// ============================================================================

function updateServerStatus(status) {
  AppState.serverStatus = status;
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  if (status === 'online') {
    statusDot.classList.add('online');
    statusDot.classList.remove('offline');
    statusText.textContent = 'Connected';
  } else {
    statusDot.classList.remove('online');
    statusDot.classList.add('offline');
    statusText.textContent = 'Offline';
  }
}

function updateLastUpdate() {
  const now = new Date();
  AppState.lastUpdate = now;
  const timeString = now.toLocaleTimeString();
  document.getElementById('lastUpdate').textContent = `Updated: ${timeString}`;
}

function updateDashboardMetrics(metrics) {
  document.getElementById('metricServerStatus').textContent = 
    metrics.server_status === 'online' ? 'Online' : 'Offline';
  
  const hours = Math.floor(metrics.uptime_hours);
  const minutes = Math.floor((metrics.uptime_hours - hours) * 60);
  document.getElementById('metricUptime').textContent = 
    `Uptime: ${hours}h ${minutes}m`;
  
  document.getElementById('metricTotalConnections').textContent = 
    metrics.total_connections.toLocaleString();
  document.getElementById('metricActiveConnections').textContent = 
    metrics.active_connections;
  
  document.getElementById('metricTotalRequests').textContent = 
    metrics.total_requests.toLocaleString();
  document.getElementById('metricSuccessRequests').textContent = 
    metrics.successful_requests.toLocaleString();
  document.getElementById('metricFailedRequests').textContent = 
    metrics.failed_requests.toLocaleString();
  
  document.getElementById('metricAvgResponse').textContent = 
    `${metrics.average_response_time}ms`;
  
  document.getElementById('metricToolsAvailable').textContent = 
    metrics.tools_available;
  
  document.getElementById('metricRedisStatus').textContent = 
    metrics.redis_status === 'connected' ? 'Connected' : 'Disconnected';
  document.getElementById('metricRedisLatency').textContent = 
    `${metrics.redis_latency}ms`;
  
  updateServerStatus(metrics.server_status);
}

function updateHealthStatus(metrics) {
  const serverStatus = document.getElementById('healthServerStatus');
  serverStatus.textContent = metrics.server_status === 'online' ? 'Online' : 'Offline';
  serverStatus.className = `status ${metrics.server_status}`;
  
  const hours = Math.floor(metrics.uptime_hours);
  const minutes = Math.floor((metrics.uptime_hours - hours) * 60);
  document.getElementById('healthUptime').textContent = `${hours}h ${minutes}m`;
  document.getElementById('healthLastChecked').textContent = 
    new Date().toLocaleTimeString();
  
  const redisStatus = document.getElementById('healthRedisStatus');
  redisStatus.textContent = metrics.redis_status === 'connected' ? 'Connected' : 'Disconnected';
  redisStatus.className = `status ${metrics.redis_status}`;
  
  document.getElementById('healthRedisLatency').textContent = 
    `${metrics.redis_latency}ms`;
  document.getElementById('healthRedisConnection').textContent = 
    metrics.redis_status === 'connected' ? 'Active' : 'Inactive';
  
  const apiStatus = document.getElementById('healthApiStatus');
  apiStatus.textContent = metrics.server_status === 'online' ? 'Online' : 'Offline';
  apiStatus.className = `status ${metrics.server_status}`;
  
  document.getElementById('healthApiResponseTime').textContent = 
    `${metrics.average_response_time}ms`;
  document.getElementById('healthApiEndpoint').textContent = AppState.apiEndpoint;
}

function updateConnectionsTable(connections) {
  const tbody = document.getElementById('connectionsTableBody');
  const filter = document.getElementById('connectionFilter').value;
  
  let filteredConnections = connections;
  if (filter !== 'all') {
    filteredConnections = connections.filter(conn => conn.status === filter);
  }
  
  if (filteredConnections.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No connections found</td></tr>';
    return;
  }
  
  tbody.innerHTML = filteredConnections.map(conn => {
    const connectedDate = new Date(conn.connected_at);
    const duration = formatDuration(conn.duration_seconds);
    const statusClass = conn.status === 'connected' ? 'status connected' : 'status disconnected';
    
    return `
      <tr>
        <td>${conn.id}</td>
        <td>${connectedDate.toLocaleString()}</td>
        <td>${duration}</td>
        <td><span class="${statusClass}">${conn.status}</span></td>
        <td>${conn.tools_used.join(', ')}</td>
      </tr>
    `;
  }).join('');
}

function updateToolsGrid(tools) {
  const grid = document.getElementById('toolsGrid');
  const sortBy = document.getElementById('toolsSortBy').value;
  
  let sortedTools = [...tools];
  switch (sortBy) {
    case 'calls':
      sortedTools.sort((a, b) => b.call_count - a.call_count);
      break;
    case 'name':
      sortedTools.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'success':
      sortedTools.sort((a, b) => b.success_rate - a.success_rate);
      break;
  }
  
  grid.innerHTML = sortedTools.map(tool => `
    <div class="tool-card">
      <div class="tool-header">
        <div class="tool-name">${tool.name}</div>
      </div>
      <div class="tool-description">${tool.description}</div>
      <div class="tool-stats">
        <div class="tool-stat">
          <span class="tool-stat-value">${tool.call_count.toLocaleString()}</span>
          <span class="tool-stat-label">Calls</span>
        </div>
        <div class="tool-stat">
          <span class="tool-stat-value">${tool.success_rate}%</span>
          <span class="tool-stat-label">Success</span>
        </div>
        <div class="tool-stat">
          <span class="tool-stat-value">${tool.avg_response_time}ms</span>
          <span class="tool-stat-label">Avg Time</span>
        </div>
      </div>
    </div>
  `).join('');
}

function updateLogsContainer(logs) {
  const container = document.getElementById('logsContainer');
  const searchTerm = document.getElementById('logSearch').value.toLowerCase();
  const levelFilter = document.getElementById('logLevelFilter').value;
  const autoScroll = document.getElementById('autoScrollLogs').checked;
  
  let filteredLogs = logs;
  
  if (levelFilter !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.level === levelFilter);
  }
  
  if (searchTerm) {
    filteredLogs = filteredLogs.filter(log => 
      log.message.toLowerCase().includes(searchTerm)
    );
  }
  
  container.innerHTML = filteredLogs.map(log => {
    const date = new Date(log.timestamp);
    const timeString = date.toLocaleTimeString();
    const levelClass = `log-${log.level.toLowerCase()}`;
    
    return `
      <div class="log-entry ${levelClass}">
        <span class="log-time">${timeString}</span>
        <span class="log-level">${log.level}</span>
        <span class="log-message">${log.message}</span>
      </div>
    `;
  }).join('');
  
  if (autoScroll) {
    container.scrollTop = container.scrollHeight;
  }
}

// ============================================================================
// Chart Initialization and Updates
// ============================================================================

function initializeCharts() {
  // Success Rate Donut Chart
  const successCtx = document.getElementById('successRateChart').getContext('2d');
  AppState.charts.successRate = new Chart(successCtx, {
    type: 'doughnut',
    data: {
      labels: ['Successful', 'Failed'],
      datasets: [{
        data: [97, 3],
        backgroundColor: ['#1FB8CD', '#FFC185'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--color-text').trim(),
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed}%`;
            }
          }
        }
      }
    }
  });
  
  // Response Time Bar Chart
  const responseCtx = document.getElementById('responseTimeChart').getContext('2d');
  AppState.charts.responseTime = new Chart(responseCtx, {
    type: 'bar',
    data: {
      labels: ['tavily-search', 'web-scrape', 'other'],
      datasets: [{
        label: 'Response Time (ms)',
        data: [215, 312, 245],
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C'],
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--color-text-secondary').trim()
          },
          grid: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--color-border').trim()
          }
        },
        x: {
          ticks: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--color-text-secondary').trim()
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function updateCharts(metrics) {
  if (!AppState.charts.successRate || !AppState.charts.responseTime) return;
  
  // Update success rate chart
  const successRate = (metrics.successful_requests / metrics.total_requests * 100).toFixed(1);
  const failureRate = (100 - successRate).toFixed(1);
  
  AppState.charts.successRate.data.datasets[0].data = [successRate, failureRate];
  AppState.charts.successRate.update();
}

// ============================================================================
// Data Refresh Functions
// ============================================================================

async function refreshDashboard() {
  try {
    const metrics = await fetchMetrics();
    AppState.metricsData = metrics;
    updateDashboardMetrics(metrics);
    updateCharts(metrics);
    updateLastUpdate();
  } catch (error) {
    console.error('Error refreshing dashboard:', error);
  }
}

async function refreshHealth() {
  try {
    const metrics = await fetchMetrics();
    updateHealthStatus(metrics);
    updateLastUpdate();
  } catch (error) {
    console.error('Error refreshing health:', error);
  }
}

async function refreshConnections() {
  try {
    const connections = await fetchConnections();
    AppState.connectionsData = connections;
    updateConnectionsTable(connections);
    updateLastUpdate();
  } catch (error) {
    console.error('Error refreshing connections:', error);
  }
}

async function refreshTools() {
  try {
    const tools = await fetchTools();
    AppState.toolsData = tools;
    updateToolsGrid(tools);
    updateLastUpdate();
  } catch (error) {
    console.error('Error refreshing tools:', error);
  }
}

async function refreshLogs() {
  try {
    const logs = await fetchLogs();
    AppState.logsData = logs;
    updateLogsContainer(logs);
    updateLastUpdate();
  } catch (error) {
    console.error('Error refreshing logs:', error);
  }
}

async function refreshCurrentSection() {
  switch (AppState.currentSection) {
    case 'dashboard':
      await refreshDashboard();
      break;
    case 'health':
      await refreshHealth();
      break;
    case 'connections':
      await refreshConnections();
      break;
    case 'tools':
      await refreshTools();
      break;
    case 'logs':
      await refreshLogs();
      break;
  }
}

function startAutoRefresh() {
  if (AppState.refreshInterval) {
    clearInterval(AppState.refreshInterval);
  }
  
  if (AppState.autoRefresh) {
    AppState.refreshInterval = setInterval(() => {
      refreshCurrentSection();
    }, AppState.refreshRate);
  }
}

function stopAutoRefresh() {
  if (AppState.refreshInterval) {
    clearInterval(AppState.refreshInterval);
    AppState.refreshInterval = null;
  }
}

// ============================================================================
// Navigation Functions
// ============================================================================

function switchSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show selected section
  document.getElementById(`${sectionName}-section`).classList.add('active');
  
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.section === sectionName) {
      item.classList.add('active');
    }
  });
  
  // Update current section
  AppState.currentSection = sectionName;
  
  // Refresh section data
  refreshCurrentSection();
}

// ============================================================================
// Theme Functions
// ============================================================================

function applyTheme(theme) {
  if (theme === 'auto') {
    // Remove manual theme attribute to use system preference
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  AppState.theme = theme;
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (!currentTheme || currentTheme === 'dark') {
    applyTheme('light');
  } else {
    applyTheme('dark');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
  // Sidebar toggle
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
  
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      switchSection(section);
    });
  });
  
  // Refresh buttons
  document.getElementById('refreshDashboard').addEventListener('click', refreshDashboard);
  document.getElementById('refreshHealth').addEventListener('click', refreshHealth);
  
  // Connection filter
  document.getElementById('connectionFilter').addEventListener('change', () => {
    updateConnectionsTable(AppState.connectionsData);
  });
  
  // Tools sort
  document.getElementById('toolsSortBy').addEventListener('change', () => {
    updateToolsGrid(AppState.toolsData);
  });
  
  // Log search and filter
  document.getElementById('logSearch').addEventListener('input', () => {
    updateLogsContainer(AppState.logsData);
  });
  
  document.getElementById('logLevelFilter').addEventListener('change', () => {
    updateLogsContainer(AppState.logsData);
  });
  
  // Clear logs
  document.getElementById('clearLogs').addEventListener('click', () => {
    AppState.logsData = [];
    updateLogsContainer([]);
  });
  
  // Settings
  document.getElementById('testConnection').addEventListener('click', async () => {
    const resultDiv = document.getElementById('testResult');
    const endpoint = document.getElementById('apiEndpointInput').value || AppState.apiEndpoint;
    
    resultDiv.textContent = 'Testing connection...';
    resultDiv.className = 'test-result';
    resultDiv.style.display = 'block';
    
    const originalEndpoint = AppState.apiEndpoint;
    AppState.apiEndpoint = endpoint;
    
    const result = await checkHealth();
    
    if (result.success) {
      resultDiv.textContent = `Connection successful! Response time: ${result.responseTime}ms`;
      resultDiv.classList.add('success');
    } else {
      resultDiv.textContent = `Connection failed: ${result.error}`;
      resultDiv.classList.add('error');
      AppState.apiEndpoint = originalEndpoint;
    }
  });
  
  document.getElementById('refreshRateSelect').addEventListener('change', (e) => {
    AppState.refreshRate = parseInt(e.target.value);
    if (AppState.autoRefresh) {
      startAutoRefresh();
    }
  });
  
  document.getElementById('autoRefreshToggle').addEventListener('change', (e) => {
    AppState.autoRefresh = e.target.checked;
    if (AppState.autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });
  
  document.getElementById('themeSelect').addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });
  
  document.getElementById('demoModeToggle').addEventListener('change', (e) => {
    AppState.demoMode = e.target.checked;
    refreshCurrentSection();
  });
}

// ============================================================================
// Application Initialization
// ============================================================================

async function initializeApp() {
  console.log('Initializing MCP-Tavily Dashboard...');
  
  // Setup event listeners
  setupEventListeners();
  
  // Set initial API endpoint in settings
  document.getElementById('apiEndpointInput').value = AppState.apiEndpoint;
  
  // Initialize charts
  initializeCharts();
  
  // Load initial data
  await refreshDashboard();
  
  // Start auto-refresh
  startAutoRefresh();
  
  console.log('Dashboard initialized successfully!');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}