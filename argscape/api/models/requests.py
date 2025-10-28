"""
Pydantic request models for API endpoints.
"""

from typing import Optional, Dict
from pydantic import BaseModel


class FastLocationInferenceRequest(BaseModel):
    filename: str
    weight_span: bool = True
    weight_branch_length: bool = True


class FastGAIAInferenceRequest(BaseModel):
    filename: str


class GAIAQuadraticInferenceRequest(BaseModel):
    filename: str


class GAIALinearInferenceRequest(BaseModel):
    filename: str


class SimulationRequest(BaseModel):
    num_samples: int = 50
    sequence_length: int = 1_000_000  # in base pairs
    max_time: int = 20
    population_size: Optional[int] = None
    random_seed: Optional[int] = None
    model: str = "dtwf"
    filename_prefix: str = "simulated"
    crs: Optional[str] = "unit_grid"  # Coordinate reference system for simulation
    mutation_rate: Optional[float] = 1e-8  # Mutation rate for simulation
    recombination_rate: Optional[float] = 1e-8  # Recombination rate for simulation


class CoordinateTransformRequest(BaseModel):
    filename: str
    source_crs: str
    target_crs: str


class SpatialValidationRequest(BaseModel):
    filename: str
    shape_name: Optional[str] = None  # Built-in shape name
    shape_data: Optional[Dict] = None  # Custom shape data


class CustomLocationRequest(BaseModel):
    tree_sequence_filename: str
    sample_locations_filename: str
    node_locations_filename: str


class MidpointInferenceRequest(BaseModel):
    filename: str


class SpargInferenceRequest(BaseModel):
    filename: str


class TsdateInferenceRequest(BaseModel):
    filename: str
    mutation_rate: float = 1e-8
    preprocess: bool = True
    remove_telomeres: bool = False
    minimum_gap: Optional[float] = None
    split_disjoint: bool = True
    filter_populations: bool = False
    filter_individuals: bool = False
    filter_sites: bool = False


class SimplifyTreeSequenceRequest(BaseModel):
    filename: str
    samples: Optional[list] = None  # List of sample node IDs
    map_nodes: bool = False
    reduce_to_site_topology: bool = False
    filter_populations: Optional[bool] = None
    filter_individuals: Optional[bool] = None
    filter_sites: Optional[bool] = None
    filter_nodes: Optional[bool] = None
    update_sample_flags: Optional[bool] = None
    keep_unary: bool = False
    keep_unary_in_individuals: Optional[bool] = None
    keep_input_roots: bool = False
    record_provenance: bool = True
