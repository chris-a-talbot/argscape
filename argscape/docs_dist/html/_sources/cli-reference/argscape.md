# argscape

The main ARGscape command-line interface with subcommands for visualization, serving, inference, and more.

## Synopsis

```bash
argscape [--version] [--help]
argscape <command> [options...]
```

## Description

The `argscape` command is the main entry point for all ARGscape CLI functionality. It provides subcommands for different tasks:

| Command | Description | Requires |
|---------|-------------|----------|
| `argscape viz` | Standalone visualization | Base install |
| `argscape serve` | Start web application server | `argscape[spatial]` |
| `argscape infer` | Run spatial inference | `argscape[spatial]` |
| `argscape load` | Manage session storage | `argscape[spatial]` |
| `argscape benchmark` | Run performance benchmarks | `argscape[spatial]` |

## Global Options

`--version`
: Display the ARGscape version number and exit.

`--help`
: Display help message and exit.

## Commands

### viz

Standalone visualization of tree sequences. Available with the base installation.

```bash
argscape viz INPUT [-o OUTPUT] [--mode MODE] [options...]
```

See {doc}`argscape-viz` for complete documentation.

### serve

Start the ARGscape web application server. Requires `argscape[spatial]`.

```bash
argscape serve [--host HOST] [--port PORT] [--reload] [--no-browser] [--no-tsdate]
```

See {doc}`argscape-serve` for complete documentation.

### infer

Run spatial inference on tree sequences. Requires `argscape[spatial]`.

```bash
argscape infer [subcommand] [options...]
```

See {doc}`argscape-infer` for complete documentation.

### load

Manage session storage for tree sequences. Requires `argscape[spatial]`.

```bash
argscape load [subcommand] [options...]
```

See {doc}`argscape-load` for complete documentation.

### benchmark

Run performance benchmarks. Requires `argscape[spatial]`.

```bash
argscape benchmark [subcommand] [options...]
```

See {doc}`/advanced/benchmarking/overview` for complete documentation.

## Examples

Check version:

```bash
argscape --version
```

Quick 2D visualization (base install):

```bash
argscape viz simulation.trees
```

Export to PNG (requires playwright):

```bash
argscape viz simulation.trees -o figure.png
```

Start web application (requires spatial):

```bash
argscape serve
```

Run inference (requires spatial):

```bash
argscape infer run --input data.trees --method fastgaia --output ./results
```

## Installation Levels

Different commands require different installation levels:

**Base install** (`pip install argscape`):
- `argscape viz` - 2D visualization only

**Full install** (`pip install argscape[spatial]`):
- `argscape serve` - Web application
- `argscape infer` - Spatial inference
- `argscape load` - Session management
- `argscape benchmark` - Benchmarking
- `argscape viz` - 2D and 3D visualization

## Related

- {doc}`argscape-viz` - Standalone visualization
- {doc}`argscape-serve` - Web application server
- {doc}`argscape-infer` - Spatial inference
- {doc}`argscape-load` - Session storage management
- {doc}`/advanced/benchmarking/overview` - Benchmarking
- {doc}`/python-api/overview` - Python API
