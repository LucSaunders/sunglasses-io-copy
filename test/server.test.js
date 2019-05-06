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
  it('should return 400 INVALID BRAND ID if the brand id does not match any in app data', done => {
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
  it('should return all products that match query regardless of upper- or lower-case letters in the query', done => {
    chai
      .request(server)
      .get('/api/products?query=bUtTeR')
      .end((error, response) => {
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        assert.exists(response.body);
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(1);
        expect(response.body).to.deep.include({
          id: '10',
          categoryId: '5',
          name: 'Peanut Butter',
          description: 'The stickiest glasses in the world',
          price: 103,
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
      .get('/api/products?query=barneyfife')
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
let token = null; // token must be defined for the tests that follow
describe('/POST user login', () => {
  it('should succeed and return 200 NOW LOGGED IN if username and password are valid', done => {
    chai
      .request(server)
      .post('/api/login')
      .send({ username: 'greenlion235', password: 'waters' })
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.a('string');
        expect(response.body).to.be.lengthOf(16);
        // Set token equal to now-confirmed response.body
        token = response.body;
        done();
      });
  });
  it('should return 400 INCORRECTLY FORMATTED REQUEST if username or password is not included', done => {
    chai
      .request(server)
      .post('/api/login')
      .send({ username: 'lazywolf342' })
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(400);
        done();
      });
  });
  it('should return 401 INVALID USERNAME OR PASSWORD if username or password does not match any in app data', done => {
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
const bogusToken = '5avX40M3BB5iptJc';
describe('/GET user cart', () => {
  it('should return all products in user cart', done => {
    chai
      .request(server)
      .get('/api/me/cart')
      .set('token', token)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        expect(response.body).to.be.lengthOf(0);
        done();
      });
  });
  it('should return 401 ACCESS NOT AUTHORIZED if token is invalid', done => {
    chai
      .request(server)
      .get('/api/me/cart')
      .set('token', bogusToken)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(401);
        done();
      });
  });
});

/*=====================================================================
 *   TEST Add Product to Cart: POST /api/me/cart/:productId <> Protected route
 *=====================================================================*/
describe('/POST add product to user cart', () => {
  it('should add specified product to user cart', done => {
    chai
      .request(server)
      .post('/api/me/cart/8')
      .set('token', token)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        expect(response.body).to.be.lengthOf(1);
        expect(response.body).to.deep.include({
          quantity: 1,
          id: '8',
          categoryId: '4',
          name: 'Coke cans',
          description: 'The thickest glasses in the world',
          price: 110,
          imageUrls: [
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg'
          ]
        });
        done();
      });
  });
  it('should update product quantity if product is already in user cart', done => {
    chai
      .request(server)
      .post('/api/me/cart/8')
      .set('token', token)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        expect(response.body).to.be.lengthOf(1);
        expect(response.body).to.deep.include({
          quantity: 2,
          id: '8',
          categoryId: '4',
          name: 'Coke cans',
          description: 'The thickest glasses in the world',
          price: 110,
          imageUrls: [
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
            'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg'
          ]
        });
        done();
      });
  });
  it('should return 400 INVALID PRODUCT ID if product id does not match any in app data', done => {
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
  it('should return 401 ACCESS NOT AUTHORIZED if no token or invalid token', done => {
    chai
      .request(server)
      .post('/api/me/cart/5')
      .set('token', bogusToken)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(401);
        done();
      });
  });
});

/*===============================================================
 *   TEST Remove Product from Cart: DELETE /api/me/cart/:productId <> Protected route
 *===============================================================*/
describe('/DELETE product', () => {
  it('should delete product from user cart', done => {
    chai
      .request(server)
      .delete('/api/me/cart/8')
      .set('token', token)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        expect(response.body).to.be.lengthOf(0);
        done();
      });
  });
  it('should return 400 INVALID PRODUCT ID if product id if item is not in cart', done => {
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
  it('should return 401 ACCESS NOT AUTHORIZED if no token or invalid token', done => {
    chai
      .request(server)
      .delete('/api/me/cart/12')
      .set('token', bogusToken)
      .end((error, response) => {
        assert.isNull(error);
        expect(response).to.have.status(401);
        done();
      });
  });
});
