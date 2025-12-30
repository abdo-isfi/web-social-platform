const responseHandler = require('../utils/responseHandler');
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return responseHandler.validationError(res, errors);
    }

    // Replace req.body with validated and sanitized values
    req.body = value;
    next();
  };
};

module.exports = validate;