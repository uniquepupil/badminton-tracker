function ok(response, data, status = 200) { return response.status(status).json({ success: true, data }); }
function fail(response, status, code, message, details) {
  return response.status(status).json({ success: false, error: { code, message, ...(details ? { details } : {}) } });
}
function asyncRoute(handler) { return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next); }
module.exports = { ok, fail, asyncRoute };
