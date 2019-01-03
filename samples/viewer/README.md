# Viewer

Use this script to generate public external links to content. Please be warned that content shared via these links can be accessed by anyone.


```sh
node -r dotenv/config viewer
```

Please note this is currently only available in JSON format

The response contains the `viewerUrl` e.g. 

> "viewerUrl": [/viewer/25529/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjU1MjksImF1ZCI6Imh0dHBzOi8vYXVkdS5jb20saHR0cHM6Ly9hc2Rhc2QuY29tIiwiaWF0IjoxNTQ2NDc3ODMyfQ.3GD5QvZbodXGphEftoZRgLrKty8b3NrFVQdLj-JJ_qw](https://product.5app.com/viewer/25529/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjU1MjksImF1ZCI6Imh0dHBzOi8vYXVkdS5jb20saHR0cHM6Ly9hc2Rhc2QuY29tIiwiaWF0IjoxNTQ2NDc3ODMyfQ.3GD5QvZbodXGphEftoZRgLrKty8b3NrFVQdLj-JJ_qw)


# Embedding in other websites

The content disallows being [embeded into iframes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options) by default. To override the default behaviour set the `aud` of the URI(s) for where this content should be embedded.

To simplify this please just append the URI(s) to the end of shell line as above.


```sh
node -r dotenv/config viewer https://mywebsite.com http://mywebsite.org
```

# Limitations

Currently the asset viewer only has support for `web`, `Microsites` and `video` formats.