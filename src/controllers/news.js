/* eslint-disable prefer-destructuring */
/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
const { where, Op, order } = require('sequelize');
const joi = require('joi');
const { news, user, category } = require('../models');
const paging = require('../helpers/pagination');
const responseStandart = require('../helpers/response');

module.exports = {
  createNews: async (req, res) => {
    const { id } = req.user;
    const pictures = (req.file ? `uploads/${req.file.filename}` : undefined);
    const schema = joi.object({
      headline: joi.string().required(),
      category: joi.string().required(),
      description: joi.string().required(),
    });
    const { value: results, error } = schema.validate(req.body);
    const {
      headline, category, description,
    } = results;
    if (!error) {
      const dataUser = {
        author_id: id,
        headline,
        category,
        description,
        picture: pictures,
      };
      await news.create(dataUser);
      return responseStandart(res, 'create hot news success', {});
    }
    return responseStandart(res, 'error', {}, 401, false);
  },
  getNews: async (req, res) => {
    const { search, sort } = req.query;
    let sortBy = '';
    let sortFrom = '';
    if (typeof sort === 'object') {
      sortBy = Object.keys(sort)[0];
      sortFrom = Object.values(sort)[0];
    } else {
      sortBy = 'id';
      sortFrom = sort || 'asc';
    }
    let searchKey = '';
    let searchValue = '';
    if (typeof search === 'object') {
      searchKey = Object.keys(search)[0];
      searchValue = Object.values(search)[0];
    } else {
      searchKey = 'headline';
      searchValue = search || '';
    }
    const count = await news.count();
    const page = paging(req, count);
    const { offset, pageInfo } = page;
    const { limitData: limit } = pageInfo;
    const result = await news.findAll(
      {
        include: [
          { model: user, as: 'author' },
          { model: category, as: 'categories' },
        ],
        limit,
        offset,
        where: {
          [searchKey]: {
            [Op.substring]: `${searchValue}`,
          },
        },
        order: [
          [`${sortBy}`, `${sortFrom}`],
        ],
      },
    );
    return responseStandart(res, 'List all category detail', { result, pageInfo });
  },
  getNewsById: async (req, res) => {
    const { id } = req.params;
    const results = await news.findByPk(id, {
      include: [
        { model: user, as: 'author' },
        { model: category, as: 'categories' },
      ],
    });
    if (results) {
      return responseStandart(res, `news id ${id}`, { results });
    }
    return responseStandart(res, `news ${id} not found`, {}, 401, false);
  },
  updateNews: async (req, res) => {
    const { id } = req.params;
    const pictures = (req.file ? `uploads/${req.file.filename}` : undefined);
    const { headline, category, description } = req.body;
    const results = await news.findByPk(id);
    if (results) {
      const data = {
        headline,
        category,
        description,
        picture: pictures,
      };
      await results.update(data);
      return responseStandart(res, 'update successfully', { results });
    }
    return responseStandart(res, `cannot update news ${id}`, {}, 401, false);
  },
  deleteNews: async (req, res) => {
    const { id } = req.params;
    const results = await news.findByPk(id);
    if (results) {
      await results.destroy();
      return responseStandart(res, 'News is HOAX', {});
    }
    return responseStandart(res, 'News not found', {}, 401, false);
  },
  getNewsByUser: async (req, res) => {
    const { id } = req.user;
    const count = await news.count();
    const page = paging(req, count);
    const { offset, pageInfo } = page;
    const { limitData: limit } = pageInfo;
    const results = await news.findAll({
      include: [
        { model: user, as: 'author' },
        { model: category, as: 'categories' },
      ],
      limit,
      offset,
      where: { author_id: id },
    });
    return responseStandart(res, 'List my news', { results, pageInfo });
  },
};
