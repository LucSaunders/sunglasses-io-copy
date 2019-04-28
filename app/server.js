const http = require('http');
const fs = require('fs');
const finalHandler = require('finalhandler');
const queryString = require('querystring');
const Router = require('router');
const bodyParser = require('body-parser');
const uid = require('rand-token').uid;
const url = require('url');
const PORT = 3001;

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

// Create an array to hold tokens
let accessTokens = [];

// A variable to limit validity of access tokens to 15 minutes
const TOKEN_VALIDITY_TIMEOUT = 15 * 60 * 1000;

/************************************************
 * // Helper method to process/validate access token
 * *********************************************/
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
  // 'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Origin, X-Requested-With, Content-Type, Accept, X-Authentication',
  'Content-Type': 'application/json'
};

// Establish router and body-parser middleware
const router = Router();
router.use(bodyParser.json());

// Establish server
const server = http
  .createServer((request, response) => {
    // // Handle Preflight request
    if (request.method === 'OPTIONS') {
      response.writeHead(200, HEADERS);
      response.end();
    }
    router(request, response, finalHandler(request, response));
  })
  .listen(PORT, error => {
    // Begin listening on [local] port
    if (error) {
      return console.log('Error on Server Startup: ', error);
    } else {
      console.log(`Server is listening on port ${PORT}`);
    }
  });

/*********************************************
 *   Brands: GET /api/brands <> Public route
 ********************************************/
router.get('/api/brands', (request, response) => {
  response.writeHead(200, 'Retrieved all brands', {
    ...HEADERS
  });
  response.end(JSON.stringify(brands));
});

/********************************************************************
 *   Products by brand: GET api/brands/:id/products <> Public route
 ********************************************************************/
router.get('/api/brands/:id/products', (request, response) => {
  // Verify that the queried brand ID exists
  const { id } = request.params;
  let brandIdExists = brands.find(brand => {
    return brand.id === request.params.id;
  });
  if (!brandIdExists) {
    response.writeHead(400, 'Invalid brand ID');
    response.end();
  }
  const brandFilteredProducts = products.filter(
    brand => brand.categoryId === id
  );
  response.writeHead(200, 'Retrieved products by brand ID', {
    ...HEADERS
  });
  response.end(JSON.stringify(brandFilteredProducts));
});

/*************************************************
 *   Products: GET /api/products <> Public route
 *************************************************/
router.get('/api/products', (request, response) => {
  const parsedUrl = url.parse(request.url);
  const { query } = queryString.parse(parsedUrl.query);
  let queriedProducts = [];
  if (query !== undefined && products.length > 0) {
    queriedProducts = products.filter(
      individualProduct =>
        individualProduct.name.includes(query) ||
        individualProduct.description.includes(query)
    );
    if (queriedProducts.length > 0) {
      response.writeHead(200, 'Retrieved all products', {
        ...HEADERS
      });
      response.end(JSON.stringify(queriedProducts));
    } else {
      response.writeHead(404, 'No products match query');
      return response.end();
    }
    // } else if {
    //   response.writeHead(400, 'Unexpected error');
    //   return response.end();
  } else {
    // queriedProducts = products;
    response.writeHead(200, 'Retrieved all products', {
      ...HEADERS
    });
    response.end(JSON.stringify(products));
  }
});

/**************************************************
 *   User login: POST /api/login <> Public route
 **************************************************/
router.post('/api/login', (request, response) => {
  if (request.body.username && request.body.password) {
    let user = users.find(user => {
      return (
        user.login.username == request.body.username &&
        user.login.password == request.body.password
      );
    });
    if (user) {
      let currentAccessToken = accessTokens.find(tokenObject => {
        return tokenObject.username == user.login.username;
      });

      if (currentAccessToken) {
        currentAccessToken.lastUpdated = new Date();
        response.writeHead(200, 'Successful Login', {
          'Content-Type': 'application/json'
        });
        response.end(JSON.stringify(currentAccessToken.token));
      } else {
        let newAccessToken = {
          username: user.login.username,
          lastUpdated: new Date(),
          token: uid(16)
        };
        accessTokens.push(newAccessToken);
        response.writeHead(200, 'Successful Login', {
          'Content-Type': 'application/json'
        });
        response.end(JSON.stringify(newAccessToken.token));
      }
    } else {
      response.writeHead(401, 'Invalid username or password');
      response.end();
    }
  } else {
    response.writeHead(400, 'Incorrectly formatted credentials');
    response.end();
  }
});

/***********************
 * OLd VERSION OF LOGIN
 * *********************/
// router.post('/api/login', (request, response) => {
//   const { username, password } = request.body;

