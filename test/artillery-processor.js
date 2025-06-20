// Artillery Processor for Advanced Load Testing
const crypto = require('crypto');

// Custom metrics tracking
let metrics = {
  cacheHits: 0,
  cacheMisses: 0,
  newUrls: 0,
  infoRequests: 0,
  trackedRedirects: 0,
  expiredAccess: 0,
  notFound: 0,
  totalRequests: 0,
  responseTimeSum: 0,
  errors: 0
};

// Performance tracking
const performanceData = {
  responseTimesByEndpoint: {},
  errorsByType: {},
  cachePerformance: {
    hits: [],
    misses: []
  }
};

module.exports = {
  // Generate random expiry date (1-30 days from now)
  generateExpiryDate: function(userContext, events, done) {
    const now = new Date();
    const daysToAdd = Math.floor(Math.random() * 30) + 1;
    const expiryDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    userContext.vars.expiryDate = expiryDate.toISOString();
    return done();
  },

  // Record cache hit/miss
  recordCacheHit: function(requestParams, response, context, ee, next) {
    metrics.totalRequests++;
    metrics.responseTimeSum += response.timings.phases.total;
    
    const responseTime = response.timings.phases.total;
    
    // Handle 404 responses (URL not found)
    if (response.statusCode === 404) {
      metrics.notFound++;
      ee.emit('counter', 'cache.notfound', 1);
      ee.emit('customMetric', 'notfound_response_time', responseTime);
      return next();
    }
    
    const cacheStatus = response.headers['x-cache'] || 'MISS';
    
    if (cacheStatus.includes('HIT')) {
      metrics.cacheHits++;
      performanceData.cachePerformance.hits.push(responseTime);
      
      // Emit custom metric for cache hits
      ee.emit('customMetric', 'cache_hit_response_time', responseTime);
      ee.emit('counter', 'cache.hits', 1);
    } else {
      metrics.cacheMisses++;
      performanceData.cachePerformance.misses.push(responseTime);
      
      ee.emit('customMetric', 'cache_miss_response_time', responseTime);
      ee.emit('counter', 'cache.misses', 1);
    }
    
    // Calculate and emit cache hit rate (excluding 404s)
    const totalCacheRequests = metrics.cacheHits + metrics.cacheMisses;
    if (totalCacheRequests > 0) {
      const hitRate = (metrics.cacheHits / totalCacheRequests) * 100;
      ee.emit('customMetric', 'cache_hit_rate', hitRate);
    }
    
    // Track endpoint response time
    const endpoint = requestParams.url || '/';
    if (!performanceData.responseTimesByEndpoint[endpoint]) {
      performanceData.responseTimesByEndpoint[endpoint] = [];
    }
    performanceData.responseTimesByEndpoint[endpoint].push(responseTime);
    
    // Emit custom metrics
    ee.emit('customMetric', 'redirect_response_time', responseTime);
    
    return next();
  },

  // Record new URL creation
  recordNewUrl: function(requestParams, response, context, ee, next) {
    metrics.totalRequests++;
    metrics.newUrls++;
    
    const responseTime = response.timings.phases.total;
    metrics.responseTimeSum += responseTime;
    
    ee.emit('counter', 'urls.created', 1);
    ee.emit('customMetric', 'create_url_response_time', responseTime);
    
    // Track creation rate
    ee.emit('rate', 'url_creation_rate');
    
    return next();
  },

  // Record info request
  recordInfoRequest: function(requestParams, response, context, ee, next) {
    metrics.totalRequests++;
    metrics.infoRequests++;
    
    const responseTime = response.timings.phases.total;
    metrics.responseTimeSum += responseTime;
    
    ee.emit('counter', 'info.requests', 1);
    ee.emit('customMetric', 'info_response_time', responseTime);
    
    return next();
  },

  // Record tracked redirect
  recordTrackedRedirect: function(requestParams, response, context, ee, next) {
    metrics.totalRequests++;
    metrics.trackedRedirects++;
    
    const responseTime = response.timings.phases.total;
    metrics.responseTimeSum += responseTime;
    
    ee.emit('counter', 'redirects.tracked', 1);
    ee.emit('customMetric', 'tracked_redirect_response_time', responseTime);
    
    return next();
  },

  // Record expired URL access
  recordExpiredAccess: function(requestParams, response, context, ee, next) {
    metrics.totalRequests++;
    metrics.expiredAccess++;
    
    const responseTime = response.timings.phases.total;
    metrics.responseTimeSum += responseTime;
    
    ee.emit('counter', 'expired.access', 1);
    ee.emit('customMetric', 'expired_response_time', responseTime);
    
    return next();
  },

  // Record not found
  recordNotFound: function(requestParams, response, context, ee, next) {
    metrics.totalRequests++;
    metrics.notFound++;
    
    const responseTime = response.timings.phases.total;
    metrics.responseTimeSum += responseTime;
    
    ee.emit('counter', 'notfound.requests', 1);
    ee.emit('customMetric', 'notfound_response_time', responseTime);
    
    return next();
  },

  // Error tracking
  onError: function(error, context, ee, next) {
    metrics.errors++;
    
    const errorType = error.code || error.message || 'unknown';
    if (!performanceData.errorsByType[errorType]) {
      performanceData.errorsByType[errorType] = 0;
    }
    performanceData.errorsByType[errorType]++;
    
    // Calculate error rate
    const errorRate = (metrics.errors / metrics.totalRequests) * 100;
    ee.emit('customMetric', 'error_rate', errorRate);
    ee.emit('counter', 'errors.total', 1);
    ee.emit('counter', `errors.${errorType}`, 1);
    
    return next();
  },

  // Generate performance report
  generateReport: function(userContext, events, done) {
    const report = {
      summary: {
        totalRequests: metrics.totalRequests,
        averageResponseTime: metrics.responseTimeSum / metrics.totalRequests,
        cacheHitRate: (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100,
        errorRate: (metrics.errors / metrics.totalRequests) * 100
      },
      breakdown: {
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
        newUrls: metrics.newUrls,
        infoRequests: metrics.infoRequests,
        trackedRedirects: metrics.trackedRedirects,
        expiredAccess: metrics.expiredAccess,
        notFound: metrics.notFound,
        errors: metrics.errors
      },
      performance: {
        cacheHitAvgTime: average(performanceData.cachePerformance.hits),
        cacheMissAvgTime: average(performanceData.cachePerformance.misses),
        endpointTimes: Object.keys(performanceData.responseTimesByEndpoint).map(endpoint => ({
          endpoint,
          avgTime: average(performanceData.responseTimesByEndpoint[endpoint]),
          count: performanceData.responseTimesByEndpoint[endpoint].length
        }))
      },
      errors: performanceData.errorsByType
    };
    
    console.log('\n=== ADVANCED LOAD TEST REPORT ===');
    console.log(JSON.stringify(report, null, 2));
    
    return done();
  }
};

// Helper functions
function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Reset metrics function
function resetMetrics() {
  metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    newUrls: 0,
    infoRequests: 0,
    trackedRedirects: 0,
    expiredAccess: 0,
    notFound: 0,
    totalRequests: 0,
    responseTimeSum: 0,
    errors: 0
  };
} 