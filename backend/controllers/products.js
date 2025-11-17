const Product = require('../models/product')
const Order = require('../models/order');
const APIFeatures = require('../utils/apiFeatures');
const cloudinary = require('cloudinary')
const Filter = require('leo-profanity');

exports.newProduct = async (req, res, next) => {
  try {
    console.log('Files received:', req.files); // Multer files
    console.log('Body:', req.body);

    let imagesLinks = [];

    // ✅ Handle Multer file uploads
    if (req.files && req.files.length > 0) {
      // Upload files from Multer to Cloudinary
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.v2.uploader.upload(req.files[i].path, {
          folder: 'products',
          width: 800, // Larger size for product gallery
          crop: 'scale',
        });

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url
        });
      }
    } 
    // ✅ Fallback: Handle base64 images (if sent from frontend as strings)
    else if (req.body.images) {
      let images = [];
      if (typeof req.body.images === 'string') {
        images.push(req.body.images);
      } else {
        images = req.body.images;
      }

      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: 'products',
          width: 800,
          crop: 'scale',
        });

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url
        });
      }
    }

    if (imagesLinks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one product image'
      });
    }

    // Create product with uploaded images
    const product = await Product.create({
      ...req.body,
      images: imagesLinks,
    });

    return res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSingleProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    return res.status(200).json({
        success: true,
        product
    })
}

exports.getAdminProducts = async (req, res, next) => {

    const products = await Product.find({});
    if (!products) {
        return res.status(404).json({
            success: false,
            message: 'Products not found'
        })
    }
    return res.status(200).json({
        success: true,
        products
    })

}

exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let imagesLinks = [...product.images]; // Keep existing images

    // ✅ If new images uploaded via Multer
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary (optional)
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }

      // Upload new images
      imagesLinks = [];
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.v2.uploader.upload(req.files[i].path, {
          folder: 'products',
          width: 800,
          crop: 'scale',
        });

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url
        });
      }
    }
    // ✅ Fallback: base64 images from frontend
    else if (req.body.images) {
      let images = [];
      if (typeof req.body.images === 'string') {
        images.push(req.body.images);
      } else {
        images = req.body.images;
      }

      // Delete old images
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }

      imagesLinks = [];
      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: 'products',
          width: 800,
          crop: 'scale',
        });

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url
        });
      }
    }

    // Update product
    product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        images: imagesLinks
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Product update error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteProduct = async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Product deleted'
    })
}

exports.getProducts = async (req, res) => {

    const resPerPage = 4;
    const productsCount = await Product.countDocuments();

    // const products = await Product.find({})
    const apiFeatures = new APIFeatures(Product.find(), req.query).search().filter()

    apiFeatures.pagination(resPerPage);
	const products = await apiFeatures.query;
    let filteredProductsCount = products.length;

    if (!products)
        return res.status(400).json({ message: 'error loading products' })
    return res.status(200).json({
        success: true,
        products,
        filteredProductsCount,
        resPerPage,
        productsCount,

    })
}

exports.productSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$itemsPrice" }

            },
            
        },
    ])
    console.log( totalSales)
    const sales = await Order.aggregate([
        { $project: { _id: 0, "orderItems": 1, totalPrice: 1 } },
        { $unwind: "$orderItems" },
        {
            $group: {
                _id: { product: "$orderItems.name" },
                total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            },
        },
    ])
	console.log(sales)
    
    if (!totalSales) {
		return res.status(404).json({
			message: 'error sales'
		})
       
    }
    if (!sales) {
		return res.status(404).json({
			message: 'error sales'
		})
      
    }
    
    let totalPercentage = {}
    totalPercentage = sales.map(item => {
         
        // console.log( ((item.total/totalSales[0].total) * 100).toFixed(2))
        percent = Number (((item.total/totalSales[0].total) * 100).toFixed(2))
        total =  {
            name: item._id.product,
            percent
        }
        return total
    }) 
     console.log(totalPercentage)
    res.status(200).json({
        success: true,
        totalPercentage,
        sales,
        totalSales
    })

};

exports.createProductReview = async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  
  // Filter bad words
  const filteredComment = filter.clean(comment);
  
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment: filteredComment
  };
  
  const product = await Product.findById(productId);
  const isReviewed = product.reviews.find(
    r => r.user.toString() === req.user._id.toString()
  );
  
  if (isReviewed) {
    product.reviews.forEach(review => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = filteredComment;
        review.rating = rating;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }
  
  product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
  await product.save({ validateBeforeSave: false });
  
  if (!product) {
    return res.status(400).json({
      success: false,
      message: 'review not posted'
    });
  }
  
  return res.status(200).json({
    success: true
  });
};

exports.getProductReviews = async (req, res, next) => {
    const product = await Product.findById(req.query.id);
    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
};

exports.deleteReview = async (req, res, next) => {
    console.log(req.query)
    const product = await Product.findById(req.query.productId);
    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());
    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    return res.status(200).json({
        success: true
    })
};