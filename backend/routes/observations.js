const express = require('express');
const router = express.Router();
const axios = require('axios');
const Observation = require('../models/Observation');
const authMiddleware = require('../middleware/auth');

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

    res.json({
      observations,
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

    let analysisUrl = (process.env.ANALYSIS_SERVICE_URL || 'http://127.0.0.1:8000').trim().replace(/\/+$/, '');
    if (!analysisUrl.startsWith('http://') && !analysisUrl.startsWith('https://')) {
      analysisUrl = `https://${analysisUrl}`;
    }
    const pythonRes = await axios.post(`${analysisUrl}/analyze`, payload);
    
    // Save the result
    observation.analysis_result = pythonRes.data;
    await observation.save();

    res.json(observation);
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: 'Analysis service failed', details: error.message });
  }
});

module.exports = router;
