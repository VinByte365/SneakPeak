const Order = require('../models/order');
const Product = require('../models/product');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate PDF receipt
const generateOrderPDF = async (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const fileName = `receipt-${order._id}.pdf`;
    const filePath = path.join(__dirname, '../receipts', fileName);
    
    // Create receipts directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, '../receipts'))) {
      fs.mkdirSync(path.join(__dirname, '../receipts'));
    }
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Add content to PDF
    doc.fontSize(20).text('SneakPeak - Order Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.paidAt).toLocaleDateString()}`);
    doc.text(`Status: ${order.orderStatus}`);
    doc.moveDown();
    
    doc.text('Items:', { underline: true });
    order.orderItems.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.name} x ${item.quantity} - $${item.price}`);
    });
    
    doc.moveDown();
    doc.text(`Subtotal: $${order.itemsPrice}`);
    doc.text(`Tax: $${order.taxPrice}`);
    doc.text(`Shipping: $${order.shippingPrice}`);
    doc.fontSize(14).text(`Total: $${order.totalPrice}`, { bold: true });
    
    doc.end();
    
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

// Send email with PDF
const sendOrderEmail = async (order, userEmail, pdfPath) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `SneakPeak - Order ${order._id} ${order.orderStatus}`,
    html: `
      <h2>Order Update</h2>
      <p>Your order #${order._id} status: <strong>${order.orderStatus}</strong></p>
      <p>Total: $${order.totalPrice}</p>
      <p>Please find your receipt attached.</p>
    `,
    attachments: [
      {
        filename: `receipt-${order._id}.pdf`,
        path: pdfPath
      }
    ]
  };
  
  return transporter.sendMail(mailOptions);
};

// UPDATE your existing updateOrder function
exports.updateOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'email name');
  
  if (order.orderStatus === 'Delivered') {
    return res.status(400).json({
      message: 'You have already delivered this order',
    });
  }
  
  order.orderItems.forEach(async item => {
    await updateStock(item.product, item.quantity);
  });
  
  order.orderStatus = req.body.status;
  order.deliveredAt = Date.now();
  await order.save();
  
  // GENERATE PDF AND SEND EMAIL
  try {
    const pdfPath = await generateOrderPDF(order);
    await sendOrderEmail(order, order.user.email, pdfPath);
    
    // Optional: Delete PDF after sending
    fs.unlinkSync(pdfPath);
  } catch (emailError) {
    console.error('Email sending failed:', emailError);
    // Don't fail the request if email fails
  }
  
  res.status(200).json({
    success: true,
    message: 'Order updated and email sent'
  });
};

exports.newOrder = async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo

    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id
    })

    res.status(200).json({
        success: true,
        order
    })
}

exports.myOrders = async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id })
    // console.log(req.user)
    res.status(200).json({
        success: true,
        orders
    })
}

exports.getSingleOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) {
        res.status(404).json({
            message: 'No Order found with this ID',

        })
    }
    res.status(200).json({
        success: true,
        order
    })
}

exports.allOrders = async (req, res, next) => {
    const orders = await Order.find()
    // console.log(orders)
    let totalAmount = 0;

    orders.forEach(order => {

        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
}

exports.deleteOrder = async (req, res, next) => {
    const order = await Order.findByIdAndDelete(req.params.id)

    if (!order) {
        return res.status(400).json({
            message: 'No Order found with this ID',

        })
      
    }
    return res.status(200).json({
        success: true
    })
}

async function updateStock(id, quantity) {
    const product = await Product.findById(id);

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false })
}

exports.totalOrders = async (req, res, next) => {
    const totalOrders = await Order.aggregate([
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ])
    if (!totalOrders) {
        return res.status(404).json({
            message: 'error total orders',
        })
    }
    res.status(200).json({
        success: true,
        totalOrders
    })

}

exports.totalSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalPrice" }
            }
        }
    ])
    if (!totalSales) {
        return res.status(404).json({
            message: 'error total sales',
        })
    }
    res.status(200).json({
        success: true,
        totalSales
    })
}

exports.customerSales = async (req, res, next) => {
    const customerSales = await Order.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            },
        },
        // {
        //     $group: {
        //         _id: "$user",
        //         total: { $sum: "$totalPrice" },
        //     }
        // },

        { $unwind: "$userDetails" },
        {
            $group: {
                _id: "$user",
                total: { $sum: "$totalPrice" },
                doc: { "$first": "$$ROOT" },

            }
        },

        {
            $replaceRoot: {
                newRoot: { $mergeObjects: [{ total: '$total' }, '$doc'] },
            },
        },
        // {
        //     $group: {
        //         _id: "$userDetails.name",
        //         total: { $sum: "$totalPrice" }
        //     }
        // },
        {
            $project: {
                _id: 0,
                "userDetails.name": 1,
                total: 1,
            }
        },
        { $sort: { total: -1 } },

    ])
    console.log(customerSales)
    if (!customerSales) {
        return res.status(404).json({
            message: 'error customer sales',
        })


    }
    // return console.log(customerSales)
    res.status(200).json({
        success: true,
        customerSales
    })

}
exports.salesPerMonth = async (req, res, next) => {
    const salesPerMonth = await Order.aggregate([

        {
            $group: {
                // _id: {month: { $month: "$paidAt" } },
                _id: {
                    year: { $year: "$paidAt" },
                    month: { $month: "$paidAt" }
                },
                total: { $sum: "$totalPrice" },
            },
        },

        {
            $addFields: {
                month: {
                    $let: {
                        vars: {
                            monthsInString: [, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', ' Sept', 'Oct', 'Nov', 'Dec']
                        },
                        in: {
                            $arrayElemAt: ['$$monthsInString', "$_id.month"]
                        }
                    }
                }
            }
        },
        { $sort: { "_id.month": 1 } },
        {
            $project: {
                _id: 0,
                month: 1,
                total: 1,
            }
        }

    ])
    if (!salesPerMonth) {
        return res.status(404).json({
            message: 'error sales per month',
        })
    }
    // return console.log(customerSales)
    res.status(200).json({
        success: true,
        salesPerMonth
    })

}