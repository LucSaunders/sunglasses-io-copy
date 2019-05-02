const server = require('../app/server');

const chai = require('chai'),
  chaiHttp = require('chai-http'),
  expect = chai.expect,
  assert = chai.assert;

chai.use(chaiHttp);

/*==================================
 *   TEST Brands: GET /api/brands
 *==================================*/
describe('/GET brands', () => {
  it('should return all brands', done => {
    chai
      .request(server)
      .get('/api/brands')
      .end((error, response) => {
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        assert.exists(response.body);
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(5);
        expect(response.body).to.deep.include({ id: '4', name: 'DKNY' });
        done();
      });
  });
});

/*==============================================================
 *   TEST Products by brand: GET api/brands/id:/products
 *==============================================================*/
describe('/GET products by brand', () => {
  it('should return all products of the specified brand', done => {
    chai
      .request(server)
      .get('/api/brands/5/products')
      .end((error, response) => {
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        assert.exists(response.body);
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(2);
        expect(response.body).to.deep.include({
          id: '11',
          categoryId: '5',
          name: 'Habanero',
          description: 'The spiciest glasses in the world',
          price: 153,
          imageUrls: [
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg'
          ]
        });
        done();
      });
  });
  it('should return 400 INVALID BRAND ID if the brand id is not in the data set', done => {
    chai
      .request(server)
      .get('/api/brands/invalidID/products')
      .end((error, response) => {
        expect(response).to.have.status(400);
        assert.exists(response.body);
        done();
      });
  });
});

/*=====================================
 *   TEST Products: GET /api/products
 *=====================================*/
describe('/GET products', () => {
  it('should return all products of all brands if there is no query included', done => {
    chai
      .request(server)
      .get('/api/products')
      .end((error, response) => {
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        assert.exists(response.body);
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(11);
        expect(response.body).to.deep.include({
          id: '7',
          categoryId: '3',
          name: 'QDogs Glasses',
          description: 'They bark',
          price: 1500,
          imageUrls: [
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg'
          ]
        });
        done();
      });
  });
  it('should return all products that match query specified by user', done => {
    chai
      .request(server)
      .get('/api/products?query=glasses')
      .end((error, response) => {
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        assert.exists(response.body);
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(11);
        expect(response.body).to.deep.include({
          id: '11',
          categoryId: '5',
          name: 'Habanero',
          description: 'The spiciest glasses in the world',
          price: 153,
          imageUrls: [
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg'
          ]
        });
        done();
      });
  });
  it('should return 404 NO PRODUCTS MATCH QUERY if the query yields no products', done => {
    chai
      .request(server)
      .get('/api/products?query=fartbarf')
      .end((error, response) => {
        expect(response).to.have.status(404);
        assert.exists(response.body);
        done();
      });
  });
});

/*====================================
 *   TEST User login: POST /api/login
 *====================================*/
let token = null;
describe('/POST user login', () => {
  it('should succeed if username and password are valid', done => {
    chai
      .request(server)
      .post('/api/login')
      // .set('Accept', 'application/json')
      // .set('Content-Type', 'application/json')
      .send({ username: 'greenlion235', password: 'waters' })
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.a('string');
        expect(response.body).to.be.lengthOf(16);
        // Set token equal to now-confirmed response.body
        token = response.body;
      });
    done();
  });
  it('should return 401 INVALID USERNAME OR PASSWORD if username or password is invalid', done => {
    chai
      .request(server)
      .post('/api/login')
      // Test case of valid username and valid password belonging to different users; shouldn't be valid as a pair
      .send({ username: 'greenlion235', password: 'tucker' })
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(401);
        done();
      });
  });
});

/*==============================================================
 *   TEST Cart Retrieval: GET /api/me/cart <> Protected route
 *==============================================================*/
describe('/GET user cart', () => {
  it('should return all products in users cart', done => {
    chai
      .request(server)
      .get('/api/me/cart')
      .set('token', token)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        // expect(response.body).to.be.lengthOf(???);
        // expect(response.body).to.deep.include([
        //   {}
        // ]);
        done();
      });
  });
  it('should return a 401 ACCESS NOT AUTHORIZED if no token or invalid token', done => {
    chai
      .request(server)
      .get('/api/me/cart')
      .set('token', 'fartbarfToken')
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(401);
        done();
      });
  });
});

