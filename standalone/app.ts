const server = Deno.listen({ port: 8888 });
console.log(`HTTP webserver running.  Access it at:  http://localhost:8888/`);

// define command used to create the subprocess
const cmd = ["/opt/google/chrome/chrome", "--app=http://localhost:8888/"];

// create subprocess
const p = Deno.run({ cmd });

// await its completion
p.status().then((res) => {
    // eslint-disable-next-line
    console.log(res)

    Deno.exit();
});

// Connections to the server will be yielded up as an async iterable.
for await (const conn of server) {
  // In order to not be blocking, we need to handle each connection individually
  // without awaiting the function
  serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
  // This "upgrades" a network connection into an HTTP connection.
  const httpConn = Deno.serveHttp(conn);
  // Each request sent over the HTTP connection will be yielded as an async
  // iterator from the HTTP connection.
  for await (const requestEvent of httpConn) {
    // The native HTTP server uses the web standard `Request` and `Response`
    // objects.
    const body = `
    <head>
        <title>App</title>
    </head>
    <body>
        <h1>
            Your user-agent is:\n\n${
                requestEvent.request.headers.get("user-agent") ?? "Unknown"
            }
        </h1>
    </body>
    
    `;
    // The requestEvent's `.respondWith()` method is how we send the response
    // back to the client.
    requestEvent.respondWith(
      new Response(body, {
          headers: {
              "content-type": "text/html"
          },
        status: 200,
      }),
    );
  }
}