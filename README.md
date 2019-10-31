# BatchService

## ENV
- `PORT` - http port to listen (default 8080)
- `DEBUG` - debug mode (default false)

## Request example
`POST /batch`

Expected request body:  
```js
// request template example
const request = {
  template: {
    // http method
    verb: "PUT",
    // url template, params should contain values for all placeholders
    url: "https://jsonplaceholder.typicode.com/users/{userId}​"
  },

  // "targets" defines number all requests;
  // is some of "params", "query", "body" are not specified - "common" section will be used
  targets: [{
    params: { userId: 1 },
    // query: { foo: bar },
    // body: { age: 32 }
  }, {
    params: { userId: 1 }
  }],

  // common req data for all targes, has lower priority than "targets"
  common: {
    // params: { },
    // query: { },
    body: {
        age: 30
    }
  }
};
```


```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"template":{"verb":"PUT","url":"https://jsonplaceholder.typicode.com/users/{userId}"},"targets":[{"params":{"userId":1},"query":{"foo":"bar"},"body":{"age":32}},{"params":{"userId":2}},{"params":{"userId":3}}],"common":{"body":{"age":30}}}' \
  http://localhost:8080/batch
```

```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"template":{"verb":"PUT","url":"https://guesty-user-service.herokuapp.com/user/{userId}"},
  "targets":[{"params":{"userId":1}},{"params":{"userId":2}},{"params":{"userId":3}},{"params":{"userId":4}},{"params":{"userId":5}},{"params":{"userId":6}},{"params":{"userId":7}},{"params":{"userId":8}}],"common":{"body":{"age":30}}}' \
  http://localhost:8080/batch
```
