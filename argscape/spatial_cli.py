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
  argscape_infer run --name mydata --method fastgaia --output /tmp/outdir
  argscape_infer run --name mydata --method spacetrees --output /tmp/outdir --st-ne 1000.0
  argscape_infer run --name mydata --method spacetrees --output /tmp/outdir --st-tcutoff 50.0 --st-atimes "10.0,20.0,30.0"
  argscape_infer  # interactive mode
"""

import argparse
import os
import sys
import threading
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

# Inference modules are imported lazily per-method to avoid slow startup
# Only load the specific method needed when actually running inference
_check_spatial_completeness_cache = None
_preload_started = False
_preload_lock = threading.Lock()

# Cache for inference functions (populated by background preload or on-demand)
_inference_cache = {
    "run_midpoint_inference": None,
    "run_fastgaia_inference": None,
    "run_gaia_quadratic_inference": None,
    "run_gaia_linear_inference": None,
    "run_sparg_inference": None,
    "run_spacetrees_inference": None,
    "MIDPOINT_AVAILABLE": None,
    "FASTGAIA_AVAILABLE": None,
    "GEOANCESTRY_AVAILABLE": None,
    "SPARG_AVAILABLE": None,
    "SPACETREES_AVAILABLE": None,
}
_inference_cache_lock = threading.Lock()


def _load_check_spatial_completeness():
    """Lazy load spatial completeness check function (lightweight, used by multiple methods)."""
    global _check_spatial_completeness_cache
    if _check_spatial_completeness_cache is None:
        try:
            from argscape.api.geo_utils.tree_sequence import (
                check_spatial_completeness,
            )
            _check_spatial_completeness_cache = check_spatial_completeness
        except Exception:  # pragma: no cover
            def check_spatial_completeness(ts):  # type: ignore
                return {"has_sample_spatial": False, "has_all_spatial": False, "spatial_status": "none"}
            _check_spatial_completeness_cache = check_spatial_completeness
    return _check_spatial_completeness_cache


def _background_preload_inference_modules():
    """Preload all inference modules in the background to reduce latency when methods are selected."""
    global _preload_started, _inference_cache
    with _preload_lock:
        if _preload_started:
            return
        _preload_started = True
    
    def _preload():
        """Actually perform the preloading and cache the results."""
        try:
            # Try to import all inference modules and cache them
            # Even if some fail, we'll have the available ones loaded
            try:
                from argscape.api.inference import (
                    run_fastgaia_inference,
                    run_gaia_quadratic_inference,
                    run_gaia_linear_inference,
                    run_midpoint_inference,
                    run_sparg_inference,
                    run_spacetrees_inference,
                    FASTGAIA_AVAILABLE,
                    GEOANCESTRY_AVAILABLE,
                    MIDPOINT_AVAILABLE,
                    SPARG_AVAILABLE,
                    SPACETREES_AVAILABLE,
                )
                # Cache the imported functions and flags
                with _inference_cache_lock:
                    _inference_cache["run_fastgaia_inference"] = run_fastgaia_inference
                    _inference_cache["run_gaia_quadratic_inference"] = run_gaia_quadratic_inference
                    _inference_cache["run_gaia_linear_inference"] = run_gaia_linear_inference
                    _inference_cache["run_midpoint_inference"] = run_midpoint_inference
                    _inference_cache["run_sparg_inference"] = run_sparg_inference
                    _inference_cache["run_spacetrees_inference"] = run_spacetrees_inference
                    _inference_cache["FASTGAIA_AVAILABLE"] = FASTGAIA_AVAILABLE
                    _inference_cache["GEOANCESTRY_AVAILABLE"] = GEOANCESTRY_AVAILABLE
                    _inference_cache["MIDPOINT_AVAILABLE"] = MIDPOINT_AVAILABLE
                    _inference_cache["SPARG_AVAILABLE"] = SPARG_AVAILABLE
                    _inference_cache["SPACETREES_AVAILABLE"] = SPACETREES_AVAILABLE
            except Exception:
                pass  # Some modules may not be available, that's fine
            
            # Also preload spatial completeness check
            try:
                _load_check_spatial_completeness()
            except Exception:
                pass
        
        except Exception:
            pass  # Silently fail - if preloading fails, we'll just load on-demand
    
    # Start preloading in a daemon thread (won't block program exit)
    thread = threading.Thread(target=_preload, daemon=True)
    thread.start()


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
    """
    Derive output filename from input name and method suffix.
    Handles .trees and .tsz extensions.
    """
    base = os.path.basename(input_name)
    # Strip common .trees or .trees.trees style extensions robustly
    while base.endswith(".trees"):
        base = base[: -len(".trees")]
    # Also handle .tsz extension
    if base.endswith(".tsz"):
        base = base[: -len(".tsz")]
    return f"{base}_{method_suffix}.trees"


def _generate_unique_filename_for_output(
    base_name: str, 
    suffix: str, 
    output_dir: Path
) -> str:
    """
    Generate a unique filename for output directory by checking for existing files.
    If filename exists, appends _{num} starting at _2.
    
    Args:
        base_name: Base filename without extension
        suffix: Suffix to append (e.g., '_midpoint', '_midpoint_edge')
        output_dir: Output directory to check for existing files
        
    Returns:
        Unique filename that doesn't exist in the output directory
    """
    candidate_filename = f"{base_name}{suffix}.trees"
    candidate_path = output_dir / candidate_filename
    
    if not candidate_path.exists():
        return candidate_filename
    
    # Try _2, _3, etc. until we find a unique name
    counter = 2
    while True:
        candidate_filename = f"{base_name}{suffix}_{counter}.trees"
        candidate_path = output_dir / candidate_filename
        if not candidate_path.exists():
            return candidate_filename
        counter += 1


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
    """Check that tree sequence has sample spatial locations."""
    check_spatial = _load_check_spatial_completeness()
    spatial = check_spatial(ts)
    if not spatial.get("has_sample_spatial", False):
        raise RuntimeError(
            f"{method_label} requires sample nodes to have spatial locations. "
            "Provide a tree sequence with sample spatial metadata."
        )


def _run_inference(
    ts: "tskit.TreeSequence", 
    method: str, 
    weight_span: bool = True, 
    weight_branch_length: bool = True,
    midpoint_weight_by_span: Optional[bool] = None,
    midpoint_weight_branch_length: Optional[bool] = None,
    spacetrees_params: Optional[Dict] = None
) -> Tuple["tskit.TreeSequence", Dict, str]:  # type: ignore
    """Run inference with a specific method, using cached imports when available."""
    global _inference_cache
    method_key = method.lower()
    if spacetrees_params is None:
        spacetrees_params = {}
    
    if method_key in {"midpoint"}:
        # Check cache first, then import if needed
        with _inference_cache_lock:
            run_fn = _inference_cache["run_midpoint_inference"]
            available = _inference_cache["MIDPOINT_AVAILABLE"]
        
        if run_fn is None or available is None:
            try:
                from argscape.api.inference import run_midpoint_inference, MIDPOINT_AVAILABLE
                with _inference_cache_lock:
                    _inference_cache["run_midpoint_inference"] = run_midpoint_inference
                    _inference_cache["MIDPOINT_AVAILABLE"] = MIDPOINT_AVAILABLE
                run_fn = run_midpoint_inference
                available = MIDPOINT_AVAILABLE
            except ImportError:
                raise RuntimeError("Midpoint inference not available. Ensure dependencies are installed.")
        
        if not available:
            raise RuntimeError("Midpoint inference not available. Ensure dependencies are installed.")
        _require_sample_spatial(ts, "Midpoint inference")
        
        # Use midpoint-specific parameters if provided, otherwise use defaults (edge spans by default)
        weight_by_span = midpoint_weight_by_span if midpoint_weight_by_span is not None else True
        weight_branch_length_param = midpoint_weight_branch_length if midpoint_weight_branch_length is not None else False
        
        ts_out, info = run_fn(ts, weight_by_span=weight_by_span, weight_branch_length=weight_branch_length_param)  # type: ignore[misc]
        
        # Determine suffix based on weighting options
        if not weight_by_span and not weight_branch_length_param:
            suffix = "midpoint"
        elif weight_by_span and weight_branch_length_param:
            suffix = "midpoint_weighted"
        elif weight_by_span:
            suffix = "midpoint_edge"
        else:  # only weight_branch_length
            suffix = "midpoint_branch"
        
        return ts_out, info, suffix
    
    if method_key in {"fastgaia", "fast"}:
        with _inference_cache_lock:
            run_fn = _inference_cache["run_fastgaia_inference"]
            available = _inference_cache["FASTGAIA_AVAILABLE"]
        
        if run_fn is None or available is None:
            try:
                from argscape.api.inference import run_fastgaia_inference, FASTGAIA_AVAILABLE
                with _inference_cache_lock:
                    _inference_cache["run_fastgaia_inference"] = run_fastgaia_inference
                    _inference_cache["FASTGAIA_AVAILABLE"] = FASTGAIA_AVAILABLE
                run_fn = run_fastgaia_inference
                available = FASTGAIA_AVAILABLE
            except ImportError:
                raise RuntimeError("fastgaia not available. Install fastgaia.")
        
        if not available:
            raise RuntimeError("fastgaia not available. Install fastgaia.")
        ts_out, info = run_fn(ts, weight_span=weight_span, weight_branch_length=weight_branch_length)  # type: ignore[misc]
        return ts_out, info, "fastgaia"
    
    if method_key in {"gaia-quadratic", "gaia_quad", "gaia-quad", "gaiaq"}:
        with _inference_cache_lock:
            run_fn = _inference_cache["run_gaia_quadratic_inference"]
            available = _inference_cache["GEOANCESTRY_AVAILABLE"]
        
        if run_fn is None or available is None:
            try:
                from argscape.api.inference import run_gaia_quadratic_inference, GEOANCESTRY_AVAILABLE
                with _inference_cache_lock:
                    _inference_cache["run_gaia_quadratic_inference"] = run_gaia_quadratic_inference
                    _inference_cache["GEOANCESTRY_AVAILABLE"] = GEOANCESTRY_AVAILABLE
                run_fn = run_gaia_quadratic_inference
                available = GEOANCESTRY_AVAILABLE
            except ImportError:
                raise RuntimeError("GAIA (gaiapy) not available. Install geoancestry/gaiapy.")
        
        if not available:
            raise RuntimeError("GAIA (gaiapy) not available. Install geoancestry/gaiapy.")
        _require_sample_spatial(ts, "GAIA quadratic")
        ts_out, info = run_fn(ts)  # type: ignore[misc]
        return ts_out, info, "gaia_quad"
    
    if method_key in {"gaia-linear", "gaia_lin", "gaial"}:
        with _inference_cache_lock:
            run_fn = _inference_cache["run_gaia_linear_inference"]
            available = _inference_cache["GEOANCESTRY_AVAILABLE"]
        
        if run_fn is None or available is None:
            try:
                from argscape.api.inference import run_gaia_linear_inference, GEOANCESTRY_AVAILABLE
                with _inference_cache_lock:
                    _inference_cache["run_gaia_linear_inference"] = run_gaia_linear_inference
                    _inference_cache["GEOANCESTRY_AVAILABLE"] = GEOANCESTRY_AVAILABLE
                run_fn = run_gaia_linear_inference
                available = GEOANCESTRY_AVAILABLE
            except ImportError:
                raise RuntimeError("GAIA (gaiapy) not available. Install geoancestry/gaiapy.")
        
        if not available:
            raise RuntimeError("GAIA (gaiapy) not available. Install geoancestry/gaiapy.")
        _require_sample_spatial(ts, "GAIA linear")
        ts_out, info = run_fn(ts)  # type: ignore[misc]
        return ts_out, info, "gaia_lin"
    
    if method_key in {"sparg"}:
        with _inference_cache_lock:
            run_fn = _inference_cache["run_sparg_inference"]
            available = _inference_cache["SPARG_AVAILABLE"]
        
        if run_fn is None or available is None:
            try:
                from argscape.api.inference import run_sparg_inference, SPARG_AVAILABLE
                with _inference_cache_lock:
                    _inference_cache["run_sparg_inference"] = run_sparg_inference
                    _inference_cache["SPARG_AVAILABLE"] = SPARG_AVAILABLE
                run_fn = run_sparg_inference
                available = SPARG_AVAILABLE
            except ImportError:
                raise RuntimeError("sparg not available. Install argscape.sparg dependencies.")
        
        if not available:
            raise RuntimeError("sparg not available. Install argscape.sparg dependencies.")
        _require_sample_spatial(ts, "SPARG")
        ts_out, info = run_fn(ts)  # type: ignore[misc]
        return ts_out, info, "sparg"
    
    if method_key in {"spacetrees", "spacetree"}:
        with _inference_cache_lock:
            run_fn = _inference_cache["run_spacetrees_inference"]
            available = _inference_cache["SPACETREES_AVAILABLE"]
        
        if run_fn is None or available is None:
            try:
                from argscape.api.inference import run_spacetrees_inference, SPACETREES_AVAILABLE
                with _inference_cache_lock:
                    _inference_cache["run_spacetrees_inference"] = run_spacetrees_inference
                    _inference_cache["SPACETREES_AVAILABLE"] = SPACETREES_AVAILABLE
                run_fn = run_spacetrees_inference
                available = SPACETREES_AVAILABLE
            except ImportError:
                raise RuntimeError("spacetrees not available. Install spacetrees dependencies.")
        
        if not available:
            raise RuntimeError("spacetrees not available. Install spacetrees dependencies.")
        _require_sample_spatial(ts, "spacetrees")
        ts_out, info = run_fn(ts, **spacetrees_params)  # type: ignore[misc]
        return ts_out, info, "spacetrees"
    
    raise ValueError(
        "Unknown method. Choose from: midpoint, fastgaia, gaia-quadratic, gaia-linear, sparg, spacetrees"
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
    # Start background preloading immediately - might finish before we need it
    _background_preload_inference_modules()
    
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

        # Build spacetrees parameters if method is spacetrees
        spacetrees_params = {}
        if args.method.lower() in {"spacetrees", "spacetree"}:
            # Parse comma-separated ancestor times
            ancestor_times = None
            if hasattr(args, "spacetrees_ancestor_times") and args.spacetrees_ancestor_times:
                try:
                    ancestor_times = [float(x.strip()) for x in args.spacetrees_ancestor_times.split(",")]
                except ValueError:
                    print("Warning: Invalid ancestor_times format, using default", file=sys.stderr)
            
            # Parse comma-separated Ne epochs
            ne_epochs = None
            if hasattr(args, "spacetrees_ne_epochs") and args.spacetrees_ne_epochs:
                try:
                    ne_epochs = [float(x.strip()) for x in args.spacetrees_ne_epochs.split(",")]
                except ValueError:
                    print("Warning: Invalid ne_epochs format, using default", file=sys.stderr)
            
            # Parse comma-separated Nes
            nes = None
            if hasattr(args, "spacetrees_nes") and args.spacetrees_nes:
                try:
                    nes = [float(x.strip()) for x in args.spacetrees_nes.split(",")]
                except ValueError:
                    print("Warning: Invalid nes format, using default", file=sys.stderr)
            
            # Handle boolean flags - use True as default if not explicitly set
            # argparse sets these only if flags are provided, so we need to check with getattr
            use_importance_sampling = getattr(args, "spacetrees_use_importance_sampling", True)
            require_common_ancestor = getattr(args, "spacetrees_require_common_ancestor", True)
            
            spacetrees_params = {
                "time_cutoff": getattr(args, "spacetrees_time_cutoff", None),
                "ancestor_times": ancestor_times,
                "use_importance_sampling": use_importance_sampling,
                "require_common_ancestor": require_common_ancestor,
                "quiet": getattr(args, "spacetrees_quiet", False),
                "Ne": getattr(args, "spacetrees_ne", None),
                "Ne_epochs": ne_epochs,
                "Nes": nes,
                "num_loci": getattr(args, "spacetrees_num_loci", None),
                "locus_size": getattr(args, "spacetrees_locus_size", None),
                "use_blup": getattr(args, "spacetrees_use_blup", False),
                "blup_var": getattr(args, "spacetrees_blup_var", False),
            }
            # Remove None values to use defaults
            spacetrees_params = {k: v for k, v in spacetrees_params.items() if v is not None}
        
        ts_out, info, suffix = _run_inference(
            ts,
            method=args.method,
            weight_span=args.weight_span,
            weight_branch_length=args.weight_branch_length,
            midpoint_weight_by_span=getattr(args, "midpoint_weight_by_span", None),
            midpoint_weight_branch_length=getattr(args, "midpoint_weight_branch_length", None),
            spacetrees_params=spacetrees_params,
        )

        # Generate output filename with unique naming
        if args.output_filename:
            output_filename = args.output_filename
        else:
            # Extract base name from input label
            base = os.path.basename(input_label)
            # Strip extensions
            while base.endswith(".trees"):
                base = base[: -len(".trees")]
            if base.endswith(".tsz"):
                base = base[: -len(".tsz")]
            
            output_dir = _ensure_output_dir(args.output)
            output_filename = _generate_unique_filename_for_output(base, f"_{suffix}", output_dir)

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
    # Start background preloading immediately - by the time user selects a method, modules will be ready
    _background_preload_inference_modules()
    
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

    # Show all available methods (hardcoded list - availability checked when actually used)
    method_options = [
        "midpoint",
        "fastgaia",
        "gaia-quadratic",
        "gaia-linear",
        "sparg",
        "spacetrees",
    ]
    method_options = tuple(method_options)

    selected_method = _interactive_choose("Select a spatial inference method:", method_options)
    if selected_method is None:
        return 0

    # Collect midpoint parameters if method is midpoint
    midpoint_weight_by_span = None
    midpoint_weight_branch_length = None
    if selected_method.lower() in {"midpoint"}:
        print("\n=== Midpoint Inference Weighting Options ===")
        print("(Press Enter to use defaults: edge spans enabled, branch lengths disabled)")
        
        # Weight by span
        weight_span_str = input("Weight by edge spans (genomic length)? [Y/n]: ").strip().lower()
        midpoint_weight_by_span = weight_span_str not in {"n", "no"}
        
        # Weight by branch length
        weight_bl_str = input("Weight by branch lengths (temporal)? [y/N]: ").strip().lower()
        midpoint_weight_branch_length = weight_bl_str in {"y", "yes"}
        
        print()  # Empty line for readability

    # Collect spacetrees parameters if method is spacetrees
    spacetrees_params = {}
    if selected_method.lower() in {"spacetrees", "spacetree"}:
        print("\n=== Spacetrees Parameters ===")
        print("(Press Enter to use defaults)")
        
        # Time cutoff
        time_cutoff_str = input("Time cutoff (optional, float): ").strip()
        if time_cutoff_str:
            try:
                spacetrees_params["time_cutoff"] = float(time_cutoff_str)
            except ValueError:
                print("Warning: Invalid time_cutoff, using default")
        
        # Ancestor times
        ancestor_times_str = input("Ancestor times (optional, comma-separated floats, e.g., 10.0,20.0,30.0): ").strip()
        if ancestor_times_str:
            try:
                spacetrees_params["ancestor_times"] = [float(x.strip()) for x in ancestor_times_str.split(",")]
            except ValueError:
                print("Warning: Invalid ancestor_times, using default")
        
        # Use importance sampling
        use_is_str = input("Use importance sampling? [Y/n]: ").strip().lower()
        spacetrees_params["use_importance_sampling"] = use_is_str not in {"n", "no"}
        
        # Require common ancestor
        require_ca_str = input("Require common ancestor? [Y/n]: ").strip().lower()
        spacetrees_params["require_common_ancestor"] = require_ca_str not in {"n", "no"}
        
        # Quiet
        quiet_str = input("Quiet mode (suppress progress)? [y/N]: ").strip().lower()
        spacetrees_params["quiet"] = quiet_str in {"y", "yes"}
        
        # Ne (constant)
        ne_str = input("Effective population size Ne (optional, float): ").strip()
        if ne_str:
            try:
                spacetrees_params["Ne"] = float(ne_str)
            except ValueError:
                print("Warning: Invalid Ne, using default")
        
        # Ne epochs (time-varying)
        ne_epochs_str = input("Ne epoch boundaries (optional, comma-separated floats): ").strip()
        if ne_epochs_str:
            try:
                spacetrees_params["Ne_epochs"] = [float(x.strip()) for x in ne_epochs_str.split(",")]
                nes_str = input("Ne values for each epoch (comma-separated floats, same number as epochs): ").strip()
                if nes_str:
                    spacetrees_params["Nes"] = [float(x.strip()) for x in nes_str.split(",")]
                else:
                    print("Warning: Ne epochs specified but no Nes provided, ignoring epochs")
                    spacetrees_params.pop("Ne_epochs", None)
            except ValueError:
                print("Warning: Invalid Ne epochs, using default")
        
        # Locus grouping
        num_loci_str = input("Number of loci (optional, int): ").strip()
        if num_loci_str:
            try:
                spacetrees_params["num_loci"] = int(num_loci_str)
            except ValueError:
                print("Warning: Invalid num_loci, using default")
        else:
            locus_size_str = input("Locus size in bp (optional, float): ").strip()
            if locus_size_str:
                try:
                    spacetrees_params["locus_size"] = float(locus_size_str)
                except ValueError:
                    print("Warning: Invalid locus_size, using default")
        
        # BLUP
        use_blup_str = input("Use BLUP instead of MLE? [y/N]: ").strip().lower()
        spacetrees_params["use_blup"] = use_blup_str in {"y", "yes"}
        
        if spacetrees_params.get("use_blup"):
            blup_var_str = input("Return BLUP variance estimates? [y/N]: ").strip().lower()
            spacetrees_params["blup_var"] = blup_var_str in {"y", "yes"}
        
        print()  # Empty line for readability

    # Choose output directory
    default_dir = os.getcwd()
    out_dir = input(f"Output directory [{default_dir}]: ").strip() or default_dir
    out_dir = str(_ensure_output_dir(out_dir))

    # Run
    try:
        ts = _load_ts_from_session(selected_name)
        ts_out, _, suffix = _run_inference(
            ts, 
            selected_method, 
            weight_span=True, 
            weight_branch_length=True,
            midpoint_weight_by_span=midpoint_weight_by_span,
            midpoint_weight_branch_length=midpoint_weight_branch_length,
            spacetrees_params=spacetrees_params
        )
        
        # Generate unique output filename
        base = os.path.basename(selected_name)
        # Strip extensions
        while base.endswith(".trees"):
            base = base[: -len(".trees")]
        if base.endswith(".tsz"):
            base = base[: -len(".tsz")]
        
        output_filename = _generate_unique_filename_for_output(base, f"_{suffix}", Path(out_dir))
        
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
        help="Inference method: midpoint | fastgaia | gaia-quadratic | gaia-linear | sparg | spacetrees",
    )
    p_run.add_argument("--output", required=True, help="Output directory to save result")
    p_run.add_argument("--output-filename", required=False, help="Optional exact output filename")
    
    # FastGAIA weighting options
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
    
    # Midpoint weighting options
    p_run.add_argument(
        "--mp-weight-span", 
        dest="midpoint_weight_by_span",
        action="store_true",
        default=None,
        help="(midpoint) Weight by edge spans (genomic length). Default: True"
    )
    p_run.add_argument(
        "--mp-no-weight-span",
        dest="midpoint_weight_by_span",
        action="store_false",
        help="(midpoint) Disable weighting by edge spans"
    )
    p_run.add_argument(
        "--mp-weight-branch-length",
        dest="midpoint_weight_branch_length",
        action="store_true",
        default=None,
        help="(midpoint) Weight by branch lengths (temporal). Default: False"
    )
    p_run.add_argument(
        "--mp-no-weight-branch-length",
        dest="midpoint_weight_branch_length",
        action="store_false",
        help="(midpoint) Disable weighting by branch lengths"
    )
    # Spacetrees-specific arguments (--st- prefix for shorter typing)
    p_run.add_argument(
        "--st-tcutoff",
        dest="spacetrees_time_cutoff",
        type=float,
        help="(spacetrees) Time cutoff for inference (float)",
    )
    p_run.add_argument(
        "--st-atimes",
        dest="spacetrees_ancestor_times",
        type=str,
        help="(spacetrees) Comma-separated list of ancestor times to locate (e.g., '10.0,20.0,30.0')",
    )
    p_run.add_argument(
        "--st-is",
        dest="spacetrees_use_importance_sampling",
        action="store_true",
        help="(spacetrees) Use importance sampling with branching times (default: True)",
    )
    p_run.add_argument(
        "--st-no-is",
        dest="spacetrees_use_importance_sampling",
        action="store_false",
        help="(spacetrees) Disable importance sampling",
    )
    p_run.add_argument(
        "--st-rca",
        dest="spacetrees_require_common_ancestor",
        action="store_true",
        help="(spacetrees) Skip trees where not all samples share a common ancestor (default: True)",
    )
    p_run.add_argument(
        "--st-no-rca",
        dest="spacetrees_require_common_ancestor",
        action="store_false",
        help="(spacetrees) Use all trees even if not all samples share a common ancestor",
    )
    p_run.add_argument(
        "--st-quiet",
        dest="spacetrees_quiet",
        action="store_true",
        help="(spacetrees) Suppress progress output",
    )
    p_run.add_argument(
        "--st-ne",
        dest="spacetrees_ne",
        type=float,
        help="(spacetrees) Constant effective population size Ne (float)",
    )
    p_run.add_argument(
        "--st-epochs",
        dest="spacetrees_ne_epochs",
        type=str,
        help="(spacetrees) Comma-separated list of epoch boundaries for time-varying Ne (e.g., '10.0,20.0,30.0')",
    )
    p_run.add_argument(
        "--st-nes",
        dest="spacetrees_nes",
        type=str,
        help="(spacetrees) Comma-separated list of Ne values for each epoch (e.g., '1000.0,2000.0,3000.0')",
    )
    p_run.add_argument(
        "--st-loci",
        dest="spacetrees_num_loci",
        type=int,
        help="(spacetrees) Number of loci to group trees into (int)",
    )
    p_run.add_argument(
        "--st-lsize",
        dest="spacetrees_locus_size",
        type=float,
        help="(spacetrees) Size of each locus in base pairs (float)",
    )
    p_run.add_argument(
        "--st-blup",
        dest="spacetrees_use_blup",
        action="store_true",
        help="(spacetrees) Use Best Linear Unbiased Predictor instead of MLE",
    )
    p_run.add_argument(
        "--st-blup-var",
        dest="spacetrees_blup_var",
        action="store_true",
        help="(spacetrees) Return variance estimates (only if --st-blup is set)",
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


