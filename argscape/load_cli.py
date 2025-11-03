"""
Small helper CLI to manage persistent session storage for tree sequences.

Commands:
- load: Load a .trees file into storage
- list: List stored tree sequences (safe if none exist)
- rm:   Remove one stored tree sequence by name
- clear: Remove all stored tree sequences for the CLI session
"""

import argparse
from pathlib import Path
import sys
import csv
from typing import Dict, Tuple

try:
    import tskit  # type: ignore
except Exception as e:  # pragma: no cover
    tskit = None  # type: ignore
    _TSKIT_IMPORT_ERROR = e
else:
    _TSKIT_IMPORT_ERROR = None


CLI_SESSION_IP = "cli"


def cmd_load(args: argparse.Namespace) -> int:
    if _TSKIT_IMPORT_ERROR is not None:
        print(f"Error: tskit not available: {_TSKIT_IMPORT_ERROR}", file=sys.stderr)
        return 1
    try:
        from argscape.api.services import session_storage  # type: ignore
    except Exception as e:  # pragma: no cover
        print(f"Error: session storage unavailable: {e}", file=sys.stderr)
        return 1

    path = Path(args.file).expanduser().resolve()
    if not path.exists():
        print(f"Error: file not found: {path}", file=sys.stderr)
        return 2
    try:
        ts = tskit.load(str(path))  # type: ignore
        name = args.name or path.stem
        session_id = session_storage.get_or_create_session(CLI_SESSION_IP)
        with open(path, "rb") as f:
            session_storage.store_file(session_id, name, f.read())
        session_storage.store_tree_sequence(session_id, name, ts)
        print(f"Loaded '{name}' into session storage.")
        return 0
    except Exception as e:
        print(f"Failed to load: {e}", file=sys.stderr)
        return 1


def cmd_list(_: argparse.Namespace) -> int:
    try:
        from argscape.api.services import session_storage  # type: ignore
    except Exception:
        # Treat missing storage as empty list rather than an error
        print("No tree sequences loaded. Use 'argscape_load --file <path> --name <name>' to add one.")
        return 0
    try:
        session_id = session_storage.get_or_create_session(CLI_SESSION_IP)
        names = list(sorted(session_storage.get_file_list(session_id)))
        if not names:
            print("No tree sequences loaded. Use 'argscape_load --file <path> --name <name>' to add one.")
            return 0
        print("Loaded tree sequences:")
        for i, name in enumerate(names, 1):
            print(f"  {i}. {name}")
        print(f"Storage path: {session_storage.storage_base_path}")
        return 0
    except Exception:
        # Be forgiving; treat unexpected storage issues as empty
        print("No tree sequences loaded. Use 'argscape_load --file <path> --name <name>' to add one.")
        return 0


