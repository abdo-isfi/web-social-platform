const responseHandler = require('../utils/responseHandler');
const { statusCodes } = require('../utils/statusCodes');

const pagination = (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const errors = [];

  if (isNaN(page) || page < 1) errors.push('Page must be a positive integer');
  if (isNaN(limit) || limit < 1) errors.push('Limit must be a positive integer');

  if (errors.length > 0) {
    return responseHandler.validationError(res, errors);
  }
  req.pagination = { page, limit };

  next();
};

module.exports = pagination;
