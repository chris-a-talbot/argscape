"""
Application-wide constants following clean code principles.
All hard-coded values are defined here with meaningful names.
"""

# API Configuration
DEFAULT_API_VERSION = "0.1.0"
REQUEST_TIMEOUT_SECONDS = 60
FILENAME_TIMESTAMP_PRECISION_MICROSECONDS = 1000000

# Sampling and Simulation Limits
MAX_SAMPLES_FOR_PERFORMANCE = 500
MAX_LOCAL_TREES_FOR_PERFORMANCE = 1000
MAX_TIME_FOR_PERFORMANCE = 1000
MINIMUM_SAMPLES_REQUIRED = 2

# Spatial Generation Constants
GENEALOGICAL_DISTANCE_FALLBACK = 1000.0
MDS_MAX_ITERATIONS = 1000
MDS_N_INIT = 4
SPATIAL_GRID_SIZE = 10
UNIT_GRID_MARGIN = 0.05
UNIT_GRID_NOISE_SCALE = 0.02
COORDINATE_BOUNDARY_EPSILON = 0.01

# Geographic Coordinate Ranges
# WGS84 Geographic coordinates (EPSG:4326)
WGS84_LONGITUDE_MIN = -15.0
WGS84_LONGITUDE_MAX = 180.0
WGS84_LATITUDE_MIN = -60.0
WGS84_LATITUDE_MAX = 75.0
WGS84_LONGITUDE_RANGE = 195.0  # -15 to 180 degrees longitude
WGS84_LATITUDE_RANGE = 135.0   # -60 to 75 degrees latitude
WGS84_GEOGRAPHIC_NOISE_SCALE = 2.0  # degrees

# Web Mercator bounds (EPSG:3857)
WEB_MERCATOR_X_RANGE = 20000000.0  # ~20M meters
WEB_MERCATOR_Y_RANGE = 15000000.0  # ~15M meters
WEB_MERCATOR_NOISE_SCALE = 100000.0  # 100km noise
WEB_MERCATOR_BOUNDS_X = 19000000
WEB_MERCATOR_BOUNDS_Y = 14000000

# Land placement configuration for geographic coordinates
MAX_LAND_PLACEMENT_ATTEMPTS = 40
LOCAL_SEARCH_STRATEGIES = 4
LAND_SEARCH_RADIUS_BASE = 2.0
LAND_SEARCH_RADIUS_INCREMENT = 1.5

# Performance optimization thresholds
LARGE_TREE_SEQUENCE_NODE_THRESHOLD = 10000
SPATIAL_CHECK_NODE_LIMIT = 100

# HTTP Status and Error Handling
DEFAULT_MAX_SAMPLES_FOR_GRAPH = 25
RECOMBINATION_RATE_HIGH = 100.0

# Rate Limiting (requests per minute)
RATE_LIMIT_UPLOAD = "5/minute"
RATE_LIMIT_SESSION_CREATE = "10/minute"
RATE_LIMIT_LOCATION_INFERENCE = "2/minute"
RATE_LIMIT_SIMULATION = "3/minute"
RATE_LIMIT_CSV_UPLOAD = "10/minute"
RATE_LIMIT_LOCATION_UPDATE = "5/minute"
RATE_LIMIT_STORAGE_STATS = "1/minute"
RATE_LIMIT_SHAPEFILE_UPLOAD = "3/minute"
RATE_LIMIT_COORDINATE_TRANSFORM = "5/minute"

# Land regions for geographic placement (center_lon, center_lat, radius_lon, radius_lat, name)
GEOGRAPHIC_LAND_REGIONS = [
    (10, 0, 25, 35, "Africa"),           # Central Africa
    (40, 50, 30, 20, "Europe"),          # Central Europe
    (100, 35, 40, 25, "Asia"),           # Central Asia
    (80, 15, 15, 20, "India"),           # Indian subcontinent
    (135, -25, 25, 20, "Australia"),     # Australia
    (45, 25, 15, 10, "Arabia"),          # Arabian Peninsula
    (130, 35, 20, 15, "East_Asia"),      # Japan/Korea/China
]

# Validation percentages
VALIDATION_PERCENTAGE_MULTIPLIER = 100 