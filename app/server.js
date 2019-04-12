const http = require('http');
const fs = require('fs');
const finalHandler = require('finalhandler');
const queryString = require('querystring');
const Router = require('router');
const bodyParser = require('body-parser');
const uid = require('rand-token').uid;
const url = require('url');

const PORT = 3001;

// Create a bank of user access tokens
let accessTokens = [];
// Create an object to maintain number of failed login attempts per user
let failedLoginAttempts = {};

/***************************************************************************
 *  Populate global state variables with /initial-data json files
 *  (using .readFileSync so they finish loading before the server starts)
 ***************************************************************************/
// Read in brands.json file
let brands = JSON.parse(fs.readFileSync('./initial-data/brands.json', 'utf8'));
console.log(`Server setup: ${brands.length} brands loaded`);

// Read in products.json file
let products = JSON.parse(
  fs.readFileSync('./initial-data/products.json', 'utf8')
);
console.log(`Server setup: ${products.length} products loaded`);

// Read in users.json file
let users = JSON.parse(fs.readFileSync('./initial-data/users.json', 'utf8'));
console.log(`Server setup: ${users.length} users loaded`);

/*************************************************************************
 * Helper methods to get/set number of failed requests per username
 * ***********************************************************************/
var getNumberOfFailedLoginRequests = username => {
  let currentNumberOfFailedRequests = failedLoginAttempts[username];
  if (currentNumberOfFailedRequests) {
    return currentNumberOfFailedRequests;
  } else {
    return 0;
  }
};

var setNumberOfFailedLoginRequests = (username, numFails) => {
  failedLoginAttempts[username] = numFails;
};

/************************************************
 * // Helper method to process access token
 * *********************************************/
// A variable to limit validity of access tokens to 15 minutes
const TOKEN_VALIDITY_TIMEOUT = 15 * 60 * 1000;
const getValidTokenFromRequest = request => {
  if (request.headers.token) {
    let currentAccessToken = accessTokens.find(accessToken => {
      return (
        accessToken.token == request.headers.token &&
        new Date() - accessToken.lastUpdated < TOKEN_VALIDITY_TIMEOUT
      );
    });
    if (currentAccessToken) {
      return currentAccessToken;
    } else {
      return null;
    }
  } else {
    return null;
  }
};

/***************************************************************************/
// Set up headers
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Origin, X-Requested-With, Content-Type, Accept, X-Authentication'
  // 'Content-Type': 'application/json' ???
};

// Establish router and body-parser middleware
const router = Router();
router.use(bodyParser.json());

// Establish server
const server = http
  .createServer((request, response) => {
    // // Handle Preflight request
    // if (request.method === 'OPTIONS') {
    //   response.writeHead(200, HEADERS);
    //   response.end();
    // }
    router(request, response, finalHandler(request, response));
  })

  // Begin listening on [local] port
  .listen(PORT, error => {
    if (error) {
      return console.log('Error on Server Startup: ', error);
      // throw error?;
    } else {
      console.log(`Server is listening on port ${PORT}`);
    }
  });

// FIXME:
// /***********************************
//  *   GET / or GET /api
//  ***********************************/
// router.get('/', (request, response) => {
//   response.writeHead(200, HEADERS);
//   // Object.assign(HEADERS, { 'Content-Type': 'application/json' })
//   response.end(
//     "There's nothing to see here, please visit /api/brands or /api/products"
//   );
// });
// router.get('/api', (request, response) => {
//   response.writeHead(200, HEADERS);
//   // Object.assign(HEADERS, { 'Content-Type': 'application/json' })
//   response.end(redirectionMessage);
// });

/*********************************************
 *   Brands: GET /api/brands <> Public route
 ********************************************/
router.get('/api/brands', (request, response) => {
  if (!brands) {
    response.writeHead(404, 'No products found');
    response.end();
  } else {
    response.writeHead(200, {
      ...HEADERS,
      'Content-Type': 'application/json'
    });
    response.end(JSON.stringify(brands));
  }
});

/********************************************************************
 *   Products by brand: GET api/brands/id:/products <> Public route
 ********************************************************************/
router.get('/api/brands/:id/products', (request, response) => {
  const { id } = request.params;
  const brandSpecificProducts = products.filter(
    product => product.categoryId === id
  );
  if (!brandSpecificProducts) {
    response.writeHead(404, 'No products found');
    response.end();
  } else {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(brandSpecificProducts));
  }
});

/*************************************************
 *   Products: GET /api/products <> Public route
 *************************************************/
