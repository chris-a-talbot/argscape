# ARGscape

**ARGscape** (v0.1.9) is a comprehensive web application for visualizing and analyzing tree sequences and Ancestral Recombination Graphs (ARGs). Built with React and FastAPI, it aims to provide both an intuitive web interface and powerful computational backend for population genetics research.

🌐 **Live Demo**: [www.argscape.com](https://www.argscape.com)  
📖 **API Documentation**: [www.argscape.com/docs](https://www.argscape.com/docs)

## Features

### Core Functionality
- **File Upload & Management**: Upload and visualize `.trees` and `.tsz` tree sequence files
- **Tree Sequence Simulation**: Generate new tree sequences using `msprime` with customizable parameters
- **Interactive Visualization**: 
  - 2D ARG network visualization with force-directed layouts
  - 3D spatial visualization for spatially-embedded tree sequences
  - Multiple sample ordering algorithms
- **Spatial Analysis**: Fast spatial location inference using `fastgaia`, `gaia`, `sparg`, or Wohns `midpoint`
- **Session Management**: Secure temporary file storage with automatic cleanup
- **Data Export**: Download processed tree sequences and visualizations

### Visualization Capabilities
- **Network Graphs**: Interactive node-link diagrams showing genealogical relationships
- **3D Spatial Maps**: Three-dimensional visualization of spatially-embedded samples
- **Customizable Rendering** (Coming Soon): Adjustable node sizes, edge styles, colors, and layouts
- **Tree Filtering**: Visualize specific genomic regions or tree index ranges
- **Sample Ordering**: Multiple algorithms for optimal sample arrangement

### Advanced Features
- **Location Inference**: Generate spatial coordinates based on genealogical relationships
- **Tree Sequence Filtering**: Extract specific genomic intervals or tree ranges
- **Batch Processing**: Handle multiple files per session
- **Real-time Updates**: Live feedback during processing and visualization

## Quick Start

### Option 1: Use the Live Website
Visit [argscape.com](https://argscape.com) to start visualizing tree sequences immediately - no installation required. Storage space and computational power is extremely limited. Please refer to Option 2 below for more intensive uses. 

### Option 2: Local Installation (Recommended)

Install ARGscape locally for better performance and offline use:

#### Prerequisites
- **Anaconda, Miniconda, or another Conda distribution** ([Download here](https://docs.anaconda.com/anaconda/install/))

#### Installation Steps

1. **Download the environment file**:
   - Visit [argscape.com/install](https://argscape.com/install) and click "Download environment.yml"
   - Or download directly from [GitHub](https://github.com/chris-a-talbot/argscape/blob/dev/argscape/backend/environment.yml)

2. **Navigate to the download folder**:
   ```bash
   cd /path/to/your/folder
   ```

3. **Create the ARGscape environment**:
   ```bash
   conda env create -f environment.yml
   ```
   *Installation takes 5-15 minutes depending on your connection.*

4. **Activate the environment**:
   ```bash
   conda activate argscape_env
   

5. **Launch ARGscape**:
   ```bash
   argscape
   ```

6. **Open in browser**:
   ARGscape opens automatically at http://127.0.0.1:8000. Wait 2-3 minutes for startup, then refresh if needed.

#### Command Line Options
```bash
argscape [--host HOST] [--port PORT] [--reload] [--no-browser] [--no-tsdate]

# Options:
#   --host HOST       Host to run the server on (default: 127.0.0.1)
#   --port PORT       Port to run the server on (default: 8000)
#   --reload          Enable auto-reload for development
#   --no-browser      Don't automatically open the web browser
#   --no-tsdate       Disable tsdate temporal inference (enabled by default)
```

#### Troubleshooting
- **Conda not found?** Check PATH or use Anaconda Prompt (Windows)
- **Package conflicts?** Add `--force-reinstall` flag to conda command
- **Web interface not loading?** Wait 2-3 minutes, then refresh browser

### Option 3: Local Development

#### Prerequisites
- **Node.js 20+** and **npm**
- **Python 3.11+** with **conda/mamba**
- **Git**

#### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/chris-a-talbot/argscape.git
   cd argscape
   ```

2. **Backend setup**:
   ```bash
   # Create and activate conda environment
   conda env create -f argscape/backend/environment.yml
   conda activate argscape
   
   # Install the package in development mode
   pip install -e .
   
   # Start the backend server
   uvicorn argscape.backend.main:app --reload --port 8000
   ```

3. **Frontend setup** (in new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API docs: http://localhost:8000/docs

### Option 4: Docker Development

```bash
# Clone and start the development environment
git clone https://github.com/chris-a-talbot/argscape.git
cd argscape
docker compose up --build
```

The Docker setup provides a complete development environment with hot-reloading for both frontend and backend. Access at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

Note: The Docker setup mounts your local code directories, so changes to the code will be reflected immediately in the running containers.

## Usage Guide

ARGscape provides an intuitive workflow for working with tree sequences and visualizing ancestral recombination graphs.

### Getting Started

1. **New to ARGs?** Visit the [Tutorials page](https://argscape.com/tutorials) for interactive lessons on ARG concepts
2. **Choose your starting point** from the main page:
   - Upload existing tree sequence files (.trees or .tsz)
   - Simulate new tree sequences with customizable parameters
   - Load previously uploaded sequences from your session

### Upload Tree Sequences

**Supported formats**: `.trees` (tskit format) and `.tsz` (compressed)

1. Click "Upload a tree sequence" on the main page
2. Drag and drop your file or click to browse
3. The file will be uploaded and processed automatically
4. Navigate to visualization options once upload is complete

**Performance tips**:
- Files < 100MB recommended for optimal performance
- Best visualization with < 500 samples and < 1000 local trees

### Simulate Tree Sequences

Generate new tree sequences using `msprime` with customizable parameters:

1. Click "Simulate a tree sequence" on the main page
2. Configure simulation parameters:
   - **Population size**: Effective population size
   - **Sequence length**: Length of simulated genome
   - **Recombination rate**: Rate of recombination events
   - **Mutation rate**: Rate of mutations
   - **Sample size**: Number of individuals to sample
   - **Random seed**: For reproducible simulations
3. Click "Simulate" to generate your tree sequence
4. Proceed to visualization once simulation completes

### Visualization Options

ARGscape offers multiple visualization modes:

#### 1. Network Visualization
- Interactive 2D node-link diagrams
- Force-directed layout algorithms for optimal positioning
- Customizable node and edge styling
- Tree filtering by genomic regions or tree indices
- Sample ordering algorithms for optimal display

#### 2. 3D Spatial Visualization
- Three-dimensional rendering of spatially-embedded tree sequences
- Geographic context with world map overlay
- Interactive camera controls and preset viewing angles

#### 3. Differential Visualization
- Compare multiple tree sequences with spatial data

### Spatial Analysis Features

**Location Inference**: Generate spatial coordinates from genealogical relationships using:
- **FastGAIA**: Fast spatial inference algorithm
- **GAIA**: Geographic ancestry inference
- **SPARG**: Spatial ARG reconstruction
- **Midpoint method**: Wohns midpoint algorithm

**Geographic Utilities**:
- Automatic coordinate system detection
- Land boundary detection and validation
- Geographic coordinate transformations
- Fallback positioning for offshore coordinates

### Session Management

- **Temporary storage**: Files stored securely for up to 24 hours
- **Session persistence**: Continue work across browser sessions
- **Data export**: Download processed tree sequences and visualizations
- **Cleanup**: Remove files manually or wait for automatic cleanup

### Advanced Features

- **Custom color themes**: Personalize visualization appearance

## API Reference

Full API documentation available at `/docs` when running locally.

## Development

### Project Structure
```
argscape/
├── argscape/                     # Main Python package
│   ├── __init__.py
│   ├── cli.py                    # Command-line interface
│   ├── frontend_dist/            # Compiled frontend assets
│   │   ├── assets/               # Static assets (CSS, JS bundles)
│   │   ├── index.html            # Main HTML template
│   └── backend/                  # Backend application
│       ├── __init__.py
│       ├── main.py               # Main application entry point
│       ├── startup.py            # Application startup logic
│       ├── constants.py          # Application constants
│       ├── session_storage.py    # Session management
│       ├── location_inference.py # Location inference logic
│       ├── midpoint_inference.py # Midpoint inference logic
│       ├── sparg_inference.py    # SPARG inference logic
│       ├── temporal_inference.py # Temporal inference logic
│       ├── spatial_generation.py # Spatial data generation
│       ├── graph_utils.py        # Graph utility functions
│       ├── dev_storage_override.py # Development storage override
│       ├── requirements-web.txt  # Web dependencies
│       ├── environment.yml       # Conda environment
│       ├── env.example           # Environment variables template
│       ├── Dockerfile            # Backend container definition
│       ├── dev_storage/          # Development storage directory
│       ├── geo_utils/            # Geographic utilities
│       │   ├── __init__.py
│       │   ├── crs_detect.py     # Coordinate reference system detection
│       │   ├── crs.py            # CRS utilities
│       │   ├── fallbacks.py      # Fallback geographic functions
│       │   ├── io.py             # Geographic I/O operations
│       │   ├── land_detect.py    # Land detection utilities
│       │   ├── placement.py      # Geographic placement algorithms
│       │   ├── shapes.py         # Geographic shape utilities
│       │   ├── transform.py      # Coordinate transformations
│       │   ├── tree_sequence.py  # Tree sequence geographic utilities
│       │   └── data/             # Geographic data files
│       │       ├── eastern_hemisphere.geojson
│       │       └── ne_110m_land/ # Natural Earth land data
│       ├── sparg/                # SPARG algorithm implementation
│       └── tskit_utils/          # Tree sequence utilities
├── frontend/                    # Frontend application (TypeScript/React)
│   ├── src/                     # Source code
│   │   ├── App.tsx              # Main application component
│   │   ├── main.tsx             # Application entry point
│   │   ├── components/          # React components
│   │   │   ├── Home/            # Home page components
│   │   │   ├── ForceDirectedGraph/ # Network visualization
│   │   │   ├── SpatialArg3DVisualization/ # 3D spatial visualization
│   │   │   ├── SpatialArgDiffVisualization/ # Diff visualization
│   │   │   ├── tutorials/       # Tutorial components
│   │   │   └── ui/              # UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── context/             # React context providers
│   │   ├── lib/                 # Utility libraries
│   │   ├── utils/               # Utility functions
│   │   ├── config/              # Configuration files
│   │   └── types/               # TypeScript type definitions
│   ├── public/                  # Static assets
│   ├── package.json             # Frontend dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── tsconfig.app.json        # Application TypeScript config
│   ├── tsconfig.node.json       # Node.js TypeScript config
│   ├── tsconfig.tsbuildinfo     # TypeScript build info
│   ├── vite.config.ts           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── postcss.config.js        # PostCSS configuration
│   ├── eslint.config.js         # ESLint configuration
│   ├── nginx.conf               # Nginx configuration
│   ├── components.json          # shadcn/ui components config
│   └── Dockerfile               # Frontend container definition
├── demo/                        # Demo files and examples
├── dev_storage/                 # Development file storage
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Root Dockerfile
├── LICENSE                     # License file
├── MANIFEST.in                 # Python package manifest
├── pyproject.toml              # Python project configuration
├── railway.toml                # Railway deployment config
├── README.md                   # Project documentation
├── setup.cfg                   # Python setup configuration
├── package.json                # Root package.json
```

## File Formats

### Supported Inputs
- **`.trees`**: Standard tskit tree sequence format
- **`.tsz`**: Compressed tree sequence format

### Generated Outputs
- Tree sequences with inferred spatial locations
- Visualization data (JSON)
- Processed tree sequence files

## Performance Notes

- **File Size**: Recommended < 100MB per upload
- **Samples**: Optimal performance with < 500 samples
- **Trees**: Best visualization with < 1000 local trees
- **Sessions**: Automatic cleanup after 24 hours
- **Memory**: Large files may require processing time

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Follow clean code principles
4. Add tests for new functionality
5. Submit pull request

## License

This project is licensed under the MIT License.

## Citation

## Acknowledgments

- **tskit development team** for tree sequence simulation and analysis tools
- **Bradburd Lab** for funding and support
- **James Kitchens** for testing and feedback

## Support

- 🌐 **Website**: [www.argscape.com](https://www.argscape.com)
- 📖 **API Docs**: Available at `/docs` endpoint
- 🐛 **Issues**: GitHub Issues for bug reports
- 💬 **Discussions**: GitHub Discussions for questions

---

**Note**: This is research software under active development. The API may change between versions. Data is stored temporarily and may be cleared during updates.
