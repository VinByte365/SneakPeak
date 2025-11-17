// controllers/categoryController.js
const Category = require('../models/category');
const asyncErrorHandler = require('../middleware/asyncErrorHandler'); // Custom middleware for try-catch
const ApiError = require('../utils/apiError'); // Custom error class
const logger = require('../utils/logger'); // Winston or similar logger

// Create a new category (Admin only)
exports.newCategory = asyncErrorHandler(async (req, res, next) => {
    // Input validation (you should use Joi or express-validator)
    const { name, description, image, isActive = true } = req.body;
    
    if (!name || name.trim().length < 2) {
        return next(new ApiError('Category name is required and must be at least 2 characters', 400));
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
        return next(new ApiError('Category with this name already exists', 400));
    }

    const category = await Category.create({
        name: name.trim(),
        description: description?.trim(),
        image,
        isActive,
        createdBy: req.user?.id || null, // From auth middleware
        // Add timestamps if not in schema
    });

    logger.info(`Category created: ${category.name} by user ${req.user?.id}`);

    res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category: {
            id: category._id,
            name: category.name,
            description: category.description,
            image: category.image,
            isActive: category.isActive,
            createdAt: category.createdAt,
        }
    });
});

// Get single category by ID
exports.getSingleCategory = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!Category.schema.path('_id').instance.createFromHexString(id)) {
        return next(new ApiError('Invalid category ID format', 400));
    }

    const category = await Category.findById(id).select('-__v'); // Exclude version key
    
    if (!category) {
        return next(new ApiError('Category not found', 404));
    }

    // Soft delete check
    if (!category.isActive) {
        return next(new ApiError('Category is no longer available', 404));
    }

    res.status(200).json({
        success: true,
        category: {
            id: category._id,
            name: category.name,
            description: category.description,
            image: category.image,
            isActive: category.isActive,
            slug: category.slug, // If you have slugs
            productCount: await Category.getProductCount(category._id), // Custom method
            updatedAt: category.updatedAt,
        }
    });
});

// Get all categories for public use (with pagination and filtering)
exports.getCategories = asyncErrorHandler(async (req, res, next) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12; // Reasonable default for frontend
    const search = req.query.search ? req.query.search.trim() : '';
    const activeOnly = req.query.activeOnly !== 'false'; // Default to true

    // Build filter
    const filter = { isActive: activeOnly };
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    // Get total count for pagination
    const categoriesCount = await Category.countDocuments(filter);
    const totalPages = Math.ceil(categoriesCount / limit);

    if (page > totalPages && totalPages > 0) {
        return next(new ApiError(`Page ${page} does not exist. Only ${totalPages} pages available`, 400));
    }

    const categories = await Category
        .find(filter)
        .sort({ name: 1 }) // Alphabetical order
        .limit(limit)
        .skip((page - 1) * limit)
        .select('-__v -createdBy -updatedBy')
        .lean(); // Faster for simple data

    // Add product count for each category (if needed)
    const categoriesWithStats = await Promise.all(
        categories.map(async (category) => ({
            ...category,
            productCount: await Category.getProductCount(category._id),
        }))
    );

    res.status(200).json({
        success: true,
        categories: categoriesWithStats,
        pagination: {
            currentPage: page,
            totalPages,
            totalCategories: categoriesCount,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit,
        },
        filters: {
            search,
            activeOnly,
        }
    });
});

// Get admin categories (all, including inactive, with more details)
exports.getAdminCategories = asyncErrorHandler(async (req, res, next) => {
    // Admin auth middleware should be applied in routes

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search ? req.query.search.trim() : '';
    const includeInactive = req.query.includeInactive === 'true';

    const filter = includeInactive ? {} : { isActive: true };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const categoriesCount = await Category.countDocuments(filter);
    const totalPages = Math.ceil(categoriesCount / limit);

    const categories = await Category
        .find(filter)
        .sort({ updatedAt: -1 }) // Most recently updated first
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('createdBy', 'name email') // Assuming User model reference
        .populate('updatedBy', 'name email')
        .lean();

    res.status(200).json({
        success: true,
        categories,
        pagination: {
            currentPage: page,
            totalPages,
            totalCategories: categoriesCount,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit,
        }
    });
});