router.get('/api/products', (request, response) => {
  if (!products) {
    response.writeHead(404, 'No products found');
    response.end();
  } else {
    response.writeHead(200, {
      ...HEADERS,
      'Content-Type': 'application/json'
    });
    response.end(JSON.stringify(products));
  }
});

/*****************************************
 *   User login: POST /api/login
 *****************************************/
router.post('/api/login', (request, response) => {
  // Ensure username and password are in the request
  // if (request.body.username && request.body.password) {
  if (
    request.body.username &&
    request.body.password &&
    getNumberOfFailedLoginRequests(request.body.username) < 3
  ) {
    // Verify username and password
    let user = users.find(user => {
      return (
        user.login.username == request.body.username &&
        user.login.password == request.body.password
      );
    });
    if (user) {
      // For validated user, reset counter of failed logins
      setNumberOfFailedLoginRequests(request.body.username, 0);
      // Write header for successful login
      response.writeHead(200, 'Successful login', {
        'Content-Type': 'application/json'
      });
      // response.end();

      // Check access token
      let currentAccessToken = accessTokens.find(tokenObject => {
        return tokenObject.username == user.login.username;
      });

      // Update value for time period
      if (currentAccessToken) {
        currentAccessToken.lastUpdated = new Date();
        response.end(JSON.stringify(currentAccessToken.token));
      } else {
        // Create new token with the user value and a "random" token (via rand-token)
        let newAccessToken = {
          username: user.login.username,
          lastUpdated: new Date(),
          token: uid(16)
        };
        accessTokens.push(newAccessToken);
        response.end(JSON.stringify(newAccessToken.token));
      }
    } else {
      // Update number of failed login attempts
      let numFailedForUser = getNumberOfFailedLoginRequests(
        request.body.username
      );
      setNumberOfFailedLoginRequests(request.body.username, numFailedForUser++);
      response.writeHead(401, 'Invalid username or password');
      response.end();
    }
  } else {
    // Missing one of the parameters, something is wrong with formatting
    response.writeHead(400, 'Invalid format of credentials');
    response.end();
  }
});

/************************************************
 *  Cart: GET /api/me/cart
 *  <> Protected Route, requires access token
 ************************************************/

router.get('/api/me/cart', (request, response) => {
  let validAccessToken = getValidTokenFromRequest(request);
  if (!validAccessToken) {
    response.writeHead(
      401,
      'You need to have access to this endpoint to continue'
    );
    response.end();
  } else {
    let userAccessToken = accessTokens.find(tokenObject => {
      return tokenObject.token == request.headers.token;
    });
    let user = users.find(user => {
      return user.login.username == userAccessToken.username;
    });
    if (!user) {
      response.writeHead(404, 'That user cannot be found');
      response.end();
      return;
    } else {
      response.writeHead(200, 'Successfully retrieved a users cart', {
        'Content-Type': 'application/json'
      });
      response.end(JSON.stringify(user.cart));
    }
  }
});

/****************************************************
 *  Add Items to Cart: POST /api/me/cart/:productId
 *  <> Protected Route, requires access token
 ****************************************************/
router.post('/api/me/cart/:productId', (request, response) => {
  let validAccessToken = getValidTokenFromRequest(request);
  if (!validAccessToken) {
    response.writeHead(
      401,
      'You must have access to this endpoint to continue'
    );
    response.end();
  } else {
    let userAccessToken = accessTokens.find(tokenObject => {
      return tokenObject.token == request.headers.token;
    });
    let user = users.find(user => {
      return user.login.username == userAccessToken.username;
    });
    if (!user) {
      response.writeHead(404, 'User cannot be found');
      response.end();
      return;
    } else {
      const { productId } = request.params;
      const validProductId = products.find(product => product.id === productId);
      if (!validProductId) {
        response.writeHead(400, 'Invalid product Id');
        response.end();
      }
      const productInCart = user.cart.find(product => product.id === productId);
      if (!productInCart) {
        const productToAdd = products.filter(
          product => product.id === productId
        );
        Object.assign(productToAdd[0], { quantity: 1 });
        user.cart.push(productToAdd[0]);
      } else {
        productInCart.quantity += 1;
      }
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(user.cart));
    }
  }
});

module.exports = server;

/***********************
 *  All Routes
 ***********************/
/*=========DONE========*/
// GET /api/brands
// GET /api/brands/:id/products
// GET /api/products
// POST /api/login
// GET /api/me/cart
// POST /api/me/cart/:productId

/*========TODO:=========*/
// POST /api/me/cart:
// DELETE /api/me/cart/:productId
