const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const createThreadSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Content cannot be empty',
      'any.required': 'Content is required',
    }),

  parentThread: Joi.string()
    .pattern(objectIdPattern)
    .optional()
    .messages({
      'string.pattern.base': 'Parent thread must be a valid MongoDB ObjectId',
    }),
});

module.exports = createThreadSchema;
