# argscape load

Manage ARGscape session storage for tree sequences.

```{note}
This command requires `argscape[spatial]`. If you only have the base package, install the spatial extras first:
`pip install argscape[spatial]`
```

## Synopsis

```bash
argscape load [--version]
argscape load load --file FILE [--name NAME]
argscape load list
argscape load available --dir DIRECTORY
argscape load rm --name NAME
argscape load clear
argscape load load-with-locations --file FILE --sample-csv CSV --node-csv CSV [--name NAME] [--output DIR]
```

## Description

The `argscape load` command manages persistent session storage for tree sequences. This allows you to load tree sequence files once and reuse them across multiple operations, including inference runs with `argscape_infer`.

Session storage is shared with the web application when both are using the CLI session. Storage persists across commands until explicitly cleared.

When invoked without a subcommand, `argscape load` defaults to the `list` command.

## Global Options

`--version`
: Display the ARGscape version number and exit.

## Subcommands

### load

Load a tree sequence file into session storage.

```bash
argscape load load --file FILE [--name NAME]
```

`--file FILE`
: Path to the `.trees` or `.tsz` file to load. Required.

`--name NAME`
: Name to assign to the loaded tree sequence. Default: the file stem (filename without extension).

### list

List all tree sequences currently in session storage.

```bash
argscape load list
```

Displays a numbered list of stored tree sequences and the storage directory path. If no tree sequences are loaded, displays a helpful message.

This is the default command when `argscape load` is invoked without arguments.

### available

Scan a directory for available tree sequence files.

```bash
argscape load available --dir DIRECTORY
```

`--dir DIRECTORY`
: Directory to scan for `.trees` and `.tsz` files. Required.

Lists all loadable tree sequence files in the specified directory with their size information (number of samples and nodes). Files that take too long to load (>1 second) are listed with "unknown size".

### rm

Remove a tree sequence from session storage.

```bash
argscape load rm --name NAME
```

`--name NAME`
: Name of the tree sequence to remove (as shown in `list` output).

`--file FILE`
: Alias for `--name`.

### clear

Remove all tree sequences from session storage.

```bash
argscape load clear
```

Removes all stored tree sequences for the CLI session. Displays the count of items removed.

### load-with-locations

Load a tree sequence and apply custom spatial locations from CSV files.

```bash
argscape load load-with-locations --file FILE --sample-csv CSV --node-csv CSV [--name NAME] [--output DIR]
```

`--file FILE`
: Path to the `.trees` or `.tsz` file to load. Required.

`--sample-csv CSV`
: Path to a CSV file containing sample node locations. Required. Must have columns: `node_id`, `x`, `y` (and optionally `z`).

`--node-csv CSV`
: Path to a CSV file containing internal node locations. Required. Must have columns: `node_id`, `x`, `y` (and optionally `z`).

`--name NAME`
: Base name for the stored tree sequences. Default: the file stem.

`--output DIR`
: Optional directory to write the updated tree sequence file to disk.

This command loads the original tree sequence under the base name and creates a second entry with `_custom_xy` suffix containing the applied custom locations.

## CSV Format for Locations

The location CSV files must contain the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `node_id` | integer | Node ID from the tree sequence |
| `x` | float | X coordinate (longitude or abstract x) |
| `y` | float | Y coordinate (latitude or abstract y) |
| `z` | float | Z coordinate (optional, defaults to 0) |

Example CSV:
```text
node_id,x,y,z
0,10.5,45.2,0
1,11.3,44.8,0
2,10.8,45.5,0
```

## Storage Location

Tree sequences are stored in the ARGscape session storage directory, typically at:
- `dev_storage/` in the ARGscape installation directory

The exact path is shown when running `argscape load list`.

## Exit Codes

- `0` - Success
- `1` - General error (storage unavailable, operation failed)
- `2` - Input error (file not found, directory not found)

## Related

- {doc}`argscape-infer` - Run inference using loaded tree sequences
- {doc}`argscape-serve` - Web application (shares session storage)
