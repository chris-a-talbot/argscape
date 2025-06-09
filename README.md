# ARGscape

**ARGscape** is a comprehensive web application for visualizing and analyzing tree sequences and Ancestral Recombination Graphs (ARGs). Built with React and FastAPI, it aims to provide both an intuitive web interface and powerful computational backend for population genetics research.

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

### Option 2: Local Development

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
   cd backend
   conda env create -f environment-local.yml
   conda activate argscape-local
   uvicorn main:app --reload --port 8000
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

### Option 3: Docker Development

```bash
git clone https://github.com/chris-a-talbot/argscape.git
cd argscape
docker compose up --build
```

Access at http://localhost:5173 (frontend) and http://localhost:8000 (backend).

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
├── frontend/              # React TypeScript app
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── context/       # React contexts
│   │   ├── lib/          # Utilities
│   │   └── config/       # Configuration
│   └── package.json
├── backend/              # FastAPI Python app
│   ├── main.py          # API routes
│   ├── session_storage.py # Session management
│   ├── graph_utils.py   # Visualization utils
│   └── requirements-web.txt
└── docker-compose.yml   # Development setup
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
