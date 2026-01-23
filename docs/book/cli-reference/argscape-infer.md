# argscape infer

Run spatial inference on tree sequences from the command line.

```{note}
This command requires `argscape[spatial]`. If you only have the base package, install the spatial extras first:
`pip install argscape[spatial]`
```

## Synopsis

```bash
argscape infer [--version]
argscape infer load --file FILE [--name NAME]
argscape infer list
argscape infer run --input FILE | --name NAME --method METHOD --output DIR [options...]
argscape infer  # interactive mode (default)
```

## Description

The `argscape infer` command provides a command-line interface for running spatial inference algorithms on tree sequences. It supports multiple inference methods including midpoint, FastGAIA, GAIA (quadratic/linear), and SPARG.

```{note}
Spacetrees is available in the [ARGscape web application](https://argscape.com) but not in the CLI.
```

The command operates in several modes:
- **Interactive mode** (default): A guided text interface for selecting data, method, and parameters
- **Run mode**: Direct execution with specified parameters
- **Session management**: Load and list tree sequences for reuse across inference runs

Inference results are saved as new tree sequence files with inferred spatial locations added to node metadata.

## Global Options

`--version`
: Display the ARGscape version number and exit.

## Subcommands

### load

Load a tree sequence into persistent session storage for reuse across inference runs.

```bash
argscape infer load --file FILE [--name NAME]
```

`--file FILE`
: Path to the `.trees` or `.tsz` file to load. Required.

`--name NAME`
: Name to assign to the loaded tree sequence in storage. Default: the file stem (filename without extension).

### list

List all tree sequences currently loaded in session storage.

```bash
argscape infer list
```

Displays the names of all loaded tree sequences and the storage path.

### run

Run spatial inference on a tree sequence.

```bash
argscape infer run --input FILE | --name NAME --method METHOD --output DIR [options...]
```

#### Source Options (mutually exclusive)

`--input FILE`
: Path to an input `.trees` file to run inference on.

`--name NAME`
: Name of a previously loaded tree sequence (from `load` command).

#### Required Options

`--method METHOD`
: Inference method to use. Choices:
  - `midpoint` - Simple midpoint between parent locations
  - `fastgaia` - Fast GAIA algorithm (requires fastgaia package)
  - `gaia-quadratic` - GAIA with quadratic cost function (requires geoancestry)
  - `gaia-linear` - GAIA with linear cost function (requires geoancestry)
  - `sparg` - SPARG spatial inference

`--output DIR`
: Output directory where the result tree sequence will be saved.

#### Output Options

`--output-filename NAME`
: Exact filename for the output file. Default: auto-generated based on input name and method.

#### FastGAIA Weighting Options

`--weight-span`
: Weight by edge span (genomic length). Default: enabled.

`--no-weight-span`
: Disable weighting by edge span.

`--weight-branch-length`
: Weight by branch length (temporal distance). Default: enabled.

`--no-weight-branch-length`
: Disable weighting by branch length.

#### Midpoint Weighting Options

`--mp-weight-span`
: Weight by edge spans (genomic length). Default: enabled.

`--mp-no-weight-span`
: Disable weighting by edge spans for midpoint.

`--mp-weight-branch-length`
: Weight by branch lengths (temporal). Default: disabled.

`--mp-no-weight-branch-length`
: Disable weighting by branch lengths for midpoint.

### Interactive Mode

When invoked without a subcommand, `argscape infer` enters interactive mode with a guided text interface:

```bash
argscape infer
```

Interactive mode will:
1. Check for loaded tree sequences (prompt to load one if none exist)
2. Display a menu to select a tree sequence
3. Show available inference methods
4. For certain methods (midpoint, spacetrees), prompt for method-specific parameters
5. Ask for an output directory
6. Run the inference and save results

## Examples

Load a tree sequence for reuse:

```bash
argscape infer load --file /data/simulation.trees --name sim1
```

List loaded tree sequences:

```bash
argscape infer list
```

Run midpoint inference on a file directly:

```bash
argscape infer run --input data.trees --method midpoint --output ./results
```

Run FastGAIA on a loaded tree sequence:

```bash
argscape infer run --name sim1 --method fastgaia --output ./results
```

Run SPARG inference:

```bash
argscape infer run --name sim1 --method sparg --output ./results
```

Run midpoint without edge span weighting:

```bash
argscape infer run --input data.trees --method midpoint --output ./results \
    --mp-no-weight-span
```

Enter interactive mode:

```bash
argscape infer
```

## Output

Successful inference creates a new tree sequence file in the output directory with a name based on:
- The input file/name (without `.trees` extension)
- A method-specific suffix (e.g., `_midpoint`, `_fastgaia`, `_gaia_quad`)

For example: `simulation_fastgaia.trees`

If a file with that name already exists, a numeric suffix is appended: `simulation_fastgaia_2.trees`

## Exit Codes

- `0` - Success
- `1` - General error (inference failed, method unavailable)
- `2` - Input error (file not found, invalid arguments)

## Requirements

Different inference methods require different packages:
- `midpoint` - No additional dependencies
- `fastgaia` - Requires `fastgaia` package
- `gaia-quadratic`, `gaia-linear` - Requires `geoancestry` (gaiapy)
- `sparg` - Built-in (no additional dependencies)

All methods require the input tree sequence to have spatial locations on sample nodes.

## Related

- {doc}`argscape-load` - Manage session storage
- {doc}`argscape-serve` - Web application with inference UI
- {doc}`/python-api/inference` - Python API for inference
