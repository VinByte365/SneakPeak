const express = require('express')
const mongoose = require('mongoose')

const Product = require('../models/product')

exports.getAllProducts = async (req, res) => {
    try {
    const products = await Product.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }
}

exports.updateProduct = async (req, res) => {
    try {
    const products = await Product.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }
}

exports.getOneProduct = async (req, res) => {
    try {
    const products = await Product.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }

}

exports.deleteProduct = async (req, res) => {
    try {
    const products = await Product.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }
}