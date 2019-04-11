const server = require('../app/server');

const chai = require('chai'),
  chaiHttp = require('chai-http'),
  expect = chai.expect,
  assert = chai.assert;

chai.use(chaiHttp);

// // Delay running the tests until after 10s
// setTimeout(function() {
//   run();
// }, 10000);

/*==================================
 *   TEST Brands: GET /api/brands
 *==================================*/
describe('/GET brands', () => {
  it('should return all brands', done => {
    chai
      .request(server)
      .get('/api/brands')
      .end((error, response) => {
        // expect(200)???
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(5);
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
      // test case:  "categoryId": "5" (Burberry) should return 2 products
      .get('/api/brands/5/products')
      .end((error, response) => {
        // expect(200)???
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(2);
        done();
      });
  });
  it('should return 404 BRAND ID OR PRODUCTS NOT FOUND if there are no matches', done => {
    chai
      .request(server)
      .get('/api/brands/6/products')
      .end((error, response) => {
        assert.exists(response.body);
        // expect(404) ???
        expect(response).to.have.status(404);
        done();
      });
  });
});

/*=====================================
 *   TEST Products: GET /api/products
 *=====================================*/
describe('/GET products', () => {
  it('should return all products of all brands if query is empty', done => {
    chai
      .request(server)
      .get('/api/products')
      .end((error, response) => {
        // expect(200)???
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(11);
        done();
      });
  });
  it('should return 404 BRANDS NOT FOUND if query exists but has no matches', done => {
    chai
      .request(server)
      // test case: query "bartfarf"
      .get('/api/products?query=bartfarf')
      .end((error, response) => {
        assert.exists(response.body);
        // expect(400); ???
        expect(response).to.have.status(404);
        done();
      });
  });
  it('should return all products specified by query', done => {
    chai
      .request(server)
      // test case: "best"
      .get('/api/products?query=best')
      .end((error, response) => {
        // expect(200) ???
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(4);
        done();
      });
  });
});

/*====================================
 *   TEST User login: POST /api/login
 *====================================
    REVISED 
-------------------------------------*/
describe('/POST user login', () => {
  it('should succeed if username and password are both valid', done => {
    chai
      .request(server)
      .post('/api/login')
      // .set('Accept', 'application/json')
      // .set('Content-Type', 'application/json')
      .send({ username: 'greenlion235', password: 'waters' })
      .end((error, response) => {
        assert.isNull(error);
        // expect(200); ???
        expect(response).to.have.status(200);
        expect('Content-Type', 'application/json');
        // expect(function(response) {
        // expect(response.body).not.to.be.empty;
        // expect(response.body).to.be.an('object');
      });
    done();
  });
  it('should return 401 error if username or password is invalid', done => {
    chai
      .request(server)
      .post('/api/login')
      .send({ username: 'invalid', password: 'equallyInvalid' })
      .end((error, response) => {
        assert.isNull(error);
        // expect(401); ???
        expect(response).to.have.status(401);
        done();
      });
  });
});
