require('dotenv').config();
console.log("DEBUG: Connecting to host:", process.env.MYSQLHOST);
const express = require('express');
const cors = require('cors');
const session = require('express-session');

// Import routes
const authRoutes = require('./routes/auth');
const surplusRoutes = require('./routes/surpluses');
const requestRoutes = require('./routes/requests');
const ratingRoutes = require('./routes/ratings');
const usersRoutes = require('./routes/users');
const notificationsRoutes = require("./routes/notifications");


// OTP ROUTE
const otpRoutes = require("./routes/OTP/otp.routes");


const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost origins
    const allowedOrigins = [
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'http://127.0.0.1:5501',
      'http://localhost:5501',
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3001',
      'http://localhost:3001',
      'https://mealshare.onrender.com'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For development, allow any origin
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['set-cookie']
};

// Apply CORS before anything else
app.use(cors(corsOptions));

// Parse JSON body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
// app.use(session({
//   name: 'mealshare_session',
//   secret: 'mealshare_super_secret_key_2024_production_ready',
//   resave: true,
//   saveUninitialized: true, // Changed to true to ensure session cookie is always set
//   rolling: true,
//   cookie: {
//     httpOnly: true,
//     secure: false,          // false for HTTP (dev), true for HTTPS (production)
//     sameSite: 'lax',        // 'lax' is safest for development
//     maxAge: 24 * 60 * 60 * 1000,
//     path: '/'
//   }
// }));

app.set('trust proxy', 1);

app.use(session({
  name: 'mealshare_session',
  secret: process.env.SESSION_SECRET || 'mealshare_super_secret_key', // استخدم متغير بيئة للأمان
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // ستكون true تلقائياً عند الرفع
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // مهم جداً للـ CORS
    maxAge: 24 * 60 * 60 * 1000
  },
  proxy: true // Render يستخدم Proxy، يجب تفعيل هذا الخيار
}));

const allowedOrigins = [
  'http://localhost:5500',
  'https://your-site-name.onrender.com' // ضع رابط موقعك هنا بعد الحصول عليه
];

app.get('/', (req, res) => {
  res.sendFile(path.join(projectRoot, 'Pages', 'index.html'));
});

// Debug Middleware
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin || 'none'}`);
  console.log(`   Session ID: ${req.sessionID}`);
  if (req.session && req.session.user) {
    console.log(`   Session User: ${req.session.user.email}`);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/surpluses', surplusRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', usersRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/otp", otpRoutes);

// Static Files
const path = require('path');
const projectRoot = path.join(__dirname, '..', '..');

// Serve static files (CSS, JS, assets)
app.use('/styles', express.static(path.join(projectRoot, 'styles')));
app.use('/js', express.static(path.join(projectRoot, 'js')));
app.use('/assests', express.static(path.join(projectRoot, 'assests')));
app.use('/Pages', express.static(path.join(projectRoot, 'Pages')));

// Redirect root to index.html
app.get('/', (req, res) => {
  res.redirect('/Pages/index.html');
});



// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is Working!',
    sessionId: req.sessionID,
    hasUser: !!req.session.user,
    origin: req.headers.origin
  });


});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 MealShare Server running on http://localhost:${PORT}`);
  console.log(`🔐 Session-based authentication enabled`);
  console.log(`✅ CORS configured for all localhost origins\n`);
});
