# Viewer

Use this script to generate public external links to content. Please be warned that content shared via these links can be accessed by anyone.


```sh
node -r dotenv/config viewer
```

Please note this is currently only available in JSON format


# Embedding in other websites

The content disallows being [embeded into iframes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options) by default. To override the default behaviour set the `aud` of the URI(s) for where this content should be embedded.

To simplify this please just append the URI(s) to the end of shell line as above.


```sh
node -r dotenv/config viewer https://mywebsite.com http://mywebsite.org
```
