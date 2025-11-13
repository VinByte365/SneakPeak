const express = require('express')
const mongoose = require('mongoose')

const order = require('../models/order')

exports.getAllorders = async (req, res) => {
    try {
    const orders = await order.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }
}

exports.updateorder = async (req, res) => {
    try {
    const orders = await order.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }
}

exports.getOneorder = async (req, res) => {
    try {
    const orders = await order.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }

}

exports.deleteorder = async (req, res) => {
    try {
    const orders = await order.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }
}