const express = require('express')
const mongoose = require('mongoose')

const user = require('../models/user')

exports.getAllusers = async (req, res) => {
    try {
    const users = await user.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }
}

exports.updateuser = async (req, res) => {
    try {
    const users = await user.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }
}

exports.getOneuser = async (req, res) => {
    try {
    const users = await user.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }

}

exports.deleteuser = async (req, res) => {
    try {
    const users = await user.find()
  }
    catch (error) {
    res.json({ message: error.message })
    }
}