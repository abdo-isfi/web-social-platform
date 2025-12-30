const statusCodes = {
  SUCCESS: 200,
  CREATED: 201,
  UPDATED: 202,
  DELETED: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,
  
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

const statusMessages = {
  200: 'Success',
  201: 'Created successfully',
  202: 'Updated successfully',
  203: 'Deleted successfully',
  204: 'No content',
  205: 'Reset content',
  206: 'Partial content',
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  422: 'Validation error',
  500: 'Internal server error',
  502: 'Bad gateway',
  503: 'Service unavailable'
};

module.exports = { statusCodes, statusMessages };