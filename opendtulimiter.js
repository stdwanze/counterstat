
var config = require('./config').config();
const DTU_USER = process.env.DTU_USER ?? "admin";
const DTU_PASS = process.env.DTU_PASS ?? "openDTU42";
const DTU_SERIAL = process.env.DTU_SERIAL ?? "116491626638";

const VOLT_MAX = parseFloat(process.env.DTU_VOLT_MAX ?? "252");
const LIMIT_FULL = parseInt(process.env.DTU_LIMIT_FULL ?? "1600");
const LIMIT_LOW = parseInt(process.env.DTU_LIMIT_LOW ?? "1000");

function authHeader(user, pass) {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

async function getVoltage(ip) {
  const res = await fetch(`${ip}api/livedata/status`, {
    headers: { Authorization: authHeader(DTU_USER, DTU_PASS) },
  });
  const data = await res.json();
  return data.inverters[0].AC[0].Voltage.v;
}

async function setLimit(ip, watt) {
  const body = new URLSearchParams({
    data: JSON.stringify({ serial: DTU_SERIAL, limit_type: 0, limit_value: watt }),
  });
  var response = await fetch(`${ip}api/limit/config`, {
    method: "POST",
    headers: {
      Authorization: authHeader(DTU_USER, DTU_PASS),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  console.log(`[opendtu] ${new Date().toISOString()} | Set limit response: ${response.status} ${response.statusText}`);
}

async function runLimiter(ip) {
  const volt = await getVoltage(ip);
  const limit = volt > VOLT_MAX ? LIMIT_LOW : LIMIT_FULL;
  await setLimit(ip, limit);
  console.log(`[opendtu] ${new Date().toISOString()} | ${volt}V → ${limit}W`);
}

function doIt() {
    runLimiter(config.dtuurl).catch((e) => console.error(`[opendtu] ${new Date().toISOString()} | Error: ${e.message}`));   
}
doIt();
