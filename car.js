const fs = require('fs');
const path = require('path');
const axios = require('axios');

const conf = JSON.parse(fs.readFileSync(path.join(__dirname, 'tronity/conf.json'), 'utf8'));
const { clientId, clientSecret } = conf.Tronity;

const TOKEN_URL = 'https://app.tronity.io/oauth/authentication';
const API_BASE = 'https://app.tronity.io/api';

let _token = null;
let _tokenExpiry = 0;
let _vehicleId = null;

async function getToken() {
    if (_token && Date.now() < _tokenExpiry - 60000) return _token;
    const res = await axios.post(TOKEN_URL, {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'app'
    }, { timeout: 10000 });
    _token = res.data.access_token;
    _tokenExpiry = Date.now() + (res.data.expires_in || 3600) * 1000;
    return _token;
}

async function getVehicleId(token) {
    if (_vehicleId) return _vehicleId;
    const res = await axios.get(`${API_BASE}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
    });
    const vehicles = res.data.data || res.data;
    _vehicleId = vehicles[0].id;
    return _vehicleId;
}

async function load() {
    try {
        const token = await getToken();
        const vid = await getVehicleId(token);
        const res = await axios.get(`${API_BASE}/vehicles/${vid}/last_record`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
        });
        return res.data;
    } catch (e) {
        console.log('tronity error: ' + e.message);
        return null;
    }
}

module.exports = { load };
