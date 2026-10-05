const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8008';

app.use(cors());
app.use(express.json());

// Multer temporary storage for multipart uploads
const upload = multer({ dest: path.join(__dirname, 'temp_uploads') });

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const aiHealth = await axios.get(`${AI_SERVICE_URL}/api/health`);
    res.json({
      status: 'healthy',
      server: 'Express MERN Backend',
      port: PORT,
      ai_service: aiHealth.data
    });
  } catch (err) {
    res.json({
      status: 'partially_healthy',
      server: 'Express MERN Backend',
      port: PORT,
      ai_service_error: err.message
    });
  }
});

// List Cases
app.get('/api/cases', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/cases`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cases from AI service', details: err.message });
  }
});

// Get Case Detail
app.get('/api/cases/:id', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/cases/${req.params.id}`);
    res.json(response.data);
  } catch (err) {
    res.status(404).json({ error: 'Case not found', details: err.message });
  }
});

// Create and Process New Case
app.post('/api/cases', upload.array('files'), async (req, res) => {
  try {
    const { case_id, incident_type_hint } = req.body;
    if (!case_id) {
      return res.status(400).json({ error: 'case_id is required' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const form = new FormData();
    form.append('case_id', case_id);
    form.append('incident_type_hint', incident_type_hint || '');

    for (const f of req.files) {
      form.append('files', fs.createReadStream(f.path), f.originalname);
    }

    const aiRes = await axios.post(`${AI_SERVICE_URL}/api/cases`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // Cleanup temp files
    for (const f of req.files) {
      fs.unlink(f.path, () => {});
    }

    res.json(aiRes.data);
  } catch (err) {
    // Cleanup on error
    if (req.files) {
      for (const f of req.files) {
        fs.unlink(f.path, () => {});
      }
    }
    res.status(500).json({ error: 'Failed to process case', details: err.response?.data || err.message });
  }
});

// Audit Log Verification
app.get('/api/cases/:id/audit', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/cases/${req.params.id}/audit`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get audit log', details: err.message });
  }
});

// Tamper Simulation Demo
app.post('/api/cases/:id/tamper', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/cases/${req.params.id}/tamper`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger tamper demo', details: err.message });
  }
});

// Restore Audit Log
app.post('/api/cases/:id/restore-audit', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/cases/${req.params.id}/restore-audit`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore audit log', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Express MERN Server] Listening on http://localhost:${PORT}`);
  console.log(`[Express MERN Server] Proxying AI pipeline requests to ${AI_SERVICE_URL}`);
});
