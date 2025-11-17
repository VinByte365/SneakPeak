const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const admin = require('firebase-admin');



exports.loginWithFirebase = async (req, res) => {
  try {
    const { idToken } = req.body; // From Firebase client
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;
    
    // Find or create user
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: email,
        name: name || email.split('@')[0],
        avatar: { 
          public_id: 'firebase_photo', 
          url: picture || 'default.jpg' 
        },
        password: Math.random().toString(36).slice(-8) // Random password for Firebase users
      });
    }
    
    // Generate your JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME || '7d',
    });
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Firebase authentication failed', error: error.message });
  }
};

/**
 * Register a new user
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar
    });

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME || '1d',
    });

    user.password = undefined; // Don't send password back

    res.status(201).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get single user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update user
 */
exports.updateUser = async (req, res) => {
  try {
    // If password is being updated, hash it before saving
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      select: '-password',
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete user
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Login user
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and select password explicitly
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME || '1d',
    });

    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Request password reset (email token generation)
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send email here with resetToken URL

    res.status(200).json({
      success: true,
      message: 'Password reset token sent to email',
      resetToken, // For testing - remove in prod
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res) => {
  try {
    // Hash token from URL param to search in DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with valid token expiration
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update password and clear reset fields
    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password has been reset' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Bulk user operations (admin only)
 */
exports.bulkUserOperations = async (req, res) => {
  try {
    const { userIds, action } = req.body;

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    // Validate userIds are valid ObjectIds
    const ObjectId = require('mongoose').Types.ObjectId;
    const validIds = userIds.filter(id => ObjectId.isValid(id));
    
    if (validIds.length !== userIds.length) {
      return res.status(400).json({ 
        message: 'Some userIds are invalid ObjectIds' 
      });
    }

    let message, result;

    try {
      switch (action) {
        case 'delete':
          result = await User.deleteMany({ _id: { $in: validIds } });
          message = `${result.deletedCount} users deleted successfully`;
          break;

        case 'activate':
          result = await User.updateMany(
            { _id: { $in: validIds } },
            { $set: { isActive: true } }
          );
          message = `${result.modifiedCount} users activated`;
          break;

        case 'deactivate':
          result = await User.updateMany(
            { _id: { $in: validIds } },
            { $set: { isActive: false } }
          );
          message = `${result.modifiedCount} users deactivated`;
          break;

        default:
          return res.status(400).json({ message: 'Invalid bulk operation action' });
      }

      return res.status(200).json({
        success: true,
        message,
        affectedCount: result?.deletedCount || result?.modifiedCount || 0,
        processedIds: validIds,
      });

    } catch (error) {
      console.error('Bulk user operation error:', error);
      return res.status(500).json({ message: 'Bulk operation failed' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Change user role (Admin only)
 */
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'admin']; // Define your roles here

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optional: Prevent non-admin from changing admin roles
    if (req.user.role !== 'admin' && user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot change admin role' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: await User.findById(req.params.id).select('-password'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Toggle user status (Admin only)
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle status
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: await User.findById(req.params.id).select('-password'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user statistics (Admin only)
 */
exports.getUserStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    
    // Active users
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Admin users
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { 
        _id: '$role', 
        count: { $sum: 1 },
        percentage: { 
          $round: [{ $multiply: [{ $divide: [{ $sum: 1 }, { $literal: totalUsers }] }, 100] }
          ]
        }
      }
    }
    ]);

    // Recent registrations (last 30 days)
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        inactiveUsers: totalUsers - activeUsers,
        recentUsers,
        usersByRole,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get current user profile (shortcut for authenticated user)
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // Since your middleware already attaches req.user, we just need to fetch fresh data
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update current user profile (own profile access)
 */
exports.updateCurrentUser = async (req, res) => {
  try {
    // If password is being updated, hash it
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id, // Current user's ID from JWT token
      req.body,
      { 
        new: true, 
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Change password (current user only)
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Verify old password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Generate new JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME || '1d',
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
