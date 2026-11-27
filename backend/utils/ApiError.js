// Error carrying an HTTP status code; the error handler turns it into a JSON response.
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

module.exports = ApiError;
