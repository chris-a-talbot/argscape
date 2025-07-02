# ARGscape

![ARGscape Banner](https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/banner.png)

**ARGscape** (v0.1.9) is a comprehensive web application for visualizing and analyzing tree sequences and Ancestral Recombination Graphs (ARGs). Built with React and FastAPI, it aims to provide both an intuitive web interface and powerful computational backend for population genetics research.

🌐 **Live Demo**: [www.argscape.com](https://www.argscape.com)  

![ARGscape Homepage](https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/home.png)

## Features

### Core Functionality
- **File Upload & Management**: Upload and visualize `.trees` and `.tsz` tree sequence files
- **Tree Sequence Simulation**: Generate new tree sequences using `msprime` with customizable parameters
- **Interactive Visualization**: 
  - 2D ARG network visualization with force-directed layouts
  - 3D spatial visualization for spatially-embedded tree sequences
  - Multiple sample ordering algorithms
- **Location Inference**: Generate spatial coordinates based on genealogical relationships
- **Session Management**: Secure temporary file storage with automatic cleanup
- **Data Export**: Download processed tree sequences and visualizations

### Visualization Capabilities
- **2D ARG Visualizations**: Interactive visualizations of genealogical relationships
- **Sample Ordering**: Multiple algorithms for optimal sample arrangement
- **3D Spatial ARG Visualizations**: Three-dimensional visualization of spatially-embedded samples
- **Customizable Rendering**: Adjustable node sizes, edge styles, colors, and layouts
- **Tree Filtering**: Visualize specific genomic regions or tree index ranges
- **Temporal Filtering**: Highlight specific temporal spans

### Session Management

- **Temporary storage**: Files stored securely for up to 24 hours
- **Session persistence**: Continue work across browser sessions
- **Data export**: Download processed tree sequences and visualizations
- **Cleanup**: Remove files manually or wait for automatic cleanup

### Advanced Features
- **Batch Processing**: Handle multiple files per session
- **Custom color themes**: Personalize visualization appearance
- **Differential Visualization**: Compare multiple tree sequences with spatial data

## Visualization Gallery

### 2D Network Visualization
Interactive force-directed layouts showing genealogical relationships with node IDs and genomic spans.

![2D ARG Visualization](https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/2D.png)

#### Genomic Filtering
Navigate through specific genomic regions using the interactive slider.

![Genomic Slider](https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/genomic_slider.png)

### 3D Spatial Visualization
Three-dimensional rendering of spatially-embedded tree sequences with geographic context.

![3D ARG Visualization](https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/3D.png)

#### Temporal Filtering
Explore different time periods using the temporal slider controls.

![Temporal Slider](https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/temporal_slider.png)

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

## API Reference

Full API documentation available at `/docs` when running locally.

## Development

### Project Structure
```
argscape/
├── argscape/                     # Main Python package
│   ├── cli.py                    # Command-line interface
│   ├── frontend_dist/            # Compiled frontend assets
│   └── backend/                  # Backend application
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
│   ├── nginx.conf               # Nginx configuration
│   ├── components.json          # shadcn/ui components config
│   └── Dockerfile               # Frontend container definition
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Root Dockerfile
├── pyproject.toml              # Python project configuration
├── railway.toml                # Railway deployment config
├── setup.cfg                   # Python setup configuration
├── package.json                # Root package.json
```

## File Formats

### Supported Inputs
- **`.trees`**: Standard tskit tree sequence format
- **`.tsz`**: Compressed tree sequence format

### Generated Outputs
- Tree sequences with updated inferred locations or node ages
- Visualization data

## Performance Notes

- **File Size**: Recommended < 100MB per upload
- **Samples**: Optimal performance with < 1000 nodes
- **Sessions**: Automatic cleanup after 24 hours (including on local hosting, for now)

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
