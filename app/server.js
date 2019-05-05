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
console.log(`Server loaded ${brands.length} brands`);

// Read in products.json file
let products = JSON.parse(
  fs.readFileSync('./initial-data/products.json', 'utf8')
);
console.log(`Server loaded ${products.length} products`);

// Read in users.json file
let users = JSON.parse(fs.readFileSync('./initial-data/users.json', 'utf8'));
console.log(`Server loaded ${users.length} users`);

// Create an array to hold tokens
let accessTokens = [];

// A variable to limit validity of access tokens to 15 minutes
const TOKEN_VALIDITY_TIMEOUT = 15 * 60 * 10000;

/************************************************
 * // Helper method to process/validate access token
 * *********************************************/
const getTokenFromRequest = request => {
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
  if (!brands) {
    response.writeHead(404, 'No brands found', { ...HEADERS });
    return response.end();
  }
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
    response.writeHead(400, 'Invalid brand ID', { ...HEADERS });
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
 *   Products: GET /api/products (optional query) <> Public route
 *************************************************/
router.get('/api/products', (request, response) => {
  let queriedProducts = [];
  const parsedUrl = url.parse(request.url);
  const { query } = queryString.parse(parsedUrl.query);
  // Query is optional; return *all* products if there's no query
  if (!query) {
    response.writeHead(200, 'Retrieved all products', {
      ...HEADERS
    });
    response.end(JSON.stringify(products));
  }
  //Ensure products is not empty
  else if (products.length > 0) {
    // Filter is case sensitive; normalize query and product values with toLowerCase() before comparing, so the query/returns aren't case-sensitive
    queriedProducts = products.filter(
      individualProduct =>
        individualProduct.name.toLowerCase().includes(query.toLowerCase()) ||
        individualProduct.description
          .toLowerCase()
          .includes(query.toLowerCase())
    );
    if (queriedProducts.length > 0) {
      response.writeHead(200, 'Retrieved all products', {
        ...HEADERS
      });
      response.end(JSON.stringify(queriedProducts));
    } else {
      response.writeHead(404, 'No products match query', { ...HEADERS });
      response.end();
    }
  } else {
    // If there's no query (query is empty) then return *all* products
    response.writeHead(400, 'Unexpected error', {
      ...HEADERS
    });
    response.end();
  }
});

/**************************************************
 *   User login: POST /api/login <> Public route
 **************************************************/
router.post('/api/login', (request, response) => {
  if (!request.body.username || !request.body.password) {
    response.writeHead(400, 'Incorrectly formatted request', {
      ...HEADERS
    });
    response.end();
  }
  if (request.body.username && request.body.password) {
    let user = users.find(individualUser => {
      return (
        individualUser.login.username == request.body.username &&
        individualUser.login.password == request.body.password
      );
    });
    if (user) {
      let currentAccessToken = accessTokens.find(individualToken => {
        return individualToken.username == user.login.username;
      });
      if (currentAccessToken) {
        currentAccessToken.lastUpdated = new Date();
        response.writeHead(200, 'Now logged in', { ...HEADERS });
        response.end(JSON.stringify(currentAccessToken.token));
      } else {
        let newAccessToken = {
          username: user.login.username,
          lastUpdated: new Date(),
          token: uid(16)
        };
        accessTokens.push(newAccessToken);
        response.writeHead(200, 'Now logged in', { ...HEADERS });
        response.end(JSON.stringify(newAccessToken.token));
      }
    } else {
      response.writeHead(401, 'Invalid username or password', { ...HEADERS });
      response.end();
    }
  } else {
    response.writeHead(400, 'Unexpected error', {
      ...HEADERS
    });
    response.end();
  }
});

/*****************************************************
 *  Retrieve Cart: GET /api/me/cart <> Protected route
 *****************************************************/
router.get('/api/me/cart', (request, response) => {
  let currentAccessToken = getTokenFromRequest(request);
  if (!currentAccessToken) {
    response.writeHead(401, 'Access not authorized', { ...HEADERS });
    response.end();
  } else {
    let userAccessToken = accessTokens.find(individualToken => {
      return individualToken.token == request.headers.token;
    });
    let user = users.find(user => {
      return user.login.username == userAccessToken.username;
    });
    if (!user) {
      response.writeHead(404, 'User not found', { ...HEADERS });
      response.end();
      return;
    } else {
      response.writeHead(200, 'User cart retrieved', { ...HEADERS });
      response.end(JSON.stringify(user.cart));
    }
  }
});

/*****************************************************
 *  Retrieve Cart: GET /api/me/cart <> Protected route
 *****************************************************/
// VERSION 2
// router.get('/api/me/cart', (request, response) => {
//   let currentAccessToken = getTokenFromRequest(request);
//   // Verify access token
//   if (!currentAccessToken) {
//     response.writeHead(401, 'Access not authorized');
//     response.end();
//   } else {
//     let userAccessToken = accessTokens.find(tokenVerification => {
//       return tokenVerification.token == request.headers.token;
//     });
//     let currentUser = users.find(theCurrentUser => {
//       theCurrentUser.username == userAccessToken.username;
//     });
//     if (!currentUser) {
//       response.writeHead(404, 'User not found');
//       response.end();
//       return;
//     } else {
//       response.writeHead(200, 'Retrieved users cart', { ...HEADERS });
//       response.end(JSON.stringify(currentUser.cart));
//     }
//   }
// });

/****************************************************
 *  Add Items to Cart: POST /api/me/cart/:productId
 *  <> Protected route
 ****************************************************/
router.post('/api/me/cart/:productId', (request, response) => {
  let currentAccessToken = getTokenFromRequest(request);
  // Verify access token
  if (!currentAccessToken) {
    response.writeHead(401, 'Access not authorized', { ...HEADERS });
    response.end();
  } else {
    let userAccessToken = accessTokens.find(tokenVerifictation => {
      return tokenVerifictation.token == request.headers.token;
    });
    let currentUser = users.find(aCurrentUser => {
      return aCurrentUser.login.username == userAccessToken.username;
    });
    if (!currentUser) {
      response.writeHead(404, 'User not found', { ...HEADERS });
      response.end();
      return;
    } else {
      const { productId } = request.params;
      const validProductId = products.find(
        aProduct => aProduct.id === productId
      );
      if (!validProductId) {
        response.writeHead(400, 'Invalid product ID', { ...HEADERS });
        response.end();
      }
      const itemInCart = currentUser.cart.find(
        aProduct => aProduct.id === productId
      );
      // If item is not already in cart, add it to cart
      if (!itemInCart) {
        const itemAddition = products.filter(
          aProduct => aProduct.id === productId
        );
        Object.assign(itemAddition[0], { quantity: 1 });
        currentUser.cart.push(itemAddition[0]);
        // If item is already in cart, update its quantity
      } else {
        itemInCart.quantity += 1;
      }
      response.writeHead(200, 'Product added to user cart', { ...HEADERS });
      response.end(JSON.stringify(currentUser.cart));
    }
  }
});

/*********************************************************
 *  Delete Items in Cart: DELETE /api/me/cart/:productId
 *  <> Protected Route
 *********************************************************/
router.delete('/api/me/cart/:productId', (request, response) => {
  let validAccessToken = getTokenFromRequest(request);
  if (!validAccessToken) {
    response.writeHead(
      401,
      'You need to have access to this endpoint to continue',
      { ...HEADERS }
    );
    response.end();
  } else {
    let userAccessToken = accessTokens.find(individualToken => {
      return individualToken.token == request.headers.token;
    });
    let user = users.find(user => {
      return user.login.username == userAccessToken.username;
    });
    if (!user) {
      response.writeHead(404, 'That user cannot be found', { ...HEADERS });
      response.end();
      return;
    } else {
      response.writeHead(200, { ...HEADERS });
      const { productId } = request.params;
      user.cart = user.cart.filter(product => product.id !== productId);
      response.end(JSON.stringify(user.cart));
    }
  }
});

// router.delete('/api/me/cart/:productId', (request, response) => {
//   let validAccessToken = getTokenFromRequest(request);
//   if (!validAccessToken) {
//     response.writeHead(401, 'Access not authorized');
//     response.end();
//   } else {
//     let userAccessToken = accessTokens.find(individualToken => {
//       return individualToken.token == request.headers.token;
//     });
//     let currentUser = users.find(aUser => {
//       return aUser.login.username == userAccessToken.username;
//     });
//     if (!currentUser) {
//       response.writeHead(404, 'User not found');
//       response.end();
//       return;
//     } else {
//       response.writeHead(200, { 'Content-Type': 'application/json' });
//       const { productId } = request.params;
//       user.cart = user.cart.filter(product => product.id !== productId);
//       response.end(JSON.stringify(user.cart));
//     }
//   }
// });

//     } else {
//       const { productId } = request.params;
//       const validProductId = products.find(
//         aProduct => aProduct.id === productId
//       );
//       if (!validProductId) {
//         response.writeHead(400, 'Invalid product ID');
//         response.end();
//       }
//       const itemInCart = currentUser.cart.find(
//         aProduct => aProduct.id === productId
//       );
//       // If item is not in cart, notify user with error message
//       if (!itemInCart) {
//         response.writeHead(404, 'Item is not in cart');
//         response.end();
//       }
//       /******************************************************
//        * TODO: Reduce quantity by one if item is already in cart?
//        * ****************************************************/
//       // else
//       //   const itemToDelete = products.filter(
//       //     aProduct => aProduct.id === productId
//       //   );
//       //   Object.assign(itemAddition[0], { quantity: 1 });
//       //   currentUser.cart.push(itemAddition[0]);
//       //   // If item is already in cart, update its quantity
//       // } else {
//       //   itemInCart.quantity -= 1;
//       // }
//       else {
//         response.writeHead(200, { 'Content-Type': 'application/json' });
//         const { productId } = request.params;
//         currentUser.cart = currentUser.cart.filter(
//           product => product.id !== productId
//         );
//         response.end(JSON.stringify(currentUser.cart));
//       }
//     }
//   }
// });

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
// DELETE /api/me/cart/:productId  JSON  resonse (Success: true or Delete:true)

/*========TODO:=========*/
// PUT /api/me/cart:  (edit cart)
// Make sure ...HEADERS additions are consistent
