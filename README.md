<p align="center">
  <img src="https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/banner.png" alt="ARGscape Banner">
</p>

#

**ARGscape** (v0.4.9) is a comprehensive web application for visualizing and analyzing tree sequences (representing Ancestral Recombination Graphs, or ARGs). Built with React and FastAPI, it aims to provide an intuitive web interface, powerful computational backend, and simple command-line interface for spatiotemporal population genetics research.

🌐 **Live Demo**: [www.argscape.com](https://www.argscape.com) (May be blocked on some networks - working on it!)

![ARGscape Homepage](https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/home.png)

## Citation

**ARGscape** is now in pre-print! If you use it in your work, please cite:

Talbot, C., & Bradburd, G. (2025). ARGscape: A modular, interactive tool for manipulation of spatiotemporal ancestral recombination graphs. ArXiv.org. https://arxiv.org/abs/2510.07255

## Features

### Core
- **File upload & management**: Upload and visualize `.trees` / `.tsz` tree sequences
- **Tree sequence simulation**: Generate data with `msprime` directly in the app
- **Interactive visualization**:
  - 2D ARG (force‑directed)
  - 3D Spatial ARG (for sequences with spatial coordinates)
  - Spatial Diff (compare two spatial sequences)
  - Heatmap (via any spatial visualization, view ancestry heatmap rather than precise locations)
- **Spatial inference**: Estimate locations for internal nodes from genealogical signal
- **Session storage**: Persistent per‑client storage with auto‑cleanup
- **Export**: Download processed tree sequences and rendered images

### Visualization details
- **2D ARG**: pan/zoom, node IDs, edge spans, optional sample ordering strategies
- **3D spatial ARG**: geographic grid, temporal planes, adjustable node/edge styles, heatmap, built-in animations
- **Filtering**: by genomic position, by tree index, and over time (temporal planes)

### Session management
Files are stored in a per‑client session (locally at `dev_storage/` in development) for up to 24h. You can download outputs any time and remove files manually.

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

#### Ancestry Heatmap
View a heatmap of ancestral locations across specific chunks of time.

![Ancestry Heatmap](https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/heatmap.png)

## Quick start

### Option 1: Use the Live Website
Visit [argscape.com](https://argscape.com) to start visualizing tree sequences immediately - no installation required. Storage space and computational power is extremely limited. Please refer to Option 2 below for more intensive uses. 

### Option 2: Local installation (recommended)

Install ARGscape locally for better performance and offline use:

#### Prerequisites
- **Anaconda, Miniconda, or another Conda distribution** ([Download here](https://docs.anaconda.com/anaconda/install/))

#### Installation Steps

1. **Download the environment file**:
   - Visit [argscape.com/install](https://argscape.com/install) and click "Download environment.yml"
   - Or download directly from [GitHub](https://github.com/chris-a-talbot/argscape/blob/dev/argscape/api/environment.yml)

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
   conda activate argscape_local
   

5. **Launch ARGscape**:
   ```bash
   argscape
   ```

6. **Open in browser**:
   ARGscape opens automatically at http://127.0.0.1:8000. Wait 2-3 minutes for startup, then refresh if needed.

#### Command‑line options
```bash
argscape [--host HOST] [--port PORT] [--reload] [--no-browser] [--no-tsdate]

# Options:
#   --host HOST       Host to run the server on (default: 127.0.0.1)
#   --port PORT       Port to run the server on (default: 8000)
#   --reload          Enable auto-reload for development
#   --no-browser      Don't automatically open the web browser
#   --no-tsdate       Disable tsdate temporal inference (enabled by default)
```

### Option 3: Local development

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
   conda env create -f argscape/api/environment.yml
   conda activate argscape_local
   
   # Install the package in development mode
   pip install -e .
   
   # Start the backend server
   uvicorn argscape.api.main:app --reload --port 8000
   ```

Or, to run as if on Railway, use:

   ```
   # Start the backend server
   FORCE_RAILWAY_MODE=true VITE_IS_RAILWAY=true ENABLE_ENCRYPTION=true uvicorn argscape.api.main:app --reload --port 8000
   ```

3. **Frontend setup** (in new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Or, to run as if on Railway, use:

   ```
   VITE_IS_RAILWAY=true npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API docs: http://localhost:8000/docs

### Option 4: Docker development

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

## API reference

Interactive API docs are served at `/docs` when running locally, and at the production `/docs` endpoint when hosted. The OpenAPI schema documents endpoints for upload, simulation, inference, visualization data, and session management.

## Command‑line tools (v0.4.9)

ARGscape 0.4.9 includes a set of CLI tools for running the backend and performing inference from the terminal.

- `argscape` – start the web app (API + UI)
  - Examples:
    - `argscape --no-browser` (local server at http://127.0.0.1:8000)
    - `argscape --host 0.0.0.0 --port 8000`
    - `argscape --no-tsdate` (disable temporal inference to speed startup)

- `argscape_infer` – run spatial/temporal inference
  - Subcommands:
    - `load` – load a `.trees` file into persistent session storage
    - `run` – run an inference method and save the output `.trees`
    - (no subcommand) – interactive mode to pick file/method/output
  - Methods: `midpoint`, `fastgaia`, `gaia-quadratic`, `gaia-linear`, `sparg`, `tsdate`
  - Examples:
    - `argscape_infer load --file /path/data.trees --name demo`
    - `argscape_infer run --name demo --method midpoint --output ./out`
    - `argscape_infer run --input /path/data.trees --method tsdate --output ./out`

- `argscape_load` – manage persistent session storage
  - Subcommands:
    - `load` – load a `.trees` file: `argscape_load load --file /path/data.trees --name demo`
    - `list` – list stored names: `argscape_load list`
    - `rm` – remove by name: `argscape_load rm --name demo`
    - `clear` – remove all files from the CLI session: `argscape_load clear`
    - `load-with-locations` – load `.trees` and apply CSV locations:
      ```bash
      argscape_load load-with-locations \
        --file /path/data.trees \
        --sample-csv /path/sample_locations.csv \
        --node-csv /path/node_locations.csv \
        --name demo \
        --output ./out
      ```
      CSVs must include columns: `node_id,x,y[,z]`. Samples must cover all sample node IDs; node CSV must cover all internal node IDs.

Notes
- Session storage is keyed per client; the above commands use a stable CLI session so data is available to both the web UI and CLI.
- In 0.4.9 the visualization snapshot command (`argscape_vis`) is temporarily disabled while it's stabilized.

## Development

## File formats

### Supported inputs
- **`.trees`**: Standard tskit tree sequence format
- **`.tsz`**: Compressed tree sequence format

### Generated outputs
- Tree sequences with updated inferred locations or node ages
- Visualization data

## Performance notes

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

## Acknowledgments

- **tskit development team** for testing, feedback, and the `tskit` tree sequence simulation and analysis tools
- **Michael Grundler** and the **Bradburd Lab** for funding, support, testing, feedback, and the `gaia` algorithms
- **James Kitchens** and the **Coop Lab** for testing, feedback, and the `sparg` algorithm
- **Philipp Messer** and the **Messer Lab** for continued support

## Support

- 🌐 **Website**: [www.argscape.com](https://www.argscape.com)
- 📖 **API Docs**: Available at `/docs` endpoint
- 🐛 **Issues**: GitHub Issues for bug reports
- 💬 **Discussions**: GitHub Discussions for questions

---

**Note**: This is research software under active development. The API may change between versions. Data is stored temporarily and may be cleared during updates.
