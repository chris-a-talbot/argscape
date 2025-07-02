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
  - Multiple sample ordering algorithms (degree-based, minlex postorder, custom consensus)
- **Spatial Analysis**: Fast spatial location inference using `fastgaia` (higher accuracy with `GAIA` coming soon)
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
Visit [argscape.com](https://argscape.com) to start visualizing tree sequences immediately - no installation required.

### Option 2: Install via pip
```bash
# Windows users should first install msprime via conda-forge
conda install -c conda-forge msprime

# Then install argscape (start here for Linux/Mac)
pip install argscape
```

To use ARGscape from the command line:
```bash
# Start the web interface
argscape [--host HOST] [--port PORT] [--reload] [--no-browser] [--no-tsdate]

# Options:
#   --host HOST       Host to run the server on (default: 127.0.0.1)
#   --port PORT       Port to run the server on (default: 8000)
#   --reload          Enable auto-reload for development
#   --no-browser      Don't automatically open the web browser
#   --no-tsdate       Disable tsdate temporal inference (enabled by default)
```

Note: The web interface provides full functionality for simulating tree sequences and visualization. Additional CLI commands for direct simulation and visualization are planned for future releases.

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

### Upload Tree Sequences
1. Navigate to the main interface
2. Drag and drop or select `.trees` or `.tsz` files
3. Click "Run" to process and visualize

### Simulate Tree Sequences
1. Use the "Simulate new (msprime)" panel
2. Configure parameters:
   - **Samples**: 2-500 individuals
   - **Trees**: 1-1000 local trees  
   - **Generations**: 1-1000 maximum time
   - **Model**: Population genetics model (default: `dtwf`)
   - **Population size**: Effective population size
   - **Random seed**: For reproducible results
3. Click "Simulate Tree Sequence"

### Visualization Options
- **2D ARG Networks**: Interactive force-directed graphs
- **3D Spatial Maps**: For spatially-embedded data
- **Sample Ordering**: 
  - `degree`: Order by node connectivity
  - `center_minlex`: Minlex postorder at sequence center
  - `first_tree`: Minlex postorder of first tree
  - `custom`: Consensus algorithm across multiple trees
  - `numeric`: Simple numerical order

### Advanced Features
- **Spatial Inference**: Generate coordinates using `fastgaia`
- **Region Filtering**: Visualize specific genomic ranges
- **Tree Filtering**: Focus on particular tree indices
- **Data Export**: Download processed files

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
│   └── backend/                  # Backend application
│       ├── __init__.py
│       ├── main.py               # Main application entry point
│       ├── startup.py            # Application startup logic
│       ├── constants.py          # Application constants
│       ├── session_storage.py    # Session management
│       ├── location_inference.py # Location inference logic
│       ├── midpoint_inference.py # Midpoint inference logic
│       ├── sparg_inference.py    # SPARG inference logic
│       ├── spatial_generation.py # Spatial data generation
│       ├── graph_utils.py        # Graph utility functions
│       ├── requirements-web.txt  # Web dependencies
│       ├── environment.yml       # Conda environment
│       ├── Dockerfile            # Backend container definition
│       ├── geo_utils/            # Geographic utilities
│       ├── sparg/                # SPARG algorithm implementation
│       ├── tskit_utils/          # Tree sequence utilities
├── frontend/                    # Frontend application (TypeScript/React)
│   ├── src/                     # Source code
│   ├── public/                  # Static assets
│   ├── package.json             # Frontend dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── vite.config.ts           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── nginx.conf               # Nginx configuration
│   └── Dockerfile               # Frontend container definition
├── .dockerignore              # Docker ignore rules
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Root Dockerfile
├── LICENSE                    # License file
├── MANIFEST.in               # Python package manifest
├── pyproject.toml            # Python project configuration
├── railway.toml              # Railway deployment config
├── README.md                 # Project documentation
├── setup.cfg                 # Python setup configuration
└── package.json              # Root package.json
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

## Support

- 🌐 **Website**: [argscape.com](https://argscape.com)
- 📖 **API Docs**: Available at `/docs` endpoint
- 🐛 **Issues**: GitHub Issues for bug reports
- 💬 **Discussions**: GitHub Discussions for questions

---

**Note**: This is research software under active development. The API may change between versions. Data is stored temporarily and may be cleared during updates.
