// utils/apiFeatures.js

/**
 * APIFeatures - MongoDB query builder class
 * Handles search, filtering, and pagination for product queries
 */
class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  /**
   * Search products by keyword
   */
  search() {
    const keyword = this.queryStr.keyword ? {
      name: {
        $regex: this.queryStr.keyword,
        $options: 'i'
      }
    } : {};
    
    this.query = this.query.find({ ...keyword });
    return this;
  }

  /**
   * Filter products by price range and other properties
   */
  filter() {
    const queryCopy = { ...this.queryStr };
    
    // Removing fields from the query
    const removeFields = ['keyword', 'page'];
    removeFields.forEach(el => delete queryCopy[el]);

    let priceFilter = {};
    if (queryCopy['price[gte]'] || queryCopy['price[lte]']) {
      priceFilter.price = {};
      if (queryCopy['price[gte]']) {
        priceFilter.price.$gte = Number(queryCopy['price[gte]']);
      }
      if (queryCopy['price[lte]']) {
        priceFilter.price.$lte = Number(queryCopy['price[lte]']);
      }
      
      delete queryCopy['price[gte]'];
      delete queryCopy['price[lte]'];
    }

    // Remaining fields are used for other filters (category, ratings, etc.)
    this.query = this.query.find({ ...priceFilter, ...queryCopy });
    return this;
  }

  /**
   * Pagination for products
   */
  pagination(resPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    this.query = this.query.limit(resPerPage).skip(skip);
    return this;
  }
}

module.exports = APIFeatures;
