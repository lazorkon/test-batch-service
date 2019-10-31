# BatchService

```js
// request template example
const request = {
    template: {
        verb: "PUT",
        url: "https://jsonplaceholder.typicode.com/users/{userId}​",
    },

    // req data could be overwritte for each target
    targets: [{
        params: { userId: 1 },
        // query: { foo: bar },
        // body: { age: 32 },
    }, {
      params: { userId: 1 },
    }],

    // common req data for all targes (has lover priority than "target")
    common: {
        body: {
            age: 30,
        },
    },
};
```


```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"template":{"verb":"PUT","url":"https://jsonplaceholder.typicode.com/users/{userId}"},"targets":[{"params":{"userId":1},"query":{"foo":"bar"},"body":{"age":32}},{"params":{"userId":2}},{"params":{"userId":3}}],"common":{"body":{"age":30}}}' \
  http://localhost:8080/batch
```