def build_parser() -> argparse.ArgumentParser:
    from argscape import __version__
    p = argparse.ArgumentParser(prog="argscape_load", description="Manage ARGscape session storage (load, list, rm, clear)")
    p.add_argument(
        "--version", action="version",
        version=f"ARGscape {__version__}",
        help="Show version number and exit"
    )
    sub = p.add_subparsers(dest="command")

    p_load = sub.add_parser("load", help="Load a .trees file into storage")
    p_load.add_argument("--file", required=True, help="Path to .trees file")
    p_load.add_argument("--name", required=False, help="Optional name (default: file stem)")
    p_load.set_defaults(func=cmd_load)

    p_list = sub.add_parser("list", help="List stored tree sequences")
    p_list.set_defaults(func=cmd_list)

    def cmd_rm(args: argparse.Namespace) -> int:
        try:
            from argscape.api.services import session_storage  # type: ignore
        except Exception as e:
            print(f"Error: session storage unavailable: {e}", file=sys.stderr)
            return 1
        try:
            name = args.name or args.file
            if not name:
                print("Error: --name (or --file) is required", file=sys.stderr)
                return 2
            session_id = session_storage.get_or_create_session(CLI_SESSION_IP)
            ok = session_storage.delete_file(session_id, name)
            if ok:
                print(f"Removed '{name}' from storage.")
            else:
                print(f"No entry named '{name}' found. Nothing to do.")
            return 0
        except Exception as e:
            print(f"Failed to remove: {e}", file=sys.stderr)
            return 1

    p_rm = sub.add_parser("rm", help="Remove a stored tree sequence by name")
    p_rm.add_argument("--name", required=False, help="Stored name to remove (as shown in list)")
    p_rm.add_argument("--file", required=False, help="Alias for --name")
    p_rm.set_defaults(func=cmd_rm)

    def cmd_clear(_: argparse.Namespace) -> int:
        try:
            from argscape.api.services import session_storage  # type: ignore
        except Exception as e:
            print(f"Error: session storage unavailable: {e}", file=sys.stderr)
            return 1
        try:
            session_id = session_storage.get_or_create_session(CLI_SESSION_IP)
            names = list(session_storage.get_file_list(session_id))
            if not names:
                print("Storage empty. Nothing to clear.")
                return 0
            removed = 0
            for n in names:
                if session_storage.delete_file(session_id, n):
                    removed += 1
            # Best-effort: remove session directory metadata
            try:
                # Private API, ignore failures
                session_storage._cleanup_session_files(session_id)  # type: ignore[attr-defined]
            except Exception:
                pass
            print(f"Cleared {removed} item(s) from storage.")
            return 0
        except Exception as e:
            print(f"Failed to clear storage: {e}", file=sys.stderr)
            return 1

    p_clear = sub.add_parser("clear", help="Remove all stored tree sequences for this CLI session")
    p_clear.set_defaults(func=cmd_clear)

    def parse_locations_csv(csv_path: Path) -> Dict[int, Tuple[float, float, float]]:
        mapping: Dict[int, Tuple[float, float, float]] = {}
        with open(csv_path, newline="") as f:
            reader = csv.DictReader(f)
            required = {"node_id", "x", "y"}
            header = set(reader.fieldnames or [])
            if not required.issubset(header):
                missing = ", ".join(sorted(required - header))
                raise ValueError(f"CSV missing required columns: {missing}")
            for row in reader:
                try:
                    node_id = int(str(row.get("node_id")).strip())
                    x = float(str(row.get("x")).strip())
                    y = float(str(row.get("y")).strip())
                    z_val = row.get("z")
                    z = float(str(z_val).strip()) if z_val not in (None, "", "None") else 0.0
                    mapping[node_id] = (x, y, z)
                except Exception as e:
                    raise ValueError(f"Invalid row in {csv_path}: {row} ({e})")
        if not mapping:
            raise ValueError(f"No rows parsed from {csv_path}")
        return mapping

    def cmd_load_with_locations(args: argparse.Namespace) -> int:
        if _TSKIT_IMPORT_ERROR is not None:
            print(f"Error: tskit not available: {_TSKIT_IMPORT_ERROR}", file=sys.stderr)
            return 1
        try:
            from argscape.api.services import session_storage  # type: ignore
            from argscape.api.geo_utils.tree_sequence import apply_custom_locations_to_tree_sequence  # type: ignore
        except Exception as e:
            print(f"Error: required backend modules unavailable: {e}", file=sys.stderr)
            return 1

        trees_path = Path(args.file).expanduser().resolve()
        if not trees_path.exists():
            print(f"Error: file not found: {trees_path}", file=sys.stderr)
            return 2
        sample_csv = Path(args.sample_csv).expanduser().resolve()
        node_csv = Path(args.node_csv).expanduser().resolve()
        if not sample_csv.exists():
            print(f"Error: sample CSV not found: {sample_csv}", file=sys.stderr)
            return 2
        if not node_csv.exists():
            print(f"Error: node CSV not found: {node_csv}", file=sys.stderr)
            return 2

        try:
            ts = tskit.load(str(trees_path))  # type: ignore
            sample_locations = parse_locations_csv(sample_csv)
            node_locations = parse_locations_csv(node_csv)
            ts_updated = apply_custom_locations_to_tree_sequence(ts, sample_locations, node_locations)

            # Derive storage names (without extension)
            base_name = args.name or trees_path.stem
            updated_name = f"{base_name}_custom_xy"

            session_id = session_storage.get_or_create_session(CLI_SESSION_IP)
            # Store original (if not already loaded in this session)
            try:
                with open(trees_path, "rb") as f:
                    session_storage.store_file(session_id, base_name, f.read())
            except Exception:
                pass
            session_storage.store_tree_sequence(session_id, base_name, ts)
            # Store updated
            session_storage.store_tree_sequence(session_id, updated_name, ts_updated)

            # Optional file output
            if args.output:
                out_dir = Path(args.output).expanduser().resolve()
                out_dir.mkdir(parents=True, exist_ok=True)
                out_path = out_dir / f"{updated_name}.trees"
                ts_updated.dump(str(out_path))
                print(f"Saved updated tree sequence: {out_path}")

            print(f"Loaded '{base_name}' and created '{updated_name}' in session storage.")
            return 0
        except Exception as e:
            print(f"Failed to apply custom locations: {e}", file=sys.stderr)
            return 1

    p_loadxy = sub.add_parser("load-with-locations", help="Load .trees and apply sample/node locations from CSVs")
    p_loadxy.add_argument("--file", required=True, help="Path to .trees/.tsz file")
    p_loadxy.add_argument("--sample-csv", required=True, help="CSV with columns: node_id,x,y[,z]")
    p_loadxy.add_argument("--node-csv", required=True, help="CSV with columns: node_id,x,y[,z]")
    p_loadxy.add_argument("--name", required=False, help="Optional base name (default: file stem)")
    p_loadxy.add_argument("--output", required=False, help="Optional directory to write updated .trees")
    p_loadxy.set_defaults(func=cmd_load_with_locations)

    return p


def main(argv=None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if getattr(args, "command", None) is None:
        # Default to list for convenience
        return cmd_list(args)
    return args.func(args)  # type: ignore[attr-defined]


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())