// Update category (Admin only)
exports.updateCategory = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!Category.schema.path('_id').instance.createFromHexString(id)) {
        return next(new ApiError('Invalid category ID format', 400));
    }

    let category = await Category.findById(id);
    if (!category) {
        return next(new ApiError('Category not found', 404));
    }

    // Validate update data
    const updates = req.body;
    if (updates.name && updates.name.trim().length < 2) {
        return next(new ApiError('Category name must be at least 2 characters', 400));
    }

    // Check for name conflicts (excluding current category)
    if (updates.name && updates.name.trim() !== category.name) {
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${updates.name.trim()}$`, 'i') },
            _id: { $ne: id }
        });
        if (existingCategory) {
            return next(new ApiError('Category with this name already exists', 400));
        }
    }

    // Update category
    category = await Category.findByIdAndUpdate(
        id, 
        {
            ...updates,
            name: updates.name?.trim(),
            description: updates.description?.trim(),
            updatedBy: req.user?.id || null,
        },
        {
            new: true,
            runValidators: true,
            context: 'query' // For virtuals/populate
        }
    ).populate('updatedBy', 'name email');

    logger.info(`Category updated: ${category.name} by user ${req.user?.id}`);

    res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        category: {
            id: category._id,
            name: category.name,
            description: category.description,
            image: category.image,
            isActive: category.isActive,
            updatedAt: category.updatedAt,
        }
    });
});

// Delete category (Admin only - soft delete recommended)
exports.deleteCategory = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!Category.schema.path('_id').instance.createFromHexString(id)) {
        return next(new ApiError('Invalid category ID format', 400));
    }

    const category = await Category.findById(id);
    if (!category) {
        return next(new ApiError('Category not found', 404));
    }

    // Check if category has products (prevent deletion if so)
    const productCount = await Category.getProductCount(id);
    if (productCount > 0) {
        return next(new ApiError(
            `Cannot delete category "${category.name}". It has ${productCount} products. Please reassign products first.`, 
            400
        ));
    }

    // Soft delete (recommended for e-commerce)
    category.isActive = false;
    category.deletedAt = new Date();
    await category.save();

    logger.warn(`Category soft-deleted: ${category.name} by user ${req.user?.id}`);

    res.status(200).json({
        success: true,
        message: `Category "${category.name}" has been deactivated`,
    });
});

// Restore category (Admin only)
exports.restoreCategory = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    
    let category = await Category.findById(id);
    if (!category) {
        return next(new ApiError('Category not found', 404));
    }

    if (category.isActive) {
        return next(new ApiError('Category is already active', 400));
    }

    category.isActive = true;
    category.deletedAt = null;
    category.updatedBy = req.user?.id;
    await category.save();

    logger.info(`Category restored: ${category.name} by user ${req.user?.id}`);

    res.status(200).json({
        success: true,
        message: 'Category restored successfully',
        category: {
            id: category._id,
            name: category.name,
            isActive: true,
        }
    });
});

// Bulk operations
exports.bulkUpdateCategories = asyncErrorHandler(async (req, res, next) => {
    const { categoryIds, updates } = req.body;
    
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return next(new ApiError('Category IDs array is required', 400));
    }

    if (!updates || typeof updates !== 'object') {
        return next(new ApiError('Updates object is required', 400));
    }

    // Validate ObjectIds
    const validIds = categoryIds.filter(id => Category.schema.path('_id').instance.createFromHexString(id));
    if (validIds.length !== categoryIds.length) {
        return next(new ApiError('Some category IDs are invalid', 400));
    }

    const result = await Category.updateMany(
        { _id: { $in: validIds } },
        { 
            $set: { 
                ...updates,
                updatedBy: req.user?.id 
            } 
        }
    );

    logger.info(`Bulk updated ${result.modifiedCount} categories by user ${req.user?.id}`);

    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} categories updated successfully`,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
    });
});
