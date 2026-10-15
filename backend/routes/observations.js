const express = require('express');
const router = express.Router();
const axios = require('axios');
const Observation = require('../models/Observation');
const authMiddleware = require('../middleware/auth');

// Ensures explanations never show raw API error strings to users
function sanitizeAnalysisResult(result) {
  if (!result) return result;
  if (!result.explanation || result.explanation.includes('Error code:') || result.explanation.includes('Error generating explanation')) {
    const isAnom = result.anomaly?.detected;
    const score = result.anomaly?.score !== undefined ? Number(result.anomaly.score).toFixed(2) : '0.00';
    const reasons = result.anomaly?.reasons?.join(', ') || 'Observed telemetry falls within seasonal climatological bounds.';
    const topChunk = result.evidence?.[0];
    const topEvt = result.similar_events?.[0];

    let clean = `Seasonal baseline z-score analysis indicates ${isAnom ? 'an anomalous atmospheric deviation' : 'nominal atmospheric behavior'} with an anomaly score of ${score}σ (${reasons}).`;
    if (topChunk) {
      clean += ` Grounded in MEDA reference [${topChunk.chunk_id}]: "${topChunk.snippet.slice(0, 180)}..."`;
    }
    if (topEvt) {
      clean += ` Correlates with historical event ${topEvt.event_id} (${(topEvt.similarity * 100).toFixed(0)}% match).`;
    }
    result.explanation = clean;
  }
  return result;
}

// Get paginated observations with filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.is_anomaly !== undefined && req.query.is_anomaly !== '') {
      filter.is_anomaly = req.query.is_anomaly === 'true';
    }
    if (req.query.sol !== undefined && req.query.sol !== '') {
      filter.sol = parseInt(req.query.sol);
    }
    if (req.query.anomaly_type && req.query.anomaly_type !== 'all') {
      filter.anomaly_type = req.query.anomaly_type;
    }

    const observations = await Observation.find(filter)
      .sort({ sol: 1, ltst: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Observation.countDocuments(filter);

    const sanitizedObservations = observations.map(obs => {
      const obj = obs.toObject();
      if (obj.analysis_result) {
        obj.analysis_result = sanitizeAnalysisResult(obj.analysis_result);
      }
      return obj;
    });

    res.json({
      observations: sanitizedObservations,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      total
    });
  } catch (error) {
    console.error('Error fetching observations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get telemetry statistics and simulation event catalog
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const totalObservations = await Observation.countDocuments();
    const anomalyCount = await Observation.countDocuments({ is_anomaly: true });
    
    // Aggregation for anomaly types
    const anomalyTypes = await Observation.aggregate([
      { $match: { is_anomaly: true } },
      { $group: { _id: '$anomaly_type', count: { $sum: 1 }, sampleSol: { $first: '$sol' } } },
      { $sort: { count: -1 } }
    ]);

    // Distinct anomalous sols for quick navigation
    const anomalousSols = await Observation.distinct('sol', { is_anomaly: true });

    res.json({
      totalObservations,
      anomalyCount,
      normalCount: totalObservations - anomalyCount,
      anomalyPercentage: totalObservations > 0 ? ((anomalyCount / totalObservations) * 100).toFixed(1) : 0,
      solMin: 1,
      solMax: 100,
      anomalyTypes,
      anomalousSols: anomalousSols.sort((a, b) => a - b)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to load telemetry stats' });
  }
});

// Get a single observation
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const observation = await Observation.findById(req.params.id);
    if (!observation) return res.status(404).json({ error: 'Not found' });
    res.json(observation);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Analyze an observation
router.post('/:id/analyze', authMiddleware, async (req, res) => {
  try {
    const observation = await Observation.findById(req.params.id);
    if (!observation) return res.status(404).json({ error: 'Not found' });

    // Request to Python Analysis Service with full telemetry parameters
    const payload = {
      mission: 'mars2020',
      instrument: 'meda',
      description: `Observation on Sol ${observation.sol} at ${observation.ltst} LTST. Temp: ${observation.t_air}°C, Pressure: ${observation.pressure} Pa.`,
      sol: observation.sol,
      ltst: observation.ltst,
      ls: observation.ls,
      t_air: observation.t_air,
      pressure: observation.pressure,
    };

    let analysisUrl = process.env.ANALYSIS_SERVICE_URL ? process.env.ANALYSIS_SERVICE_URL.trim() : '';

    // Auto-detect production environment (Render sets RENDER=true or PORT=10000)
    const isProd = process.env.RENDER || process.env.NODE_ENV === 'production' || process.env.PORT;

    if (!analysisUrl || analysisUrl.includes('localhost') || analysisUrl.includes('127.0.0.1')) {
      analysisUrl = isProd ? 'https://missionmind-analysis.onrender.com' : 'http://127.0.0.1:8000';
    }

    // Render free instances cannot resolve internal hostnames like "missionmind-analysis:10000"
    if (analysisUrl.includes('missionmind-analysis') && !analysisUrl.includes('.onrender.com')) {
      analysisUrl = 'https://missionmind-analysis.onrender.com';
    }

    if (!analysisUrl.startsWith('http://') && !analysisUrl.startsWith('https://')) {
      analysisUrl = `https://${analysisUrl}`;
    }
    analysisUrl = analysisUrl.replace(/\/+$/, '');

    console.log(`[analyze] Forwarding to Python Analysis Service: ${analysisUrl}/analyze`);
    const pythonRes = await axios.post(`${analysisUrl}/analyze`, payload, { timeout: 60000 });
    
    // Save the sanitized result
    const sanitizedData = sanitizeAnalysisResult(pythonRes.data);
    observation.analysis_result = sanitizedData;
    await observation.save();

    res.json(observation);
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: 'Analysis service failed', details: error.message });
  }
});

module.exports = router;
