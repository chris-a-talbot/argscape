"""
Command-line interface for running ARGscape inference.

Features:
- load: Load tree sequences into persistent session storage for reuse
- list: List loaded tree sequences
- run:  Run inference (spatial or temporal) on an input file or loaded name and save output
- interactive (default): Guided text UI to choose a loaded sequence, method, and output

Usage examples:
  argscape_infer load --file /path/data.trees --name mydata
  argscape_infer list
  argscape_infer run --input /path/data.trees --method midpoint --output /tmp/outdir
  argscape_infer run --name mydata --method gaia-quadratic --output /tmp/outdir
  argscape_infer run --name mydata --method tsdate --output /tmp/outdir
  argscape_infer  # interactive mode
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Dict, Optional, Tuple

try:
    import tskit  # type: ignore
except Exception as import_error:  # pragma: no cover
    tskit = None  # type: ignore
    _TSKIT_IMPORT_ERROR = import_error
else:
    _TSKIT_IMPORT_ERROR = None

# Session storage for loaded files
try:
    from argscape.api.services import session_storage  # type: ignore
except Exception as e:  # pragma: no cover
    session_storage = None  # type: ignore
    _SESSION_IMPORT_ERROR = e
else:
    _SESSION_IMPORT_ERROR = None

# Spatial inference implementations and availability flags
try:
    from argscape.api.inference import (
        run_fastgaia_inference,
        run_gaia_quadratic_inference,
        run_gaia_linear_inference,
        run_midpoint_inference,
        FASTGAIA_AVAILABLE,
        GEOANCESTRY_AVAILABLE,
        MIDPOINT_AVAILABLE,
    )
except Exception:  # pragma: no cover
    run_fastgaia_inference = None  # type: ignore
    run_gaia_quadratic_inference = None  # type: ignore
    run_gaia_linear_inference = None  # type: ignore
    run_midpoint_inference = None  # type: ignore
    FASTGAIA_AVAILABLE = False  # type: ignore
    GEOANCESTRY_AVAILABLE = False  # type: ignore
    MIDPOINT_AVAILABLE = False  # type: ignore

try:
    from argscape.api.inference import (
        run_sparg_inference,
        SPARG_AVAILABLE,
    )
except Exception:  # pragma: no cover
    run_sparg_inference = None  # type: ignore
    SPARG_AVAILABLE = False  # type: ignore

try:
    from argscape.api.geo_utils.tree_sequence import (
        check_spatial_completeness,
    )
except Exception:  # pragma: no cover
    def check_spatial_completeness(ts):  # type: ignore
        return {"has_sample_spatial": False, "has_all_spatial": False, "spatial_status": "none"}

# Temporal inference (tsdate)
try:
    from argscape.api.inference import (
        run_tsdate_inference,
        TSDATE_AVAILABLE,
    )
except Exception:  # pragma: no cover
    run_tsdate_inference = None  # type: ignore
    TSDATE_AVAILABLE = False  # type: ignore

CLI_SESSION_IP = "cli"  # stable pseudo-IP for CLI persistent storage


def _require_tskit():
    if _TSKIT_IMPORT_ERROR is not None:
        raise RuntimeError(
            f"tskit is required for CLI operations but failed to import: {_TSKIT_IMPORT_ERROR}"
        )


def _ensure_output_dir(path_like: str) -> Path:
    output_dir = Path(path_like).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def _derive_output_filename(input_name: str, method_suffix: str) -> str:
    base = os.path.basename(input_name)
    # Strip common .trees or .trees.trees style extensions robustly
    while base.endswith(".trees"):
        base = base[: -len(".trees")]
    return f"{base}_{method_suffix}.trees"


def _load_ts_from_path(input_path: str) -> tskit.TreeSequence:  # type: ignore
    _require_tskit()
    path = Path(input_path).expanduser().resolve()
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")
    return tskit.load(str(path))


def _load_ts_from_session(name: str) -> tskit.TreeSequence:  # type: ignore
    if session_storage is None:
        raise RuntimeError(f"Session storage unavailable: {_SESSION_IMPORT_ERROR}")
    session_id = session_storage.get_or_create_session(CLI_SESSION_IP)
    ts = session_storage.get_tree_sequence(session_id, name)
    if ts is None:
        raise FileNotFoundError(f"No loaded tree sequence named '{name}' in session storage")
    return ts


def _store_into_session(name: str, ts: "tskit.TreeSequence", raw_bytes: Optional[bytes] = None) -> None:
    if session_storage is None:
        raise RuntimeError(f"Session storage unavailable: {_SESSION_IMPORT_ERROR}")
    session_id = session_storage.get_or_create_session(CLI_SESSION_IP)
    if raw_bytes is not None:
        session_storage.store_file(session_id, name, raw_bytes)
    session_storage.store_tree_sequence(session_id, name, ts)


def _list_loaded() -> Tuple[str, Tuple[str, ...]]:
    if session_storage is None:
        raise RuntimeError(f"Session storage unavailable: {_SESSION_IMPORT_ERROR}")
    session_id = session_storage.get_or_create_session(CLI_SESSION_IP)
    file_names = tuple(sorted(session_storage.get_file_list(session_id)))
    storage_path = str(session_storage.storage_base_path)  # type: ignore[attr-defined]
    return storage_path, file_names


def _require_sample_spatial(ts: "tskit.TreeSequence", method_label: str) -> None:
    spatial = check_spatial_completeness(ts)
    if not spatial.get("has_sample_spatial", False):
        raise RuntimeError(
            f"{method_label} requires sample nodes to have spatial locations. "
            "Provide a tree sequence with sample spatial metadata."
        )


def _run_inference(ts: "tskit.TreeSequence", method: str, weight_span: bool, weight_branch_length: bool) -> Tuple["tskit.TreeSequence", Dict, str]:  # type: ignore
    method_key = method.lower()
    if method_key in {"midpoint"}:
        if not MIDPOINT_AVAILABLE:
            raise RuntimeError("Midpoint inference not available. Ensure dependencies are installed.")
        _require_sample_spatial(ts, "Midpoint inference")
        ts_out, info = run_midpoint_inference(ts)  # type: ignore[misc]
        return ts_out, info, "midpoint"
    if method_key in {"fastgaia", "fast"}:
        if not FASTGAIA_AVAILABLE:
            raise RuntimeError("fastgaia not available. Install fastgaia.")
        ts_out, info = run_fastgaia_inference(ts, weight_span=weight_span, weight_branch_length=weight_branch_length)  # type: ignore[misc]
        return ts_out, info, "fastgaia"
    if method_key in {"gaia-quadratic", "gaia_quad", "gaia-quad", "gaiaq"}:
        if not GEOANCESTRY_AVAILABLE:
            raise RuntimeError("GAIA (gaiapy) not available. Install geoancestry/gaiapy.")
        _require_sample_spatial(ts, "GAIA quadratic")
        ts_out, info = run_gaia_quadratic_inference(ts)  # type: ignore[misc]
        return ts_out, info, "gaia_quad"
    if method_key in {"gaia-linear", "gaia_lin", "gaial"}:
        if not GEOANCESTRY_AVAILABLE:
            raise RuntimeError("GAIA (gaiapy) not available. Install geoancestry/gaiapy.")
        _require_sample_spatial(ts, "GAIA linear")
        ts_out, info = run_gaia_linear_inference(ts)  # type: ignore[misc]
        return ts_out, info, "gaia_lin"
    if method_key in {"sparg"}:
        if not SPARG_AVAILABLE:
            raise RuntimeError("sparg not available. Install argscape.sparg dependencies.")
        _require_sample_spatial(ts, "SPARG")
        ts_out, info = run_sparg_inference(ts)  # type: ignore[misc]
        return ts_out, info, "sparg"
    if method_key in {"tsdate", "temporal"}:
        if not TSDATE_AVAILABLE:
            raise RuntimeError("tsdate not available or disabled. Install tsdate and ensure DISABLE_TSDATE is not set.")
        ts_out, info = run_tsdate_inference(ts)  # type: ignore[misc]
        return ts_out, info, "tsdate"
    raise ValueError(
        "Unknown method. Choose from: midpoint, fastgaia, gaia-quadratic, gaia-linear, sparg, tsdate"
    )


def _save_ts(ts: "tskit.TreeSequence", output_dir: str, output_filename: str) -> Path:  # type: ignore
    out_dir = _ensure_output_dir(output_dir)
    out_path = out_dir / output_filename
    ts.dump(str(out_path))
    return out_path


def cmd_load(args: argparse.Namespace) -> int:
    _require_tskit()
    file_path = Path(args.file).expanduser().resolve()
    if not file_path.exists():
        print(f"Error: file not found: {file_path}", file=sys.stderr)
        return 2
    try:
        ts = tskit.load(str(file_path))  # type: ignore
        name = args.name or file_path.stem
        with open(file_path, "rb") as f:
            raw = f.read()
        _store_into_session(name, ts, raw_bytes=raw)
        print(f"Loaded '{name}' into session storage.\nPath: {file_path}")
        return 0
    except Exception as e:  # pragma: no cover
        print(f"Failed to load: {e}", file=sys.stderr)
        return 1


def cmd_list(_: argparse.Namespace) -> int:
    try:
        storage_path, names = _list_loaded()
        if not names:
            print("No tree sequences loaded. Use 'spatial_infer load --file <path>' to add one.")
            return 0
        print("Loaded tree sequences:")
        for idx, name in enumerate(names, start=1):
            print(f"  {idx}. {name}")
        print(f"Storage path: {storage_path}")
        return 0
    except Exception as e:  # pragma: no cover
        print(f"Error: {e}", file=sys.stderr)
        return 1


def cmd_run(args: argparse.Namespace) -> int:
    _require_tskit()
    try:
        if args.input and args.name:
            print("Error: specify either --input or --name, not both", file=sys.stderr)
            return 2
        if not args.input and not args.name:
            print("Error: must specify --input or --name", file=sys.stderr)
            return 2

        if args.input:
            ts = _load_ts_from_path(args.input)
            input_label = os.path.basename(args.input)
        else:
            ts = _load_ts_from_session(args.name)
            input_label = args.name

        ts_out, info, suffix = _run_inference(
            ts,
            method=args.method,
            weight_span=args.weight_span,
            weight_branch_length=args.weight_branch_length,
        )

        output_filename = args.output_filename or _derive_output_filename(input_label, suffix)
        out_path = _save_ts(ts_out, args.output, output_filename)

        print("Spatial inference completed successfully.")
        print(f"Method: {args.method}")
        print(f"Output: {out_path}")
        if info:
            try:
                # Pretty print a small subset
                num_inferred = info.get("num_inferred_locations")
                if num_inferred is not None:
                    print(f"Inferred locations: {num_inferred}")
            except Exception:
                pass
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def _interactive_choose(prompt: str, options: Tuple[str, ...]) -> Optional[str]:
    if not options:
        return None
    print(prompt)
    for idx, item in enumerate(options, start=1):
        print(f"  {idx}. {item}")
    while True:
        choice = input("Enter number (or 'q' to cancel): ").strip()
        if choice.lower() in {"q", "quit", "exit"}:
            return None
        if choice.isdigit():
            i = int(choice)
            if 1 <= i <= len(options):
                return options[i - 1]
        print("Invalid choice. Try again.")


def cmd_interactive(_: argparse.Namespace) -> int:
    _require_tskit()
    # Ensure we have session
    if session_storage is None:
        print(f"Session storage unavailable: {_SESSION_IMPORT_ERROR}", file=sys.stderr)
        return 1

    # Ensure something is loaded or prompt to load
    storage_path, names = _list_loaded()
    if not names:
        print("No tree sequences loaded.")
        file_path = input("Enter path to a .trees file to load (or 'q' to quit): ").strip()
        if file_path.lower() in {"q", "quit", "exit", ""}:
            return 0
        ret = cmd_load(argparse.Namespace(file=file_path, name=None))
        if ret != 0:
            return ret
        storage_path, names = _list_loaded()

    # Choose sequence
    selected_name = _interactive_choose("Select a loaded tree sequence:", names)
    if selected_name is None:
        return 0

    # Determine available methods
    method_options = []
    if MIDPOINT_AVAILABLE:
        method_options.append("midpoint")
    if FASTGAIA_AVAILABLE:
        method_options.append("fastgaia")
    if GEOANCESTRY_AVAILABLE:
        method_options.extend(["gaia-quadratic", "gaia-linear"])
    if SPARG_AVAILABLE:
        method_options.append("sparg")
    method_options = tuple(method_options)
    if not method_options:
        print("No spatial inference methods available. Install optional dependencies.", file=sys.stderr)
        return 1

    selected_method = _interactive_choose("Select a spatial inference method:", method_options)
    if selected_method is None:
        return 0

    # Choose output directory
    default_dir = os.getcwd()
    out_dir = input(f"Output directory [{default_dir}]: ").strip() or default_dir
    out_dir = str(_ensure_output_dir(out_dir))

    # Run
    try:
        ts = _load_ts_from_session(selected_name)
        ts_out, _, suffix = _run_inference(ts, selected_method, weight_span=True, weight_branch_length=True)
        output_filename = _derive_output_filename(selected_name, suffix)
        out_path = _save_ts(ts_out, out_dir, output_filename)
        print(f"Success. Saved to: {out_path}")
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def build_parser() -> argparse.ArgumentParser:
    from argscape import __version__
    parser = argparse.ArgumentParser(
        prog="argscape_infer",
        description="Run ARGscape inference (spatial and temporal) from the command line.",
    )
    parser.add_argument(
        "--version", action="version",
        version=f"ARGscape {__version__}",
        help="Show version number and exit"
    )
    subparsers = parser.add_subparsers(dest="command")

    # load
    p_load = subparsers.add_parser("load", help="Load a tree sequence into session storage")
    p_load.add_argument("--file", required=True, help="Path to .trees file")
    p_load.add_argument("--name", required=False, help="Optional name to assign (default: file stem)")
    p_load.set_defaults(func=cmd_load)

    # list
    p_list = subparsers.add_parser("list", help="List loaded tree sequences")
    p_list.set_defaults(func=cmd_list)

    # run
    p_run = subparsers.add_parser("run", help="Run spatial inference")
    src_group = p_run.add_mutually_exclusive_group(required=True)
    src_group.add_argument("--input", help="Path to input .trees file")
    src_group.add_argument("--name", help="Name of a loaded tree sequence")
    p_run.add_argument(
        "--method",
        required=True,
        help="Inference method: midpoint | fastgaia | gaia-quadratic | gaia-linear | sparg | tsdate",
    )
    p_run.add_argument("--output", required=True, help="Output directory to save result")
    p_run.add_argument("--output-filename", required=False, help="Optional exact output filename")
    p_run.add_argument("--weight-span", action="store_true", default=True, help="(fastgaia) Weight by span")
    p_run.add_argument(
        "--no-weight-span", dest="weight_span", action="store_false", help="(fastgaia) Disable weighting by span"
    )
    p_run.add_argument(
        "--weight-branch-length", action="store_true", default=True, help="(fastgaia) Weight by branch length"
    )
    p_run.add_argument(
        "--no-weight-branch-length",
        dest="weight_branch_length",
        action="store_false",
        help="(fastgaia) Disable weighting by branch length",
    )
    p_run.set_defaults(func=cmd_run)

    return parser


def main(argv: Optional[list] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if getattr(args, "command", None) is None:
        return cmd_interactive(args)
    return args.func(args)  # type: ignore[attr-defined]


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())


