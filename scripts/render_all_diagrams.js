const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'fairwork-frontend', 'node_modules', '@playwright', 'test'));

// Delegate rendering of the 9 light-mode system diagrams
// DFDs and ER model remain strictly preserved as per academic guidelines
require('./render_light_mode_diagrams.js');
