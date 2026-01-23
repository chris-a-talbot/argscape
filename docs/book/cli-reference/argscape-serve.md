# argscape serve

Start the ARGscape web application server.

## Synopsis

```bash
argscape serve [--host HOST] [--port PORT] [--reload] [--no-browser] [--no-tsdate] [--version]
```

## Description

The `argscape serve` command starts the ARGscape web server, which provides an interactive browser-based interface for visualizing and analyzing tree sequences (Ancestral Recombination Graphs). By default, the server starts on `localhost:8000` and automatically opens a web browser to the application.

```{note}
This command requires `argscape[spatial]`. If you only have the base package, install the spatial extras first:
`pip install argscape[spatial]`
```

The web application supports:
- Uploading and managing tree sequence files (.trees, .tsz)
- Interactive 2D force-directed graph visualization
- 3D spatial visualization with geographic mapping
- Running spatial and temporal inference algorithms
- Exporting visualizations as PNG, SVG, or PDF

## Options

`--host HOST`
: The host address to bind the server to. Default: `127.0.0.1` (localhost only). Use `0.0.0.0` to allow external connections.

`--port PORT`
: The port number for the server. Default: `8000`.

`--reload`
: Enable auto-reload mode for development. The server will automatically restart when source files change.

`--no-browser`
: Do not automatically open a web browser when the server starts. Useful for headless operation or when running benchmarks.

`--no-tsdate`
: Disable tsdate temporal inference loading at startup. This significantly reduces startup time when temporal inference is not needed. Sets the `DISABLE_TSDATE` environment variable.

`--version`
: Display the ARGscape version number and exit.

## Environment Variables

The following environment variables affect server behavior:

`DISABLE_TSDATE`
: Set to `true` or `1` to skip loading tsdate at startup. Equivalent to `--no-tsdate`.

`FORCE_RAILWAY_MODE`
: Simulate Railway deployment mode locally.

`ENABLE_ENCRYPTION`
: Enable session ID encryption (used in production deployments).

`PORT`
: Alternative way to set the server port (command-line `--port` takes precedence).

## Related

- {doc}`argscape-viz` - Standalone visualization without server
- {doc}`argscape-infer` - Run inference from command line
- {doc}`argscape-load` - Manage session storage
- {doc}`/python-api/visualize` - Python API for programmatic visualization