/*==============================================================
 *   TEST Quantity Update: POST /api/me/cart <> Protected route
 *==============================================================*/
describe('/POST updated quantities of products in user cart', () => {
  it('should update product quantities in user cart', done => {
    chai
      .request(server)
      .post('/api/me/cart')
      .set('token', token)
      // .send({ updatedQuantities: [???] })
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        // expect(response.body).to.be.lengthOf(???);
        // expect(response.body[0].quantity).to.eql(???);
        // expect(response.body).to.deep.equal([ ???
        //   {  }
        // ]);
        done();
      });
  });
  it('should receive a 401 ACCESS NOT AUTHORIZED if no token or an invalid token', done => {
    chai
      .request(server)
      .post('/api/me/cart')
      .set('token', 'fartbarfToken')
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(401);
        done();
      });
  });
});

/*=====================================================================
 *   TEST Add Product: POST /api/me/cart/:productId <> Protected route
 *=====================================================================*/
describe('/POST add product to user cart', () => {
  it('should add specified product to user cart', done => {
    chai
      .request(server)
      // .post('/api/me/cart/???')
      .set('token', token)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        // expect(response.body).to.be.lengthOf(???);
        // expect(response.body).to.deep.equal([
        //   {???}
        // ]);
        done();
      });
  });
  it('should update product quantity if product is already in user cart', done => {
    chai
      .request(server)
      // .post('/api/me/cart/??')
      .set('token', token)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        // expect(response.body).to.be.lengthOf(???);
        // expect(response.body).to.deep.equal([
        //   {???
        //   }
        // ]);
        done();
      });
  });
  it('should receive a 400 INVALID PRODUCT ID if id is invalid', done => {
    chai
      .request(server)
      .post('/api/me/cart/15')
      .set('token', token)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(400);
        expect('Content-Type', 'application/json');
        done();
      });
  });
  it('should receive a 401 ACCESS NOT AUTHORIZED if no token or invalid token', done => {
    chai
      .request(server)
      // .post('/api/me/cart/???')
      .set('token', 'fartbarfToken')
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(401);
        done();
      });
  });
});

/*===============================================================
 *   TEST Remove Product from Cart: 
              DELETE /api/me/cart/:productId <> Protected route
 *===============================================================*/
describe('/DELETE a product', () => {
  it('should delete a product from a users cart', done => {
    chai
      .request(server)
      // .delete('/api/me/cart/???')
      .set('token', token)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        // expect(response.body).to.be.lengthOf(???);
        // expect(response.body).to.deep.equal([
        //   { }
        // ]);
        done();
      });
  });
  it('should receive a 400 INVALID PRODUCT ID if product id is invalid', done => {
    chai
      .request(server)
      .delete('/api/me/cart/99')
      .set('token', token)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(400);
        expect('Content-Type', 'application/json');
        done();
      });
  });
  it('should receive a 401 ACCESS NOT AUTHORIZED if no token or invalid token', done => {
    chai
      .request(server)
      .delete('/api/me/cart/12')
      .set('token', 'fartbarfToken')
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(401);
        done();
      });
  });
  // TODO: have test cart with some items in it, and test this delete with a valid product id not in cart
  // it('should receive a 404 PRODUCT ITEM NOT IN CART if product item is not in cart', done => {
  //   chai
  //     .request(server)
  //     .delete('/api/me/cart/8')
  //     .set('token', token)
  //     .end((error, response) => {
  //       assert.isNull(error);
  //       expect(response).to.have.status(404);
  //       expect('Content-Type', 'application/json');
  //       done();
  //     });
  // });
});

/*=====================================
 *   LEFTOVERS: TEST Products: GET /api/products
 *=====================================*/
// it('should return 404 BRANDS NOT FOUND if query exists but has no matches', done => {
//   chai
//     .request(server)
//     // test case: query "bartfarf"
//     .get('/api/products?query=bartfarf')
//     .end((error, response) => {
//       assert.exists(response.body);
//       expect(response).to.have.status(404);
//       done();
//     });
// });
// it('should return all products specified by query', done => {
//   chai
//     .request(server)
//     // test case: "best"
//     .get('/api/products?query=best')
//     .end((error, response) => {
//
//       expect(response).to.have.status(200);
//       expect('Content-Type', 'application/json');
//       expect(response.body).to.be.an('array');
//       expect(response.body).to.have.lengthOf(4);
//       done();
//     });
// });
