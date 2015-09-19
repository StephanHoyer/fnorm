var expect = require('expect.js');
var fnORM = require('./index');
var Promise = require('bluebird');

function noop() {}

function identity(val) {
  return val;
}

function getId(item) {
  return item.id;
}

function isFoo(item) {
  return item.isFoo;
}

describe('basics', function() {
  var store;

  beforeEach(function() {
    // for testing we simply forward the query options as result of the query
    store = fnORM(identity);
  });

  it('should allow to create user store', function() {
    return store('user', {
      pk: 'hulu'
    }).then(function(options) {
      expect(options.tableOptions.pk).to.be('hulu');
      expect(options.tableName).to.be('user');
    });
  });

  it('should create a query to fetch array of items from store', function() {
    return store('user').then(function(options) {
      expect(options.returnArray).to.be(true);
    });
  });

  it('should create a query to fetch one item from store', function() {
    return store('user').get(123).then(function(options) {
      expect(options.limit).to.be(1);
      expect(options.returnArray).to.be(false);
      expect(options.where.id).to.be(123);
    });
  });

  it('should create a query with where to fetch array of items from store', function() {
    return store('user').where({
      huhu: 'haha'
    }).then(function(options) {
      expect(options.returnArray).to.be(true);
      expect(options.where.huhu).to.be('haha');
    });
  });

  it('should create a count request', function() {
    return store('user').count().then(function(options) {
      expect(options.count).to.be(true);
    });
  });

  it('should create a query with map functions', function() {
    return store('user').map(getId).then(function(options) {
      expect(options.handler).to.have.length(1);
    });
  });

  it('should create a query with multiple functions', function() {
    return store('user').map(getId).filter(isFoo).then(function(options) {
      expect(options.handler).to.have.length(2);

      var getIdHandler = options.handler[0];
      var isFooHandler = options.handler[1];

      expect(getIdHandler([{id: 'huhu'}])[0]).to.be('huhu');
      expect(isFooHandler([{isFoo: false}, {isFoo: true}])).have.length(1);
    });
  });

  it('should be possible to add own handler functions', function() {
    store = fnORM(identity, {
      methods: {
        fooify: function(result, arg) {
          result.foo = arg;
          return result;
        }
      }
    });

    return store('user').map(identity).fooify('superman').then(function(options) {
      expect(options.handler).to.have.length(2);
      var fooifyer = options.handler[1];
      expect(fooifyer({}).foo).to.be('superman');
    });
  });

  it('should run query when calling `then` on query object', function() {
    store = fnORM(function run(options) {
      expect(options.tableName).to.be('user');
      return 'user';
    });
    return store('user').then(function(user) {
      expect(user).to.be('user');
    });
  });

  it('should allow to catch errors thrown in runner calling `then` on query object', function() {
    store = fnORM(function run(options) {
      throw new Error('eeck');
    });
    return store('user').then(noop, function(error) {
      expect(error.message).to.be('eeck');
    });
  });

  it('should allow to catch errors thrown in runner calling `then` on query object', function() {
    store = fnORM(function run(options) {
      throw new Error('eeck');
    });
    return store('user').catch(function(error) {
      expect(error.message).to.be('eeck');
    });
  });
});

describe('relations', function() {
  var store;

  beforeEach(function() {
    // for testing we simply forward the query options as result of the query
    store = fnORM(identity);
  });

  it('allow to add relations to query', function() {
    return store('user').withRelated('friends').then(function(options) {
      expect(options.withRelated[0]).to.be('friends');
    });
  });

  it('allow to add multiple relations at once to query', function() {
    return store('user').withRelated(['friends', 'comments']).then(function(options) {
      expect(options.withRelated[0]).to.be('friends');
      expect(options.withRelated[1]).to.be('comments');
    });
  });
  it('allow to add multiple relations sequentially to query', function() {
    return store('user').withRelated('friends').withRelated('comments').then(function(options) {
      expect(options.withRelated[0]).to.be('friends');
      expect(options.withRelated[1]).to.be('comments');
    });
  });
});
