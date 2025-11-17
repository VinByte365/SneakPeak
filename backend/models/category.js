const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please enter category name'],
		trim: true,
		maxLength: [50, 'Category name cannot exceed 50 characters']
	},
	description: {
		type: String,
		trim: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
})

module.exports = mongoose.model('Category', categorySchema)