//   // Ensure necessary fields are entered
//   if (!username || !password) {
//     response.writeHead(400, 'Invalid username or password');
//     response.end();
//   }
//   // Check for existing user
//   users.find({ username }).then(user => {
//     if (!user) {
//       response.writeHead(400, 'Invalid username or password');
//       response.end();
//     }

//     // Validate password
//     else if (user.login.password !== request.body.password) {
//       response.writeHead(400, 'Invalid username or password');
//       response.end();
//     } else if (
//       user.login.username == request.body.username &&
//       user.login.password == request.body.password
//     ) {
//       // After username and password validated, check access token
//       let currentAccessToken = accessTokens.find(tokenVerifictation => {
//         return tokenVerifictation.username == user.login.username;
//       });

//       if (currentAccessToken) {
//         currentAccessToken.lastUpdated = new Date();
//         response.writeHead(200, 'Now logged in', { ...HEADERS });
//         response.end(JSON.stringify(currentAccessToken.token));
//       } else {
//         let newAccessToken = {
//           username: user.login.username,
//           lastUpdated: new Date(),
//           token: uid(16)
//         };
//         accessTokens.push(newAccessToken);
//         response.writeHead(200, 'Now logged in', { ...HEADERS });
//         response.end(JSON.stringify(newAccessToken.token));
//       }
//     }
//   });
// });

/*****************************************************
 *  Retrieve Cart: GET /api/me/cart <> Protected route
 *****************************************************/
// router.get('/api/me/cart', (request, response) => {
//   let validAccessToken = getValidTokenFromRequest(request);
//   if (!validAccessToken) {
//     response.writeHead(
//       401,
//       'You need to have access to this endpoint to continue'
//     );
//     response.end();
//   } else {
//     let userAccessToken = accessTokens.find(tokenObject => {
//       return tokenObject.token == request.headers.token;
//     });
//     let user = users.find(user => {
//       return user.login.username == userAccessToken.username;
//     });
//     if (!user) {
//       response.writeHead(404, 'That user cannot be found');
//       response.end();
//       return;
//     } else {
//       response.writeHead(200, 'Successfully retrieved a users cart', {
//         'Content-Type': 'application/json'
//       });
//       response.end(JSON.stringify(user.cart));
//     }
//   }
// });

router.get('/api/me/cart', (request, response) => {
  let currentAccessToken = getValidTokenFromRequest(request);
  // Verify access token
  if (!currentAccessToken) {
    response.writeHead(401, 'Access not authorized');
    response.end();
  } else {
    let userAccessToken = accessTokens.find(tokenVerification => {
      return tokenVerification.token == request.headers.token;
    });
    let currentUser = users.find(theCurrentUser => {
      theCurrentUser.username == userAccessToken.username;
    });
    if (!currentUser) {
      response.writeHead(404, 'User not found');
      response.end();
      return;
    } else {
      response.writeHead(200, 'Retrieved users cart', { ...HEADERS });
      response.end(JSON.stringify(currentUser.cart));
    }
  }
});

/****************************************************
 *  Add Items to Cart: POST /api/me/cart/:productId
 *  <> Protected oute
 ****************************************************/
router.post('/api/me/cart/:productId', (request, response) => {
  let currentAccessToken = getValidTokenFromRequest(request);
  // Verify access token
  if (!currentAccessToken) {
    response.writeHead(401, 'Access not authorized');
    response.end();
  } else {
    let userAccessToken = accessTokens.find(tokenVerifictation => {
      return tokenVerifictation.token == request.headers.token;
    });
    let currentUser = users.find(aCurrentUser => {
      return aCurrentUser.login.username == userAccessToken.username;
    });
    if (!currentUser) {
      response.writeHead(404, 'User not found');
      response.end();
      return;
    } else {
      const { productId } = request.params;
      const validProductId = products.find(product => product.id === productId);
      if (!validProductId) {
        response.writeHead(400, 'Invalid product ID');
        response.end();
      }
      const itemInCart = currentUser.cart.find(
        product => product.id === productId
      );
      if (!itemInCart) {
        const itemAddition = products.filter(
          product => product.id === productId
        );
        Object.assign(itemAddition[0], { quantity: 1 });
        user.cart.push(itemAddition[0]);
      } else {
        itemInCart.quantity += 1;
      }
      response.writeHead(200, 'Product added to user cart', { ...HEADERS });
      response.end(JSON.stringify(user.cart));
    }
  }
});

module.exports = server;

/***********************
 *  Notes
 **********************/
// Create -> Post (nonidempotent)
// Read   -> Get
// Update -> Put (can create a new entity or update an existing one; most appropriate for 'Edit cart'?)
// Delete -> Delete (idempotent; can be an asynchronous or long-running request)

/*=======================*/

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
