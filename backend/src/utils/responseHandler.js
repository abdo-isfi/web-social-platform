const responseHandler = {
  success: (res, data = null, message = null, statusCode = 200) => {
    const messages = {
      200: 'Success',
      201: 'Created successfully',
      202: 'Updated successfully',
      203: 'Deleted successfully',
      204: 'No content',
      205: 'Reset content',
      206: 'Partial content'
    };

    const response = {
      success: true,
      message: message || messages[statusCode] || 'Operation successful',
      data: data
    };

    return res.status(statusCode).json(response);
  },

  error: (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
    const messages = {
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

    const response = {
      success: false,
      message: message || messages[statusCode] || 'An error occurred',
      statusCode: statusCode,
      errors: errors
    };

    return res.status(statusCode).json(response);
  },

  validationError: (res, errors) => {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  },

  notFound: (res, resource = 'Resource') => {
    return res.status(404).json({
      success: false,
      message: `${resource} not found`
    });
  },

  unauthorized: (res, message = 'Unauthorized access') => {
    return res.status(401).json({
      success: false,
      message: message
    });
  },

  forbidden: (res, message = 'Forbidden') => {
    return res.status(403).json({
      success: false,
      message: message
    });
  }
};

module.exports = responseHandler;